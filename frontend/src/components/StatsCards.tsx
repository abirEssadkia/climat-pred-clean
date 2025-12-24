import { TrendingDown, Activity, TrendingUp, BarChart3 } from "lucide-react";

interface StatsCardsProps {
  selectedVariables: string[];
  hasData: boolean;
}

const temperatureStats = {
  min: { value: "5.93", unit: "°C", icon: TrendingDown },
  mean: { value: "19.71", unit: "°C", icon: Activity },
  max: { value: "32.70", unit: "°C", icon: TrendingUp },
  stdDev: { value: "6.97", unit: "°C", icon: BarChart3 },
};

const precipitationStats = {
  min: { value: "0.00", unit: "mm", icon: TrendingDown },
  mean: { value: "0.49", unit: "mm", icon: Activity },
  max: { value: "8.55", unit: "mm", icon: TrendingUp },
  stdDev: { value: "1.17", unit: "mm", icon: BarChart3 },
};

export function StatsCards({ selectedVariables, hasData }: StatsCardsProps) {
  if (!hasData || selectedVariables.length === 0) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {selectedVariables.includes("temperature") && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-temperature flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-temperature" />
            Température
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(temperatureStats).map(([key, stat], index) => {
              const Icon = stat.icon;
              const labels: Record<string, string> = {
                min: "Min",
                mean: "Moyenne",
                max: "Max",
                stdDev: "Écart-type"
              };
              return (
                <div 
                  key={key} 
                  className="glass rounded-xl p-4 glow-temperature transition-all duration-300 hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">{labels[key]}</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                    <span className="text-sm font-normal text-muted-foreground ml-1">{stat.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedVariables.includes("precipitation") && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-precipitation flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-precipitation" />
            Précipitation
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(precipitationStats).map(([key, stat], index) => {
              const Icon = stat.icon;
              const labels: Record<string, string> = {
                min: "Min",
                mean: "Moyenne",
                max: "Max",
                stdDev: "Écart-type"
              };
              return (
                <div 
                  key={key} 
                  className="glass rounded-xl p-4 glow-precipitation transition-all duration-300 hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">{labels[key]}</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                    <span className="text-sm font-normal text-muted-foreground ml-1">{stat.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
