import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { VariableSelector } from "@/components/VariableSelector";
import { AggregationSelector } from "@/components/AggregationSelector";
import { RegionSelector } from "@/components/RegionSelector";
import { DateRangePicker } from "@/components/DateRangePicker";
import { StatsCards } from "@/components/StatsCards";
import { TimeSeriesChart } from "@/components/TimeSeriesChart";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { MapView } from "@/components/MapView";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { DataLegend } from "@/components/DataLegend";
import { Eye, CloudSun, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, VisualizeResponse } from "@/services/api"; // ← AJOUTÉ

const Index = () => {
  const { toast } = useToast();
  const [selectedVariables, setSelectedVariables] = useState<string[]>(["temperature"]);
  const [selectedAggregation, setSelectedAggregation] = useState("daily");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(2023, 0, 1));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(2023, 11, 31));
  const [viewMode, setViewMode] = useState<"timeseries" | "map">("timeseries");
  const [hasData, setHasData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<VisualizeResponse | null>(null); // ← AJOUTÉ

  // When switching to map mode, ensure only one variable is selected
  useEffect(() => {
    if (viewMode === "map" && selectedVariables.length > 1) {
      setSelectedVariables([selectedVariables[0]]);
    }
  }, [viewMode]);

  const handleVisualize = async () => {
    setError(null);
    
    if (selectedVariables.length === 0) {
      setError("Veuillez sélectionner au moins une variable.");
      return;
    }

    if (!selectedRegion) {
      setError("Veuillez sélectionner une région.");
      return;
    }

    if (!startDate || !endDate) {
      setError("Veuillez sélectionner une plage de dates.");
      return;
    }

    if (startDate > endDate) {
      setError("La date de début doit être antérieure à la date de fin.");
      return;
    }

    setIsLoading(true);
    setHasData(false);
    
    try {
      // Format des dates pour l'API (YYYY-MM-DD)
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };

      // Appel à l'API Django
      const response = await api.visualizeData({
        variables: selectedVariables,
        aggregation: selectedAggregation === "daily" ? "Daily" : "Monthly",
        region: selectedRegion,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
      });

      // Stocker les données reçues
      setChartData(response);
      setHasData(true);
      
      console.log("Données reçues du backend:", response);
      
      toast({
        title: "Données chargées",
        description: "Les données climatiques ont été récupérées avec succès.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <CloudSun className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">ClimateViz</h1>
                <p className="text-sm text-muted-foreground">Visualisation des données géospatiales</p>
              </div>
            </div>
            <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Panel */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
            <div className="glass rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-border/50">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h2 className="text-lg font-semibold text-foreground">Contrôles</h2>
              </div>

              <VariableSelector
                selectedVariables={selectedVariables}
                onVariablesChange={setSelectedVariables}
                singleSelect={viewMode === "map"}
              />

              <AggregationSelector
                selectedAggregation={selectedAggregation}
                onAggregationChange={setSelectedAggregation}
              />

              <RegionSelector
                selectedRegion={selectedRegion}
                onRegionChange={setSelectedRegion}
              />

              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />

              <Button 
                variant="visualize" 
                size="lg" 
                className="w-full"
                onClick={handleVisualize}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" />
                    Visualiser
                  </>
                )}
              </Button>
            </div>
          </aside>

          {/* Visualization Panel */}
          <section className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* Error Message */}
            {error && (
              <ErrorMessage message={error} onDismiss={() => setError(null)} />
            )}

            {/* Loading Spinner */}
            {isLoading ? (
              <LoadingSpinner message="Chargement des données climatiques..." />
            ) : (
              <>
                {/* Stats Cards */}
                <StatsCards selectedVariables={selectedVariables} hasData={hasData} />

                {/* Legend */}
                {hasData && <DataLegend showPredicted={true} />}

                {/* Chart or Map */}
                {viewMode === "timeseries" ? (
                  <TimeSeriesChart
                    selectedVariables={selectedVariables}
                    startDate={startDate}
                    endDate={endDate}
                    hasData={hasData}
                    chartData={chartData} // ← PASSEZ LES DONNÉES AU GRAPHIQUE
                  />
                ) : (
<MapView 
  selectedRegion={selectedRegion} 
  hasData={hasData} 
  selectedVariable={selectedVariables[0]}
  startDate={startDate}
  endDate={endDate}
/>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Technical Assessment — Visualisation des données climatiques géospatiales
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;