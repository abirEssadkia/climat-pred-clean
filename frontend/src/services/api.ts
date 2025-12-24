// Base URL de l'API Django
const API_BASE_URL = 'http://localhost:8000/api';

// Types TypeScript
export interface Region {
  id: string;
  name: string;
}

export interface VisualizeRequest {
  variables: string[];
  aggregation: string;
  region: string;
  start_date: string;
  end_date: string;
}

export interface TemperatureData {
  dates: string[];
  values: number[];
  is_predicted: boolean[];
  unit: string;
  region: string;
}

export interface PrecipitationData {
  dates: string[];
  values: number[];
  is_predicted: boolean[];
  unit: string;
  region: string;
}

export interface VisualizeResponse {
  temperature?: TemperatureData;
  precipitation?: PrecipitationData;
}

export interface HealthCheckResponse {
  status: string;
  message: string;
  data_files: {
    'T2m.nc': boolean;
    'Tp.nc': boolean;
    'Model_temp.pkl': boolean;
    'Model_precip.pkl': boolean;
  };
}

export interface MapDataRequest {
  variable: string;
  region: string;
  start_date: string;
  end_date: string;
}

export interface MapDataResponse {
  region: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  temporal_mean: number;
  unit: string;
  variable: string;
}

// Service API
export const api = {
  /**
   * Health check - Vérifier que le backend fonctionne
   */
  healthCheck: async (): Promise<HealthCheckResponse> => {
    const response = await fetch(`${API_BASE_URL}/health/`);
    if (!response.ok) {
      throw new Error('Erreur lors de la vérification du backend');
    }
    return response.json();
  },

  /**
   * Récupérer la liste des régions
   */
  getRegions: async (): Promise<Region[]> => {
    const response = await fetch(`${API_BASE_URL}/regions/`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des régions');
    }
    return response.json();
  },

  /**
   * Récupérer les données climatiques pour visualisation
   */
  visualizeData: async (data: VisualizeRequest): Promise<VisualizeResponse> => {
    const response = await fetch(`${API_BASE_URL}/visualize/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des données');
    }

    return response.json();
  },

  /**
   * Récupérer les données pour la carte (moyenne temporelle)
   */
  getMapData: async (data: MapDataRequest): Promise<MapDataResponse> => {
    const response = await fetch(`${API_BASE_URL}/map/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des données cartographiques');
    }

    return response.json();
  },
};