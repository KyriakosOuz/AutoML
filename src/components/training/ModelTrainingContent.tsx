
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AutoMLTraining from './AutoMLTraining';
import CustomTraining from './CustomTraining';
import ExperimentResults from '../results/ExperimentResults';
import { useTraining } from '@/contexts/TrainingContext';
import { ExternalLink } from 'lucide-react';

const ModelTrainingContent: React.FC = () => {
  const { 
    resetTrainingState, 
    activeExperimentId,
    isLoadingResults
  } = useTraining();
  
  const [activeTab, setActiveTab] = useState<'automl' | 'custom'>('automl');
  const navigate = useNavigate();
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'automl' | 'custom');
  };
  
  const handleReset = () => {
    resetTrainingState();
  };

  const viewFullResults = () => {
    if (activeExperimentId) {
      navigate(`/experiment/${activeExperimentId}`);
    }
  };
  
  // Only show results tab if we have active experiment or are loading results
  const showResults = activeExperimentId || isLoadingResults;
  
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
              <div className="flex justify-end mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={viewFullResults}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Full Results
                </Button>
              </div>
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
