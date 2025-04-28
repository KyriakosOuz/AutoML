
import React, { useState, useEffect } from 'react';
import { useTraining } from '@/contexts/training/TrainingContext';
import AutoMLTraining from './AutoMLTraining';
import CustomTraining from './CustomTraining';
import DatasetSummary from './DatasetSummary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import ExperimentResultsView from './ExperimentResultsView';
import DynamicPredictionForm from './DynamicPredictionForm';

const ModelTrainingContent: React.FC = () => {
  const { 
    activeTab,
    setActiveTab,
    resetTrainingState,
    activeExperimentId,
    experimentStatus,
  } = useTraining();

  // Show results and predict tabs only when experiment is completed
  const showResultsAndPredict = experimentStatus === 'completed' && activeExperimentId;

  // If current tab is results or predict but experiment is not completed, switch to automl
  useEffect(() => {
    if ((activeTab === 'results' || activeTab === 'predict') && !showResultsAndPredict) {
      setActiveTab('automl');
    }
  }, [activeTab, showResultsAndPredict, setActiveTab]);

  const handleReset = () => {
    resetTrainingState();
    setActiveTab('automl');
  };

  return (
    <div className="space-y-6">
      <DatasetSummary />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100">
            <TabsTrigger value="automl" className="data-[state=active]:bg-black data-[state=active]:text-white">
              AutoML
            </TabsTrigger>
            <TabsTrigger value="custom" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Custom Training
            </TabsTrigger>
            {showResultsAndPredict && (
              <>
                <TabsTrigger value="results" className="data-[state=active]:bg-black data-[state=active]:text-white">
                  Results
                </TabsTrigger>
                <TabsTrigger value="predict" className="data-[state=active]:bg-black data-[state=active]:text-white">
                  Predict
                </TabsTrigger>
              </>
            )}
          </TabsList>
          {(activeExperimentId || showResultsAndPredict) && (
            <Button variant="outline" size="sm" onClick={handleReset} className="ml-4">
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
          {showResultsAndPredict && activeExperimentId ? (
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
          {showResultsAndPredict && activeExperimentId ? (
            <DynamicPredictionForm experimentId={activeExperimentId} />
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Prediction Not Available</h3>
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
