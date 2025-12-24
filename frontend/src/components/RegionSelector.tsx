import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Loader2 } from "lucide-react";
import { api, Region } from "@/services/api";

interface RegionSelectorProps {
  selectedRegion: string;
  onRegionChange: (region: string) => void;
}

export function RegionSelector({ selectedRegion, onRegionChange }: RegionSelectorProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les régions depuis l'API au montage du composant
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setIsLoading(true);
        const data = await api.getRegions();
        setRegions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
        console.error("Erreur lors du chargement des régions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegions();
  }, []);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Région d'intérêt
      </Label>
      <Select value={selectedRegion} onValueChange={onRegionChange} disabled={isLoading}>
        <SelectTrigger className="w-full glass border-border/50 h-12">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            ) : (
              <MapPin className="h-4 w-4 text-primary" />
            )}
            <SelectValue placeholder={
              isLoading ? "Chargement..." : 
              error ? "Erreur de chargement" :
              "Sélectionnez une région"
            } />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {regions.map((region) => (
            <SelectItem 
              key={region.id} 
              value={region.id}
              className="hover:bg-accent focus:bg-accent"
            >
              {region.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}