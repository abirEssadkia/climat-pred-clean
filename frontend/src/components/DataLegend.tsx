import { Database, Brain } from "lucide-react";

interface DataLegendProps {
  showPredicted?: boolean;
}

export function DataLegend({ showPredicted = true }: DataLegendProps) {
  return (
    <div className="glass rounded-xl p-4 animate-fade-in">
      <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Légende</h4>
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
            <Database className="h-4 w-4 text-primary" />
            <div className="w-8 h-0.5 bg-primary rounded"></div>
            <span className="text-sm text-muted-foreground">Données réelles</span>
          </div>
        </div>
        {showPredicted && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
              <Brain className="h-4 w-4 text-accent" />
              <div className="w-8 h-0.5 bg-accent rounded border-dashed border-t-2 border-accent"></div>
              <span className="text-sm text-muted-foreground">Données prédites (ML)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
