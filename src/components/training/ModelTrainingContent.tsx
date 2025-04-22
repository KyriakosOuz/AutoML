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

const ModelTrainingContent: React.FC = () => {
  const { 
    activeTab,
    setActiveTab,
    resetTrainingState,
    activeExperimentId,
    experimentStatus,
  } = useTraining();

  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (experimentStatus === 'completed' && activeExperimentId) {
      setShowResults(true);
      setActiveTab('results');
    }
    if (!activeExperimentId) {
      setShowResults(false);
      setActiveTab('automl');
    }
  }, [experimentStatus, activeExperimentId, setActiveTab]);

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
              <TabsTrigger value="results">
                Results
              </TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default ModelTrainingContent;
