import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo } from "react";
import { VisualizeResponse } from "@/services/api";

interface TimeSeriesChartProps {
  selectedVariables: string[];
  startDate: Date | undefined;
  endDate: Date | undefined;
  hasData: boolean;
  chartData: VisualizeResponse | null;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isPredicted = payload[0]?.payload?.isPredicted;
    return (
      <div className="glass rounded-xl p-4 border border-border/50 shadow-xl">
        <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
        {isPredicted !== undefined && (
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${isPredicted ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}`}>
              {isPredicted ? '🔮 Prédiction ML' : '📊 Données réelles'}
            </span>
          </div>
        )}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold text-foreground">{entry.value?.toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function TimeSeriesChart({ selectedVariables, startDate, endDate, hasData, chartData }: TimeSeriesChartProps) {
  const data = useMemo(() => {
    if (!chartData) return [];

    // Combiner les données de température et précipitation
    const combinedData: any[] = [];
    const dateMap = new Map();

    // Traiter les données de température
    if (chartData.temperature && selectedVariables.includes("temperature")) {
      chartData.temperature.dates.forEach((date, index) => {
        const value = chartData.temperature!.values[index];
        const isPredicted = chartData.temperature!.is_predicted[index];
        
        if (!dateMap.has(date)) {
          dateMap.set(date, {
            date: format(parseISO(date), "MMM yyyy", { locale: fr }),
            fullDate: date,
            isPredicted: isPredicted,
          });
        }
        
        dateMap.get(date).temperature = value;
        // Séparer données réelles et prédites
        if (isPredicted) {
          dateMap.get(date).temperatureReal = null;
          dateMap.get(date).temperaturePredicted = value;
        } else {
          dateMap.get(date).temperatureReal = value;
          dateMap.get(date).temperaturePredicted = null;
        }
      });
    }

    // Traiter les données de précipitation
    if (chartData.precipitation && selectedVariables.includes("precipitation")) {
      chartData.precipitation.dates.forEach((date, index) => {
        const value = chartData.precipitation!.values[index];
        const isPredicted = chartData.precipitation!.is_predicted[index];
        
        if (!dateMap.has(date)) {
          dateMap.set(date, {
            date: format(parseISO(date), "MMM yyyy", { locale: fr }),
            fullDate: date,
            isPredicted: isPredicted,
          });
        }
        
        dateMap.get(date).precipitation = value;
        // Séparer données réelles et prédites
        if (isPredicted) {
          dateMap.get(date).precipitationReal = null;
          dateMap.get(date).precipitationPredicted = value;
        } else {
          dateMap.get(date).precipitationReal = value;
          dateMap.get(date).precipitationPredicted = null;
        }
      });
    }

    // Convertir la Map en tableau et trier par date
    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
    );
  }, [chartData, selectedVariables]);

  if (!hasData || !startDate || !endDate || selectedVariables.length === 0 || !chartData) {
    return (
      <div className="glass rounded-2xl p-8 h-[400px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg">Sélectionnez vos paramètres et cliquez sur "Visualiser"</p>
        </div>
      </div>
    );
  }

  const dateRangeText = `${format(startDate, "d MMM yyyy", { locale: fr })} - ${format(endDate, "d MMM yyyy", { locale: fr })}`;

  return (
    <div className="glass rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold text-foreground">
          Analyse des données climatiques
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-primary rounded"></div>
            <span className="text-muted-foreground">Données réelles</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-accent rounded" style={{ 
              background: 'repeating-linear-gradient(90deg, hsl(var(--accent)) 0px, hsl(var(--accent)) 4px, transparent 4px, transparent 8px)' 
            }}></div>
            <span className="text-muted-foreground">Prédictions ML</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{dateRangeText}</p>
      
      {/* Afficher des infos sur les données chargées */}
      <div className="mb-4 text-xs text-muted-foreground">
        {chartData.temperature && (
          <span className="mr-4">
            🌡️ {chartData.temperature.values.length} points de température
          </span>
        )}
        {chartData.precipitation && (
          <span>
            🌧️ {chartData.precipitation.values.length} points de précipitation
          </span>
        )}
      </div>
      
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            
            {selectedVariables.includes("temperature") && (
              <YAxis 
                yAxisId="temperature"
                orientation="left"
                stroke="hsl(var(--temperature))"
                fontSize={12}
                tickLine={false}
                label={{ 
                  value: 'Température (°C)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: 'hsl(var(--temperature))', fontSize: 11 }
                }}
              />
            )}
            {selectedVariables.includes("precipitation") && (
              <YAxis 
                yAxisId="precipitation"
                orientation="right"
                stroke="hsl(var(--precipitation))"
                fontSize={12}
                tickLine={false}
                label={{ 
                  value: 'Précipitation (mm)', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { fill: 'hsl(var(--precipitation))', fontSize: 11 }
                }}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
            />
            
            {/* Temperature - Real Data (solid line) */}
            {selectedVariables.includes("temperature") && (
              <Line
                yAxisId="temperature"
                type="monotone"
                dataKey="temperatureReal"
                name="Température (°C)"
                stroke="hsl(var(--temperature))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--temperature))', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--temperature))', strokeWidth: 2 }}
                connectNulls={false}
              />
            )}
            
            {/* Temperature - Predicted Data (dashed line) */}
            {selectedVariables.includes("temperature") && (
              <Line
                yAxisId="temperature"
                type="monotone"
                dataKey="temperaturePredicted"
                name="Température prédite (°C)"
                stroke="hsl(var(--temperature))"
                strokeWidth={3}
                strokeDasharray="8 4"
                dot={{ fill: 'hsl(var(--temperature))', strokeWidth: 2, stroke: 'hsl(var(--background))', r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--temperature))', strokeWidth: 2 }}
                connectNulls={false}
              />
            )}
            
            {/* Precipitation - Real Data (solid line) */}
            {selectedVariables.includes("precipitation") && (
              <Line
                yAxisId="precipitation"
                type="monotone"
                dataKey="precipitationReal"
                name="Précipitation (mm)"
                stroke="hsl(var(--precipitation))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--precipitation))', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--precipitation))', strokeWidth: 2 }}
                connectNulls={false}
              />
            )}
            
            {/* Precipitation - Predicted Data (dashed line) */}
            {selectedVariables.includes("precipitation") && (
              <Line
                yAxisId="precipitation"
                type="monotone"
                dataKey="precipitationPredicted"
                name="Précipitation prédite (mm)"
                stroke="hsl(var(--precipitation))"
                strokeWidth={3}
                strokeDasharray="8 4"
                dot={{ fill: 'hsl(var(--precipitation))', strokeWidth: 2, stroke: 'hsl(var(--background))', r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--precipitation))', strokeWidth: 2 }}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}