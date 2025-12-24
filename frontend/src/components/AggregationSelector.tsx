import { Label } from "@/components/ui/label";
import { Calendar, CalendarDays } from "lucide-react";

interface AggregationSelectorProps {
  selectedAggregation: string;
  onAggregationChange: (aggregation: string) => void;
}

const aggregations = [
  { id: "daily", label: "Journalier", icon: Calendar },
  { id: "monthly", label: "Mensuel", icon: CalendarDays },
];

export function AggregationSelector({ selectedAggregation, onAggregationChange }: AggregationSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Agrégation Temporelle
      </Label>
      <div className="flex gap-3">
        {aggregations.map((agg) => {
          const isSelected = selectedAggregation === agg.id;
          const Icon = agg.icon;
          return (
            <button
              key={agg.id}
              onClick={() => onAggregationChange(agg.id)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 flex-1
                ${isSelected 
                  ? 'glass glow-primary border-primary/50 text-foreground' 
                  : 'bg-secondary/50 hover:bg-secondary border border-transparent text-muted-foreground'
                }
              `}
            >
              <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : ''}`} />
              <span className="font-medium">{agg.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
