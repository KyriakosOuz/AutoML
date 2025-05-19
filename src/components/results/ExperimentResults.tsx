
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RotateCcw, RefreshCw, AlertCircle } from 'lucide-react';
import { ExperimentStatus, ExperimentResults as ExperimentResultsType } from '@/types/training';
import MetricsDisplay from '@/components/results/MetricsDisplay';
import VisualizationDisplay from '@/components/results/VisualizationDisplay';
import ModelSummary from '@/components/results/ModelSummary';
import ModelInterpretabilityPlots from '@/components/results/ModelInterpretabilityPlots';
import RocCurveChart from '@/components/training/charts/RocCurveChart';

interface ExperimentResultsProps {
  experimentId: string | null;
  status: ExperimentStatus;
  experimentResults: ExperimentResultsType | null;
  isLoading: boolean;
  error: string | null;
  onReset?: () => void; 
  onRefresh?: () => void;
  trainingType?: 'automl' | 'custom' | null; // New prop to explicitly specify training type
}

const ExperimentResults: React.FC<ExperimentResultsProps> = ({
  experimentId,
  status,
  experimentResults,
  isLoading,
  error,
  onReset,
  onRefresh,
  trainingType
}) => {
  // Log when the component renders to help with debugging
  console.log("[ExperimentResults] Rendering with:", { 
    experimentId, 
    status, 
    trainingType,
    isLoading, 
    hasResults: !!experimentResults,
    hasError: !!error,
    resultTrainingType: experimentResults?.training_type,
    resultAutomlEngine: experimentResults?.automl_engine,
    modelDisplayName: experimentResults?.model_display_name
  });
  
  // Determine the actual training type to display in UI - improved logic
  const displayedTrainingType = trainingType || 
                               (experimentResults?.training_type as 'automl' | 'custom') || 
                               (experimentResults?.automl_engine ? 'automl' : 'custom');
                               
  console.log("[ExperimentResults] Using display training type:", displayedTrainingType);

  // Determine if we have interpretability plots available
  const hasInterpretabilityPlots = React.useMemo(() => {
    if (!experimentResults) return false;
    
    // Check for pdp_ice_metadata structure from backend
    if (experimentResults.pdp_ice_metadata && experimentResults.pdp_ice_metadata.length > 0) {
      console.log("[ExperimentResults] Found pdp_ice_metadata with", experimentResults.pdp_ice_metadata.length, "items");
      return true;
    }
    
    // Check for PDP/ICE plots in files array
    if (experimentResults.files && experimentResults.files.length > 0) {
      const hasPdpIce = experimentResults.files.some(file => 
        file.file_type?.startsWith('pdp_') || file.file_type?.startsWith('ice_')
      );
      console.log("[ExperimentResults] Checked files for PDP/ICE:", hasPdpIce);
      return hasPdpIce;
    }
    
    // Check if visualizations_by_type contains interpretability data
    if (experimentResults.visualizations_by_type) {
      const visTypes = experimentResults.visualizations_by_type;
      // Create an array of relevant types and check if any are present and non-empty
      const relevantTypes = ['explainability', 'feature_importance', 'pdp', 'ice', 'shap'];
      const hasVisualizations = relevantTypes.some(type => 
        visTypes[type] && Array.isArray(visTypes[type]) && visTypes[type]!.length > 0
      );
      console.log("[ExperimentResults] Checked visualizations_by_type for relevant types:", hasVisualizations);
      return hasVisualizations;
    }

    return false;
  }, [experimentResults]);

  console.log("[ExperimentResults] Has interpretability plots:", hasInterpretabilityPlots);

  // Find ROC curve file if available
  const rocCurveFile = experimentResults?.files?.find(file => 
    file.file_type === 'evaluation_curve' && 
    (file.file_url?.includes('roc_curve') || file.file_type.includes('roc_curve'))
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Error Loading Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  if (status === 'failed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Training Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              {experimentResults?.error_message || 'The training process encountered an error.'}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          {onReset && (
            <Button onClick={onReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Run New Experiment
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  if (!experimentResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            No Results Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>No results are available for this experiment.</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          {onReset && (
            <Button onClick={onReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Run New Experiment
            </Button>
          )}
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" className="ml-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Again
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  // Get the most appropriate title to display
  const experimentTitle = experimentResults?.model_display_name || 
                         experimentResults?.experiment_name || 
                         `Experiment ${experimentId?.substring(0, 8)}`;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {experimentTitle}
          <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded">
            {displayedTrainingType === 'automl' ? 'AutoML' : 'Custom'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
            {hasInterpretabilityPlots && (
              <TabsTrigger value="interpretability">Interpretability</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="summary">
            <div className="space-y-4">
              <ModelSummary results={experimentResults} />
              
              {/* Show ROC curve in summary if available */}
              {rocCurveFile && (
                <div className="mt-4">
                  <RocCurveChart 
                    imageUrl={rocCurveFile.file_url} 
                    auc={experimentResults.metrics?.auc || experimentResults.metrics?.roc_auc}
                  />
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="metrics">
            <MetricsDisplay results={experimentResults} />
          </TabsContent>
          <TabsContent value="visualizations">
            <VisualizationDisplay results={experimentResults} />
          </TabsContent>
          {hasInterpretabilityPlots && (
            <TabsContent value="interpretability">
              <ModelInterpretabilityPlots 
                files={experimentResults.pdp_ice_metadata ? 
                  [experimentResults] : // Pass the whole result object if it has pdp_ice_metadata
                  experimentResults.files || []} // Otherwise pass the files array
              />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onReset && (
          <Button onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Run New Experiment
          </Button>
        )}
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Results
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ExperimentResults;
