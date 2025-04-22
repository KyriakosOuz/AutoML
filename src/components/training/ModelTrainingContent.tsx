
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AutoMLTraining from './AutoMLTraining';
import CustomTraining from './CustomTraining';
import UnifiedExperimentResults from './UnifiedExperimentResults';
import { useTraining } from '@/contexts/TrainingContext';

const ModelTrainingContent: React.FC = () => {
  const { 
    resetTrainingState, 
    experimentResults, 
    activeExperimentId,
    isLoadingResults
  } = useTraining();
  
  const [activeTab, setActiveTab] = useState<'automl' | 'custom'>('automl');
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'automl' | 'custom');
  };
  
  const handleReset = () => {
    resetTrainingState();
  };
  
  // Only show results tab if we have results or are loading results
  const showResults = experimentResults || isLoadingResults || activeExperimentId;
  
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
              <UnifiedExperimentResults onReset={handleReset} />
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
