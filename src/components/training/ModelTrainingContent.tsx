
import React, { useState, useEffect } from 'react';
import { useTraining } from '@/contexts/training/TrainingContext';
import AutoMLTraining from './AutoMLTraining';
import CustomTraining from './CustomTraining';
import DatasetSummary from './DatasetSummary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import ExperimentResultsView from './ExperimentResultsView';

const ModelTrainingContent: React.FC = () => {
  const { 
    activeTab,
    setActiveTab,
    resetTrainingState,
    activeExperimentId,
    experimentStatus,
  } = useTraining();

  const showResults = experimentStatus === 'completed' && activeExperimentId;

  useEffect(() => {
    if (activeTab === 'predict' && !showResults) {
      setActiveTab('automl');
    }
  }, [activeTab, showResults, setActiveTab]);

  const handleReset = () => {
    resetTrainingState();
    setActiveTab('automl');
  };

  // Number of tabs - we removed the predict tab
  const numTabs = showResults ? 3 : 2;

  return (
    <div className="space-y-6">
      <DatasetSummary />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className={`grid w-full bg-gray-100 grid-cols-${numTabs}`}>
            <TabsTrigger 
              value="automl" 
              className="data-[state=active]:bg-black data-[state=active]:text-white"
            >
              AutoML
            </TabsTrigger>
            <TabsTrigger 
              value="custom" 
              className="data-[state=active]:bg-black data-[state=active]:text-white"
            >
              Custom Training
            </TabsTrigger>
            {showResults && (
              <TabsTrigger 
                value="results" 
                className="data-[state=active]:bg-black data-[state=active]:text-white"
              >
                Results
              </TabsTrigger>
            )}
          </TabsList>
          {(activeExperimentId || showResults) && (
            <Button variant="outline" size="sm" onClick={handleReset} className="ml-4">
              <RefreshCw className="h-4 w-4 mr-2" />
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
