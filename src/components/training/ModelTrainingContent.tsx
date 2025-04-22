
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import AutoMLTraining from './AutoMLTraining';
import CustomTraining from './CustomTraining';
import ExperimentResults from '../results/ExperimentResults';
import { useTraining } from '@/contexts/TrainingContext';

const ModelTrainingContent: React.FC = () => {
  const { 
    resetTrainingState, 
    activeExperimentId,
    isLoadingResults,
    experimentResults,
    error
  } = useTraining();
  
  const [activeTab, setActiveTab] = useState<'automl' | 'custom'>('automl');
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'automl' | 'custom');
  };
  
  const handleReset = () => {
    resetTrainingState();
  };
  
  // Only show results tab if we have active experiment results, are loading results, or have an error
  // The key is to not attempt to render the actual results until they're fully loaded
  const showResults = activeExperimentId && (experimentResults || isLoadingResults || error);
  
  return (
    <div className="w-full">
      {showResults ? (
        <div className="space-y-6">
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="automl">AutoML Training</TabsTrigger>
              <TabsTrigger value="custom">Custom Training</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
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
