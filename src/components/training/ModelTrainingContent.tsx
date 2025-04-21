
import React, { useState, useEffect } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { useTraining } from '@/contexts/TrainingContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Database, LogOut, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import DatasetSummary from './DatasetSummary';
import AutoMLTraining from './AutoMLTraining';
import CustomTraining from './CustomTraining';
import TrainingResultsV2 from './TrainingResultsV2';

const StartOverButton = () => {
  const { resetState } = useDataset();
  const { resetTrainingState } = useTraining();
  const { toast } = useToast();
  
  const handleStartOver = () => {
    if (window.confirm('Are you sure you want to start over? This will reset all your dataset processing and training.')) {
      resetState();
      resetTrainingState();
      toast({
        title: "Reset Complete",
        description: "All dataset processing and training has been reset.",
        duration: 3000,
      });
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleStartOver}
      className="flex items-center gap-2"
    >
      <RotateCcw className="h-4 w-4" />
      Start Over
    </Button>
  );
};

const ModelTrainingContent: React.FC = () => {
  const { user, signOut } = useAuth();
  const { datasetId, targetColumn, fileUrl, taskType } = useDataset();
  const { 
    activeExperimentId, 
    experimentResults, 
    lastTrainingType, 
    resetTrainingState, 
    automlResult,
    customResult
  } = useTraining();
  
  const [activeTab, setActiveTab] = useState<string>('automl');
  
  useEffect(() => {
    if (lastTrainingType) {
      setActiveTab(lastTrainingType);
    }
  }, [lastTrainingType]);
  
  if (!datasetId || !targetColumn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">No Dataset Selected</CardTitle>
            <CardDescription>
              You need to upload and prepare a dataset before training models
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground">
              Please go to the Dataset page to upload and process your data first.
            </p>
            <Link to="/dataset">
              <Button className="w-full" >
                <Database className="mr-2 h-4 w-4" />
                Go to Dataset Page
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-5xl mx-auto px-4">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <Link to="/" className="text-xl font-bold text-gray-900">AutoML Web App</Link>
            <div className="flex items-center gap-4">
              <StartOverButton />
              <div className="text-sm text-gray-600 hidden md:block">
                {user?.email}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
          
          <div className="flex items-center mb-4">
            <Link to="/dataset" className="flex items-center text-primary hover:underline">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dataset
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Model Training</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Train machine learning models using AutoML or custom algorithms on your prepared dataset.
            </p>
          </div>
        </header>
        
        <DatasetSummary />
        
        <div className="space-y-6 mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 rounded-md h-12">
              <TabsTrigger value="automl" className="text-sm font-medium">AutoML Training</TabsTrigger>
              <TabsTrigger value="custom" className="text-sm font-medium">Custom Training</TabsTrigger>
            </TabsList>
            
            <div className="overflow-hidden rounded-[0.5rem] border bg-background shadow-md md:shadow-xl mt-4">
              <TabsContent value="automl" className="space-y-4 p-6">
                <AutoMLTraining />
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-4 p-6">
                <CustomTraining />
              </TabsContent>
            </div>
          </Tabs>
          
          {activeExperimentId && (
            <TrainingResultsV2 
              experimentId={activeExperimentId}
              onReset={() => resetTrainingState()}
            />
          )}
        </div>
        
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>© 2025 AutoML Web App. Machine learning powered by FastAPI.</p>
        </footer>
      </div>
    </div>
  );
};

export default ModelTrainingContent;
