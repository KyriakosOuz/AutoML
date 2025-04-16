
import React, { useState, useEffect } from 'react';
import { DatasetProvider, useDataset } from '@/contexts/DatasetContext';
import FileUpload from '@/components/dataset/FileUpload';
import DataPreview from '@/components/dataset/DataPreview';
import MissingValueHandler from '@/components/dataset/MissingValueHandler';
import FeatureImportanceChart from '@/components/dataset/FeatureImportanceChart';
import FeatureSelector from '@/components/dataset/FeatureSelector';
import PreprocessingOptions from '@/components/dataset/PreprocessingOptions';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, RotateCcw, PlayCircle, Database, FileSpreadsheet, Workflow, Sliders, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Steps, Step } from '@/components/ui/steps';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const StartOverButton = () => {
  const { resetState } = useDataset();
  const { toast } = useToast();
  
  const handleStartOver = () => {
    if (window.confirm('Are you sure you want to start over? This will reset all your dataset processing.')) {
      resetState();
      toast({
        title: "Dataset Reset",
        description: "All dataset processing has been reset. You can now upload a new dataset.",
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

const DatasetPageContent = () => {
  const { user, signOut } = useAuth();
  const { datasetId, targetColumn, taskType } = useDataset();
  const [activeTab, setActiveTab] = useState<string>("upload");
  
  // Determine the current active step
  const getActiveStep = () => {
    if (!datasetId) return 0;
    if (!targetColumn) return 1;
    if (!taskType) return 2;
    return 3;
  };

  // Update active tab when state changes
  useEffect(() => {
    if (!datasetId) {
      setActiveTab("upload");
    } else if (datasetId && !targetColumn) {
      setActiveTab("explore");
    } else if (targetColumn && !taskType) {
      setActiveTab("features");
    } else if (taskType) {
      setActiveTab("preprocess");
    }
  }, [datasetId, targetColumn, taskType]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-5xl mx-auto px-4">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
              <Database className="h-5 w-5" />
              AutoML Web App
            </Link>
            <div className="flex items-center gap-4">
              {datasetId && <StartOverButton />}
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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Dataset Processing</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Upload, explore, and preprocess your datasets for machine learning. 
              Handle missing values, analyze features, and prepare your data for modeling.
            </p>
          </div>
          
          <Steps active={getActiveStep()} className="mb-8">
            <Step 
              title="Upload" 
              description="Dataset" 
              icon={<FileSpreadsheet className="h-5 w-5" />} 
              status={!datasetId ? "current" : "complete"} 
            />
            <Step 
              title="Target" 
              description="Selection" 
              icon={<Workflow className="h-5 w-5" />} 
              status={datasetId && !targetColumn ? "current" : datasetId && targetColumn ? "complete" : "pending"} 
            />
            <Step 
              title="Feature" 
              description="Selection" 
              icon={<Sliders className="h-5 w-5" />} 
              status={targetColumn && !taskType ? "current" : targetColumn && taskType ? "complete" : "pending"} 
            />
            <Step 
              title="Preprocessing" 
              description="Options" 
              status={taskType ? "current" : "pending"} 
            />
          </Steps>
        </header>
        
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="explore" disabled={!datasetId}>Explore</TabsTrigger>
              <TabsTrigger value="features" disabled={!datasetId}>Features</TabsTrigger>
              <TabsTrigger value="preprocess" disabled={!datasetId || !targetColumn}>Preprocess</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="pt-4">
              <FileUpload />
              {datasetId && (
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={() => setActiveTab("explore")} 
                    className="flex items-center gap-2"
                  >
                    Next: Explore Data
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="explore" className="pt-4">
              <DataPreview />
              <MissingValueHandler />
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={() => setActiveTab("features")} 
                  className="flex items-center gap-2"
                >
                  Next: Select Features
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="features" className="pt-4">
              <FeatureImportanceChart />
              <FeatureSelector />
              {targetColumn && taskType && (
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={() => setActiveTab("preprocess")} 
                    className="flex items-center gap-2"
                  >
                    Next: Preprocess Data
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="preprocess" className="pt-4">
              <PreprocessingOptions />
              {datasetId && targetColumn && taskType && (
                <div className="flex justify-end mt-8">
                  <Link to="/training">
                    <Button size="lg" className="flex items-center gap-2">
                      <PlayCircle className="h-5 w-5" />
                      Continue to Model Training
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>© 2025 AutoML Web App. Data processing powered by FastAPI.</p>
        </footer>
      </div>
    </div>
  );
};

const DatasetPage: React.FC = () => {
  return (
    <DatasetProvider>
      <DatasetPageContent />
    </DatasetProvider>
  );
};

export default DatasetPage;
