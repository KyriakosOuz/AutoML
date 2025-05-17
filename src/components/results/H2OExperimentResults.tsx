
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Award, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExperimentResults, ExperimentStatus } from '@/types/training';
import DynamicMetricsDisplay from './DynamicMetricsDisplay';
import ModelSummary from './ModelSummary';
import PDPICETable from './PDPICETable';
import CategorizedVisualizations from './CategorizedVisualizations';
import H2OLeaderboardTable from './H2OLeaderboardTable';

interface H2OExperimentResultsProps {
  experimentId: string;
  status: ExperimentStatus;
  experimentResults: ExperimentResults;
  isLoading: boolean;
  error: string | null;
  onReset?: () => void;
}

const H2OExperimentResults: React.FC<H2OExperimentResultsProps> = ({
  experimentId,
  status,
  experimentResults,
  isLoading,
  error,
  onReset
}) => {
  const [activeTab, setActiveTab] = useState<string>('metrics');
  
  // Format the visualizations by category
  const visualizationsByType = useMemo(() => {
    if (!experimentResults?.files) return {};
    
    // Predefined categories
    const categories = {
      explainability: [],
      evaluation: [],
      confusion_matrix: [],
      feature_importance: [],
      model: [],
      leaderboard: [],
      pdp_ice: [],
      other: []
    };
    
    experimentResults.files.forEach(file => {
      if (!file.file_url) return;
      
      const fileType = file.file_type?.toLowerCase() || '';
      
      if (fileType.includes('model')) {
        categories.model.push(file);
      } else if (fileType.includes('confusion_matrix')) {
        categories.confusion_matrix.push(file);
      } else if (fileType.includes('pdp') || fileType.includes('ice')) {
        categories.pdp_ice.push(file);
      } else if (fileType.includes('feature_importance') || fileType.includes('shap')) {
        categories.feature_importance.push(file);
      } else if (fileType.includes('roc') || fileType.includes('precision_recall') || fileType.includes('learning_curve')) {
        categories.evaluation.push(file);
      } else if (fileType.includes('leaderboard')) {
        categories.leaderboard.push(file);
      } else if (fileType.includes('explain') || fileType.includes('interpretation')) {
        categories.explainability.push(file);
      } else {
        categories.other.push(file);
      }
    });
    
    return categories;
  }, [experimentResults]);
  
  // Extract PDP/ICE plots
  const pdpIcePlots = useMemo(() => {
    if (!experimentResults?.files) return [];
    
    return experimentResults.files
      .filter(file => {
        const fileType = file.file_type?.toLowerCase() || '';
        return fileType.includes('pdp') || fileType.includes('ice');
      })
      .map(file => {
        // Try to extract feature name and plot type from file type
        const fileType = file.file_type?.toLowerCase() || '';
        const isPDP = fileType.includes('pdp');
        const isICE = fileType.includes('ice');
        
        // Extract feature name from file type or name
        let feature = 'Unknown';
        let classId = undefined;
        
        // Look for patterns like pdp_feature_name or ice_feature_name_class_X
        const fileTypeParts = fileType.split('_');
        if (fileTypeParts.length > 1) {
          // Skip the first part (pdp or ice)
          const potentialFeature = fileTypeParts.slice(1, -2).join('_');
          feature = potentialFeature || feature;
          
          // Check for class info
          const classIndex = fileTypeParts.findIndex(part => part === 'class');
          if (classIndex !== -1 && classIndex < fileTypeParts.length - 1) {
            classId = fileTypeParts[classIndex + 1];
          }
        }
        
        return {
          plot_type: isPDP ? 'pdp' : 'ice',
          feature: feature,
          class_id: classId,
          file_url: file.file_url,
          related_feature_importance: null // We could match this in a more complex implementation
        };
      });
  }, [experimentResults]);
  
  if (status === 'failed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Training Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              {experimentResults?.error_message || 'The H2O training process encountered an error.'}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          {onReset && (
            <Button onClick={onReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run New Experiment
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle>
              {experimentResults?.model_display_name || 
               experimentResults?.experiment_name || 
               'H2O AutoML Results'}
            </CardTitle>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            H2O AutoML
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-4">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="details">Model Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics">
            <DynamicMetricsDisplay 
              metrics={experimentResults.metrics || {}} 
              taskType={experimentResults.task_type || ''} 
              bestModelDetails={experimentResults.metrics || {}}
            />
          </TabsContent>
          
          <TabsContent value="visualizations" className="space-y-8">
            {pdpIcePlots.length > 0 && (
              <PDPICETable plots={pdpIcePlots} />
            )}
            
            <CategorizedVisualizations visualizationsByType={visualizationsByType} />
          </TabsContent>
          
          <TabsContent value="leaderboard">
            <H2OLeaderboardTable 
              leaderboard={experimentResults.leaderboard || []} 
              leaderboardCsv={experimentResults.leaderboard_csv}
            />
          </TabsContent>
          
          <TabsContent value="details">
            <ModelSummary results={experimentResults} />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        {onReset && (
          <Button onClick={onReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Run New Experiment
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default H2OExperimentResults;
