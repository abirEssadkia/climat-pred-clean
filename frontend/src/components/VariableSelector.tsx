import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Thermometer, CloudRain, Check } from "lucide-react";

interface VariableSelectorProps {
  selectedVariables: string[];
  onVariablesChange: (variables: string[]) => void;
  singleSelect?: boolean;
}

const variables = [
  { id: "temperature", label: "Température", unit: "°C", icon: Thermometer, color: "text-orange-500" },
  { id: "precipitation", label: "Précipitation", unit: "mm", icon: CloudRain, color: "text-blue-500" },
];

export function VariableSelector({
  selectedVariables,
  onVariablesChange,
  singleSelect = false,
}: VariableSelectorProps) {
  const handleToggle = (variableId: string) => {
    if (singleSelect) {
      // Mode carte : une seule variable
      onVariablesChange([variableId]);
    } else {
      // Mode séries temporelles : plusieurs variables
      if (selectedVariables.includes(variableId)) {
        onVariablesChange(selectedVariables.filter((v) => v !== variableId));
      } else {
        onVariablesChange([...selectedVariables, variableId]);
      }
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Variables {singleSelect ? "(Sélection unique)" : "(Sélection multiple)"}
      </Label>
      <div className="flex flex-wrap gap-3">
        {variables.map((variable) => {
          const isSelected = selectedVariables.includes(variable.id);
          const Icon = variable.icon;
          
          return (
            <div
              key={variable.id}
              onClick={() => handleToggle(variable.id)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-300
                ${isSelected
                  ? 'glass glow-primary border-primary/50'
                  : 'bg-secondary/50 hover:bg-secondary border border-transparent'
                }
              `}
            >
              {/* Afficher checkbox ou indicateur de sélection */}
              {singleSelect ? (
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                </div>
              ) : (
                <Checkbox 
                  checked={isSelected}
                  onCheckedChange={() => handleToggle(variable.id)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              )}
              
              <Icon className={`h-5 w-5 ${isSelected ? variable.color : 'text-muted-foreground'}`} />
              
              <span className={`font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                {variable.label}
              </span>
              
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {variable.unit}
              </span>
            </div>
          );
        })}
      </div>
      
      {!singleSelect && selectedVariables.length === 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          ⚠️ Sélectionnez au moins une variable
        </p>
      )}
    </div>
  );
}