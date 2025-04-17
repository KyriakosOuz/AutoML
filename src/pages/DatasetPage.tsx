
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
    resetState();
    toast({
      title: "Dataset Reset",
      description: "All dataset processing has been reset. You can now start over.",
      duration: 3000,
    });
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
  const { datasetId, targetColumn, taskType, overview, processingStage } = useDataset();
  const [activeTab, setActiveTab] = useState<string>("upload");
  const { toast } = useToast();
  
  const [hasInitializedTabs, setHasInitializedTabs] = useState(false);
  
  const getActiveStep = () => {
    if (!datasetId) return 0;
    if (!targetColumn) return 1;
    if (!taskType) return 2;
    return 3;
  };

  useEffect(() => {
    if (!hasInitializedTabs) {
      if (!datasetId) {
        setActiveTab("upload");
      } else if (datasetId && !targetColumn) {
        setActiveTab("explore");
      } else if (targetColumn && !taskType) {
        setActiveTab("features");
      } else if (taskType) {
        setActiveTab("preprocess");
      }
      setHasInitializedTabs(true);
    }
  }, [datasetId, targetColumn, taskType, hasInitializedTabs]);

  const isTabEnabled = (tabName: string): boolean => {
    if (tabName === "upload") return true;
    if (tabName === "explore") return !!datasetId;
    if (tabName === "features") return !!datasetId;
    if (tabName === "preprocess") return !!datasetId && !!targetColumn && !!taskType;
    return false;
  };

  const handleTabChange = (value: string) => {
    if (isTabEnabled(value)) {
      setActiveTab(value);
    } else {
      let message = "You need to complete previous steps first:";
      if (value === "explore" && !datasetId) {
        message = "Please upload a dataset first";
      } else if (value === "features" && !datasetId) {
        message = "Please upload a dataset first";
      } else if (value === "preprocess" && (!datasetId || !targetColumn || !taskType)) {
        message = "Please complete target selection and feature selection first";
      }
      
      toast({
        title: "Tab disabled",
        description: message,
        variant: "destructive",
      });
    }
  };

  const goToNextTab = () => {
    if (activeTab === "upload" && datasetId) {
      setActiveTab("explore");
    } else if (activeTab === "explore" && datasetId) {
      setActiveTab("features");
    } else if (activeTab === "features" && datasetId && targetColumn && taskType) {
      setActiveTab("preprocess");
    }
  };

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
              icon={<PlayCircle className="h-5 w-5" />}
              status={taskType ? "current" : "pending"} 
            />
          </Steps>
        </header>
        
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="explore" disabled={!isTabEnabled("explore")}>Explore</TabsTrigger>
              <TabsTrigger value="features" disabled={!isTabEnabled("features")}>Features</TabsTrigger>
              <TabsTrigger value="preprocess" disabled={!isTabEnabled("preprocess")}>Preprocess</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="pt-4">
              <FileUpload />
              {datasetId && (
                <>
                  <DataPreview />
                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={goToNextTab} 
                      className="flex items-center gap-2"
                    >
                      Next: Explore Data
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="explore" className="pt-4">
              <MissingValueHandler />
              <DataPreview />
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={goToNextTab} 
                  className="flex items-center gap-2"
                >
                  Next: Select Features
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="features" className="pt-4">
              <FeatureImportanceChart />
              {targetColumn && taskType && <DataPreview />}
              {targetColumn && taskType && (
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={goToNextTab} 
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
              <DataPreview />
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
