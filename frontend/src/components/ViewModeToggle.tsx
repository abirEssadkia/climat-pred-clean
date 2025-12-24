import { LineChart, Map } from "lucide-react";

interface ViewModeToggleProps {
  viewMode: "timeseries" | "map";
  onViewModeChange: (mode: "timeseries" | "map") => void;
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-2 p-1 glass rounded-lg">
      <button
        onClick={() => onViewModeChange("timeseries")}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300
          ${viewMode === "timeseries" 
            ? 'bg-primary text-primary-foreground' 
            : 'text-muted-foreground hover:text-foreground'
          }
        `}
      >
        <LineChart className="h-4 w-4" />
        <span className="font-medium">Séries temporelles</span>
      </button>
      <button
        onClick={() => onViewModeChange("map")}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300
          ${viewMode === "map" 
            ? 'bg-primary text-primary-foreground' 
            : 'text-muted-foreground hover:text-foreground'
          }
        `}
      >
        <Map className="h-4 w-4" />
        <span className="font-medium">Carte</span>
      </button>
    </div>
  );
}
