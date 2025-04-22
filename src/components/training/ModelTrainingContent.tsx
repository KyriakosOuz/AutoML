
import React, { useState, useEffect } from 'react';
import { useTraining } from '@/contexts/training/TrainingContext';
import AutoMLTraining from './AutoMLTraining';
import CustomTraining from './CustomTraining';
import DatasetSummary from './DatasetSummary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import ExperimentResultsView from './ExperimentResultsView';
import { useToast } from '@/hooks/use-toast';
import DynamicPredictionForm from './DynamicPredictionForm';

const ModelTrainingContent: React.FC = () => {
  const { 
    activeTab,
    setActiveTab,
    resetTrainingState,
    activeExperimentId,
    experimentStatus,
  } = useTraining();

  const [showResults, setShowResults] = useState(false);

  // Allow users to always open the "custom" tab, only force "results" if experiment is COMPLETED
  useEffect(() => {
    if (experimentStatus === 'completed' && activeExperimentId) {
      setShowResults(true);
      if (activeTab !== 'results') {
        setActiveTab('results');
        console.log('[Tabs] Switching to results tab because training completed');
      }
    }
    // Do not force tab if experiment is cleared; user should control switching
    if (!activeExperimentId) {
      setShowResults(false);
      // No longer force to 'automl' since that breaks manual tab toggling
    }
  }, [experimentStatus, activeExperimentId, setActiveTab, activeTab]);

  const handleReset = () => {
    resetTrainingState();
    setShowResults(false);
    setActiveTab('automl');
  };

  return (
    <div className="space-y-6">
      <DatasetSummary />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="automl">AutoML</TabsTrigger>
            <TabsTrigger value="custom">Custom Training</TabsTrigger>
            {showResults && (
              <>
                <TabsTrigger value="results">
                  Results
                </TabsTrigger>
                <TabsTrigger value="predict">
                  Predict
                </TabsTrigger>
              </>
            )}
          </TabsList>
          {(activeExperimentId || showResults) && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
        <TabsContent value="automl" className="space-y-4">
          <AutoMLTraining />
        </TabsContent>
        <TabsContent value="custom" className="space-y-4">
          <CustomTraining />
        </TabsContent>
        <TabsContent value="results" className="space-y-4">
          {showResults && activeExperimentId ? (
            <ExperimentResultsView experimentId={activeExperimentId} onReset={handleReset} />
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-lg font-medium mb-2">No Results Available</h3>
              <p className="text-muted-foreground">
                Complete a training run to see model results
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="predict" className="space-y-4">
          {showResults && activeExperimentId ? (
            <DynamicPredictionForm experimentId={activeExperimentId} />
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-lg font-medium mb-2">No Model Available</h3>
              <p className="text-muted-foreground">
                Complete a training run to make predictions
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModelTrainingContent;
