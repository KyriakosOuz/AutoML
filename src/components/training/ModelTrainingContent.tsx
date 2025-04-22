
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTraining } from '@/contexts/TrainingContext';
import AutoMLTraining from './AutoMLTraining';
import CustomTraining from './CustomTraining';
import DatasetSummary from './DatasetSummary';
import UnifiedExperimentResults from './UnifiedExperimentResults';

const ModelTrainingContent: React.FC = () => {
  const { 
    activeExperimentId, 
    experimentResults, 
    resetTrainingState,
    lastTrainingType
  } = useTraining();
  const [activeTab, setActiveTab] = useState<string>('automl');

  useEffect(() => {
    if (experimentResults?.status === 'completed' || experimentResults?.status === 'success') {
      setActiveTab('results');
    }
  }, [experimentResults?.status]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleReset = () => {
    resetTrainingState();
    setActiveTab('automl');
  };

  const handleBack = () => {
    setActiveTab(lastTrainingType === 'custom' ? 'custom' : 'automl');
  };

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Model Training</h1>
      
      <DatasetSummary />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="automl">AutoML Training</TabsTrigger>
          <TabsTrigger value="custom">Custom Training</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="automl">
          <AutoMLTraining onTrainingStart={() => setActiveTab('results')} />
        </TabsContent>
        
        <TabsContent value="custom">
          <CustomTraining onTrainingStart={() => setActiveTab('results')} />
        </TabsContent>
        
        <TabsContent value="results">
          <UnifiedExperimentResults 
            onReset={handleReset} 
            onBack={handleBack}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModelTrainingContent;
