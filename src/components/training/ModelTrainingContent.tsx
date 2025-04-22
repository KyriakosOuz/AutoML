
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AutoMLTraining from './AutoMLTraining';
import CustomTraining from './CustomTraining';
import ExperimentResults from '../results/ExperimentResults';
import StatusBadge, { Status } from './StatusBadge';
import { useTraining } from '@/contexts/TrainingContext';

const ModelTrainingContent: React.FC = () => {
  const { 
    resetTrainingState, 
    activeExperimentId,
    isLoadingResults,
    experimentResults,
    experimentStatus,
    error,
    isTraining
  } = useTraining();
  
  const [activeTab, setActiveTab] = useState<'automl' | 'custom' | 'results'>('automl');
  
  // Effect to switch to results tab when experiment completes
  useEffect(() => {
    if (activeExperimentId && (experimentStatus === 'completed' || experimentStatus === 'success') && experimentResults) {
      setActiveTab('results');
    }
  }, [activeExperimentId, experimentStatus, experimentResults]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'automl' | 'custom' | 'results');
  };
  
  const handleReset = () => {
    resetTrainingState();
    setActiveTab('automl');
  };
  
  // Only show results tab when we have an active experiment
  const showResults = activeExperimentId !== null;
  
  // Don't allow clicking the results tab while processing/running or if we have an error
  const isResultsDisabled = 
    experimentStatus === 'processing' || 
    experimentStatus === 'running' || 
    (error !== null && experimentStatus !== 'completed' && experimentStatus !== 'success');
  
  // Map context status to StatusBadge status
  const badgeStatus: Status = experimentStatus as Status;
  
  return (
    <div className="w-full">
      {showResults ? (
        <div className="space-y-6">
          <Tabs 
            value={activeTab} 
            onValueChange={handleTabChange} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger 
                value="automl" 
                disabled={isTraining}
              >
                AutoML Training
              </TabsTrigger>
              <TabsTrigger 
                value="custom" 
                disabled={isTraining}
              >
                Custom Training
              </TabsTrigger>
              <TabsTrigger value="results" disabled={isResultsDisabled}>
                Results 
                {experimentStatus && (
                  <div className="ml-2">
                    <StatusBadge status={badgeStatus} />
                  </div>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="automl" className="p-4 pt-6">
              <AutoMLTraining />
            </TabsContent>
            
            <TabsContent value="custom" className="p-4 pt-6">
              <CustomTraining />
            </TabsContent>
            
            <TabsContent value="results" className="pt-4">
              <ExperimentResults 
                experimentId={activeExperimentId}
                status={experimentStatus}
                onReset={handleReset}
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="automl">AutoML Training</TabsTrigger>
            <TabsTrigger value="custom">Custom Training</TabsTrigger>
          </TabsList>
          
          <TabsContent value="automl" className="p-4 pt-6">
            <AutoMLTraining />
          </TabsContent>
          
          <TabsContent value="custom" className="p-4 pt-6">
            <CustomTraining />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ModelTrainingContent;
