from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
import xarray as xr
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os
import pickle

@api_view(['POST'])
def visualize_data(request):
    """
    Endpoint pour visualiser les données climatiques avec prédictions ML
    """
    try:
        # Récupération des paramètres
        variables = request.data.get('variables', [])
        aggregation = request.data.get('aggregation', 'Daily')
        region_name = request.data.get('region')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        # Validation
        if not variables:
            return Response({'error': 'Aucune variable sélectionnée'}, status=400)
        
        if not region_name:
            return Response({'error': 'Aucune région sélectionnée'}, status=400)
        
        if not start_date or not end_date:
            return Response({'error': 'Dates manquantes'}, status=400)
        
        result = {}
        
        # Chemin vers les fichiers
        data_dir = os.path.join(settings.BASE_DIR, 'data')
        
        # Convertir les dates en objets datetime
        start_dt = pd.to_datetime(start_date)
        end_dt = pd.to_datetime(end_date)
        
        # Traiter la température
        if 'temperature' in variables:
            temp_file = os.path.join(data_dir, 'T2m.nc')
            model_temp_file = os.path.join(data_dir, 'Model_temp.pkl')
            
            if os.path.exists(temp_file):
                ds_temp = xr.open_dataset(temp_file)
                
                # Obtenir la dernière date disponible dans les données
                last_available_date = pd.to_datetime(ds_temp.time.values[-1])
                
                # Séparer les données réelles et les prédictions
                dates_list = []
                values_list = []
                is_predicted_list = []
                
                # 1. Charger les données réelles disponibles
                if start_dt <= last_available_date:
                    real_end = min(end_dt, last_available_date)
                    temp_data = ds_temp.sel(time=slice(start_date, real_end.strftime('%Y-%m-%d')))
                    
                    # Calculer la moyenne spatiale
                    temp_mean = temp_data['t2m'].mean(dim=['lat', 'lon'])
                    
                    # Agrégation temporelle
                    if aggregation == 'Monthly':
                        temp_mean = temp_mean.resample(time='1M').mean()
                    
                    # Ajouter aux listes
                    for date, value in zip(temp_mean.time.values, temp_mean.values):
                        dates_list.append(pd.to_datetime(date).strftime('%Y-%m-%d'))
                        values_list.append(float(value))
                        is_predicted_list.append(False)
                
                # 2. Prédire les données futures si nécessaire
                if end_dt > last_available_date and os.path.exists(model_temp_file):
                    # Charger le modèle ML
                    with open(model_temp_file, 'rb') as f:
                        model_temp = pickle.load(f)
                    
                    # Prédire jour par jour depuis la dernière date disponible
                    current_date = last_available_date + timedelta(days=1)
                    
                    while current_date <= end_dt:
                        # Obtenir les 7 jours précédents pour la prédiction
                        lookback_start = current_date - timedelta(days=7)
                        lookback_data = ds_temp.sel(time=slice(
                            lookback_start.strftime('%Y-%m-%d'),
                            (current_date - timedelta(days=1)).strftime('%Y-%m-%d')
                        ))
                        
                        # Calculer la moyenne spatiale des 7 jours
                        lookback_mean = lookback_data['t2m'].mean(dim=['lat', 'lon']).values
                        
                        if len(lookback_mean) == 7:
                            try:
                                # Prédire la température
                                # Le modèle attend la moyenne des 7 jours comme entrée
                                input_features = np.array([lookback_mean.mean()]).reshape(1, -1)
                                predicted_temp = model_temp.predict(input_features)[0]
                                
                                dates_list.append(current_date.strftime('%Y-%m-%d'))
                                values_list.append(float(predicted_temp))
                                is_predicted_list.append(True)
                            except Exception as e:
                                print(f"Erreur prédiction température: {e}")
                                # Utiliser la moyenne des 7 jours comme fallback
                                dates_list.append(current_date.strftime('%Y-%m-%d'))
                                values_list.append(float(lookback_mean.mean()))
                                is_predicted_list.append(True)
                        
                        current_date += timedelta(days=1)
                
                result['temperature'] = {
                    'dates': dates_list,
                    'values': values_list,
                    'is_predicted': is_predicted_list,
                    'unit': '°C',
                    'region': region_name
                }
                
                ds_temp.close()
            else:
                result['temperature'] = {'error': f'Fichier T2m.nc introuvable'}
        
        # Traiter la précipitation
        if 'precipitation' in variables:
            precip_file = os.path.join(data_dir, 'Tp.nc')
            model_precip_file = os.path.join(data_dir, 'Model_precip.pkl')
            
            if os.path.exists(precip_file):
                ds_precip = xr.open_dataset(precip_file)
                
                # Obtenir la dernière date disponible
                last_available_date = pd.to_datetime(ds_precip.time.values[-1])
                
                dates_list = []
                values_list = []
                is_predicted_list = []
                
                # 1. Charger les données réelles
                if start_dt <= last_available_date:
                    real_end = min(end_dt, last_available_date)
                    precip_data = ds_precip.sel(time=slice(start_date, real_end.strftime('%Y-%m-%d')))
                    
                    precip_mean = precip_data['tp'].mean(dim=['lat', 'lon'])
                    
                    if aggregation == 'Monthly':
                        precip_mean = precip_mean.resample(time='1M').sum()
                    
                    for date, value in zip(precip_mean.time.values, precip_mean.values):
                        dates_list.append(pd.to_datetime(date).strftime('%Y-%m-%d'))
                        values_list.append(float(value))
                        is_predicted_list.append(False)
                
                # 2. Prédire les données futures
                if end_dt > last_available_date and os.path.exists(model_precip_file):
                    with open(model_precip_file, 'rb') as f:
                        model_precip = pickle.load(f)
                    
                    current_date = last_available_date + timedelta(days=1)
                    
                    while current_date <= end_dt:
                        # Obtenir les 15 jours précédents
                        lookback_start = current_date - timedelta(days=15)
                        lookback_data = ds_precip.sel(time=slice(
                            lookback_start.strftime('%Y-%m-%d'),
                            (current_date - timedelta(days=1)).strftime('%Y-%m-%d')
                        ))
                        
                        lookback_mean = lookback_data['tp'].mean(dim=['lat', 'lon']).values
                        
                        if len(lookback_mean) == 15:
                            try:
                                # Prédire la précipitation
                                input_features = np.array([lookback_mean.mean()]).reshape(1, -1)
                                predicted_precip = model_precip.predict(input_features)[0]
                                
                                dates_list.append(current_date.strftime('%Y-%m-%d'))
                                values_list.append(float(predicted_precip))
                                is_predicted_list.append(True)
                            except Exception as e:
                                print(f"Erreur prédiction précipitation: {e}")
                                # Utiliser la moyenne des 15 jours comme fallback
                                dates_list.append(current_date.strftime('%Y-%m-%d'))
                                values_list.append(float(lookback_mean.mean()))
                                is_predicted_list.append(True)
                        
                        current_date += timedelta(days=1)
                
                result['precipitation'] = {
                    'dates': dates_list,
                    'values': values_list,
                    'is_predicted': is_predicted_list,
                    'unit': 'mm',
                    'region': region_name
                }
                
                ds_precip.close()
            else:
                result['precipitation'] = {'error': f'Fichier Tp.nc introuvable'}
        
        return Response(result)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def get_regions(request):
    """
    Endpoint pour récupérer la liste des régions disponibles
    """
    regions = [
        {'id': 'Elheri', 'name': 'Elheri'},
        {'id': 'Elmassira', 'name': 'Elmassira'},
        {'id': 'OumErrbia', 'name': 'Oum Errbia'},
    ]
    return Response(regions)


@api_view(['GET'])
def health_check(request):
    """
    Endpoint de vérification du serveur
    """
    data_dir = os.path.join(settings.BASE_DIR, 'data')
    
    status = {
        'status': 'ok',
        'message': 'Backend is running',
        'data_files': {
            'T2m.nc': os.path.exists(os.path.join(data_dir, 'T2m.nc')),
            'Tp.nc': os.path.exists(os.path.join(data_dir, 'Tp.nc')),
            'Model_temp.pkl': os.path.exists(os.path.join(data_dir, 'Model_temp.pkl')),
            'Model_precip.pkl': os.path.exists(os.path.join(data_dir, 'Model_precip.pkl')),
        }
    }
    
    return Response(status)


@api_view(['POST'])
def map_data(request):
    """
    Endpoint pour récupérer les données cartographiques (moyenne temporelle)
    """
    try:
        variable = request.data.get('variable', 'temperature')
        region_name = request.data.get('region')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        if not region_name:
            return Response({'error': 'Région manquante'}, status=400)
        
        data_dir = os.path.join(settings.BASE_DIR, 'data')
        
        # Coordonnées approximatives des régions (centre)
        region_coords = {
            'Elheri': {'lat': 31.5, 'lon': -7.5},
            'Elmassira': {'lat': 32.0, 'lon': -8.0},
            'OumErrbia': {'lat': 32.5, 'lon': -6.5},
        }
        
        result = {
            'region': region_name,
            'coordinates': region_coords.get(region_name, {'lat': 32, 'lon': -7}),
            'temporal_mean': None,
            'unit': '',
        }
        
        # Calculer la moyenne temporelle
        if variable == 'temperature':
            temp_file = os.path.join(data_dir, 'T2m.nc')
            if os.path.exists(temp_file):
                ds = xr.open_dataset(temp_file)
                temp_data = ds.sel(time=slice(start_date, end_date))
                mean_value = float(temp_data['t2m'].mean().values)
                
                result['temporal_mean'] = mean_value
                result['unit'] = '°C'
                result['variable'] = 'Température'
                ds.close()
        else:  # precipitation
            precip_file = os.path.join(data_dir, 'Tp.nc')
            if os.path.exists(precip_file):
                ds = xr.open_dataset(precip_file)
                precip_data = ds.sel(time=slice(start_date, end_date))
                mean_value = float(precip_data['tp'].mean().values)
                
                result['temporal_mean'] = mean_value
                result['unit'] = 'mm'
                result['variable'] = 'Précipitation'
                ds.close()
        
        return Response(result)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)