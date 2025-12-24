import { useEffect, useState } from 'react';
import { api, MapDataResponse } from '@/services/api';
import { Loader2, AlertCircle, MapPin, Key } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface MapViewProps {
  selectedRegion: string;
  hasData: boolean;
  selectedVariable?: string;
  startDate?: Date;
  endDate?: Date;
}

// Composants de chargement et erreur
function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function ErrorMessage({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <p className="text-destructive font-medium">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-sm text-muted-foreground hover:text-foreground">
          Réessayer
        </button>
      )}
    </div>
  );
}

// Fonction pour obtenir la couleur selon la valeur
function getColor(value: number, variable: string): string {
  if (variable === 'temperature') {
    if (value < 15) return '#3b82f6';
    if (value < 20) return '#22c55e';
    if (value < 25) return '#eab308';
    if (value < 30) return '#f97316';
    return '#ef4444';
  } else {
    if (value < 0.5) return '#fef3c7';
    if (value < 1) return '#93c5fd';
    if (value < 2) return '#3b82f6';
    if (value < 4) return '#1d4ed8';
    return '#1e3a8a';
  }
}

// Coordonnées des régions
const regionCoordinates: Record<string, { lat: number; lng: number }> = {
  'Elheri': { lat: 33.5, lng: -6.8 },
  'Elmassira': { lat: 32.5, lng: -7.5 },
  'OumErrbia': { lat: 32.8, lng: -7.2 },
};

export function MapView({ selectedRegion, hasData, selectedVariable = 'temperature', startDate, endDate }: MapViewProps) {
  const [mapData, setMapData] = useState<MapDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>("");
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!hasData || !selectedRegion || !startDate || !endDate) {
      setMapData(null);
      return;
    }

    const loadMapData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        
        const data = await api.getMapData({
          variable: selectedVariable,
          region: selectedRegion,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate),
        });

        setMapData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement de la carte';
        setError(errorMessage);
        console.error('Erreur MapView:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMapData();
  }, [hasData, selectedRegion, selectedVariable, startDate, endDate]);

  // Initialiser Google Maps
  useEffect(() => {
    if (!isApiKeySet || !mapData) return;

    const loadGoogleMaps = () => {
      if (window.google) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    };

    const initMap = () => {
      const mapElement = document.getElementById('google-map');
      if (!mapElement) return;

      const center = regionCoordinates[selectedRegion] || { lat: 32.8, lng: -7.2 };
      
      const googleMap = new google.maps.Map(mapElement, {
        center: center,
        zoom: 8,
        mapTypeId: 'terrain',
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#1e293b' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#0f172a' }]
          }
        ]
      });

      setMap(googleMap);

      // Créer un marqueur
      const color = getColor(mapData!.temporal_mean, selectedVariable);
      
      const mapMarker = new google.maps.Marker({
        position: center,
        map: googleMap,
        title: selectedRegion,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: color,
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        }
      });

      // InfoWindow
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; color: #000;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${mapData!.region}</h3>
            <p style="margin: 4px 0; text-transform: capitalize;">${mapData!.variable}</p>
            <p style="font-size: 20px; font-weight: bold; color: ${color}; margin: 4px 0;">
              ${mapData!.temporal_mean.toFixed(2)} ${mapData!.unit}
            </p>
            <p style="font-size: 12px; color: #666; margin-top: 4px;">Moyenne temporelle</p>
          </div>
        `
      });

      mapMarker.addListener('click', () => {
        infoWindow.open(googleMap, mapMarker);
      });

      setMarker(mapMarker);
    };

    loadGoogleMaps();
  }, [isApiKeySet, mapData, selectedRegion, selectedVariable, googleMapsApiKey]);

  const handleSetApiKey = () => {
    if (googleMapsApiKey.trim()) {
      setIsApiKeySet(true);
    }
  };

  if (!hasData) {
    return (
      <div className="glass rounded-2xl p-8 h-[500px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-6xl mb-4">🗺️</div>
          <p className="text-lg">Sélectionnez vos paramètres et cliquez sur "Visualiser"</p>
          <p className="text-sm mt-2">La carte affichera la moyenne temporelle de la variable sélectionnée</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-8 h-[500px]">
        <LoadingSpinner message="Chargement de la carte..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 h-[500px]">
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="glass rounded-2xl p-8 h-[500px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg">Aucune donnée cartographique disponible</p>
        </div>
      </div>
    );
  }

  // Demande de clé API Google Maps
  if (!isApiKeySet) {
    return (
      <div className="glass rounded-2xl p-8 h-[500px] flex items-center justify-center animate-fade-in">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="p-4 rounded-2xl bg-primary/20 w-fit mx-auto mb-4">
              <MapPin className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Configuration Google Maps</h3>
            <p className="text-sm text-muted-foreground">
              Entrez votre clé API Google Maps pour activer la carte interactive.
              <a 
                href="https://developers.google.com/maps/documentation/javascript/get-api-key" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                Obtenir une clé API →
              </a>
            </p>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="google-maps-key" className="text-sm text-muted-foreground">
              Clé API Google Maps
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="google-maps-key"
                  type="password"
                  placeholder="AIzaSy..."
                  value={googleMapsApiKey}
                  onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
              <Button variant="visualize" onClick={handleSetApiKey}>
                Activer
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const color = getColor(mapData.temporal_mean, selectedVariable);

  return (
    <div className="glass rounded-2xl p-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">
            Vue cartographique - Google Maps
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Région:</span>
          <span className="text-primary font-medium">{mapData.region}</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="mb-4 p-4 glass rounded-lg">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Variable
            </p>
            <p className="text-sm font-medium text-foreground capitalize">
              {mapData.variable}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Moyenne temporelle
            </p>
            <p className="text-2xl font-bold text-primary">
              {mapData.temporal_mean.toFixed(2)} {mapData.unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Période analysée
            </p>
            <p className="text-sm text-foreground">
              {startDate && endDate 
                ? `${startDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}`
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Carte Google Maps */}
      <div className="relative w-full h-[450px] rounded-xl overflow-hidden border border-border/50">
        <div id="google-map" className="w-full h-full" />

        {/* Légende */}
        <div className="absolute bottom-4 left-4 glass rounded-lg p-3 text-xs backdrop-blur-md">
          <div className="font-semibold text-foreground mb-2">
            {selectedVariable === 'temperature' ? 'Température (°C)' : 'Précipitation (mm)'}
          </div>
          <div className="space-y-1.5">
            {selectedVariable === 'temperature' ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 rounded border border-border/30" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-muted-foreground">&lt; 15°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 rounded border border-border/30" style={{ backgroundColor: '#22c55e' }}></div>
                  <span className="text-muted-foreground">15-20°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 rounded border border-border/30" style={{ backgroundColor: '#eab308' }}></div>
                  <span className="text-muted-foreground">20-25°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 rounded border border-border/30" style={{ backgroundColor: '#f97316' }}></div>
                  <span className="text-muted-foreground">25-30°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 rounded border border-border/30" style={{ backgroundColor: '#ef4444' }}></div>
                  <span className="text-muted-foreground">&gt; 30°C</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 rounded border border-border/30" style={{ backgroundColor: '#fef3c7' }}></div>
                  <span className="text-muted-foreground">&lt; 0.5mm</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 rounded border border-border/30" style={{ backgroundColor: '#93c5fd' }}></div>
                  <span className="text-muted-foreground">0.5-1mm</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 rounded border border-border/30" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-muted-foreground">1-2mm</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 rounded border border-border/30" style={{ backgroundColor: '#1d4ed8' }}></div>
                  <span className="text-muted-foreground">2-4mm</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 rounded border border-border/30" style={{ backgroundColor: '#1e3a8a' }}></div>
                  <span className="text-muted-foreground">&gt; 4mm</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}