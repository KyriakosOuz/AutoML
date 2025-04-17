
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
import { LogOut, ArrowRight, Database, FileSpreadsheet, Workflow, Sliders, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Steps, Step } from '@/components/ui/steps';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DatasetPageContent = () => {
  const { user, signOut } = useAuth();
  const { 
    datasetId, 
    targetColumn, 
    taskType, 
    overview, 
    processingStage, 
    columnsToKeep 
  } = useDataset();
  
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
      } else if (targetColumn && !columnsToKeep) {
        setActiveTab("features");
      } else if (columnsToKeep) {
        setActiveTab("preprocess");
      }
      setHasInitializedTabs(true);
    }
  }, [datasetId, targetColumn, taskType, hasInitializedTabs, columnsToKeep]);

  // Handle tab access control based on processing stage
  const isTabEnabled = (tabName: string): boolean => {
    if (tabName === "upload") return true;
    if (tabName === "explore") return !!datasetId;
    if (tabName === "features") return !!datasetId && processingStage === 'cleaned';
    if (tabName === "preprocess") return !!datasetId && !!targetColumn && !!taskType && processingStage === 'final';
    return false;
  };

  const handleTabChange = (value: string) => {
    if (isTabEnabled(value)) {
      setActiveTab(value);
    } else {
      let message = "You need to complete previous steps first:";
      if (value === "explore" && !datasetId) {
        message = "Please upload a dataset first";
      } else if (value === "features" && !processingStage || processingStage !== 'cleaned') {
        message = "Please process missing values first";
      } else if (value === "preprocess" && processingStage !== 'final') {
        message = "Please complete feature selection first";
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
    } else if (activeTab === "explore" && processingStage === 'cleaned') {
      setActiveTab("features");
    } else if (activeTab === "features" && processingStage === 'final') {
      setActiveTab("preprocess");
    }
  };

  // Format task type for display
  const formatTaskType = (type: string | null): string => {
    if (!type) return '';
    
    if (type === 'binary_classification') return 'Binary Classification';
    if (type === 'multiclass_classification') return 'Multiclass Classification';
    if (type === 'regression') return 'Regression';
    
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
              status={targetColumn && !columnsToKeep ? "current" : targetColumn && columnsToKeep ? "complete" : "pending"} 
            />
            <Step 
              title="Preprocessing" 
              description="Options" 
              icon={<PlayCircle className="h-5 w-5" />}
              status={columnsToKeep ? "current" : "pending"} 
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
              {processingStage === 'cleaned' && (
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={goToNextTab} 
                    className="flex items-center gap-2"
                  >
                    Next: Select Features
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="features" className="pt-4">
              <FeatureImportanceChart />
              {targetColumn && taskType && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
                  <h4 className="font-medium text-blue-800 mb-2">Selected Target & Task Type</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md flex items-center">
                      <span className="font-medium mr-1">Target:</span> {targetColumn}
                    </div>
                    <div className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-md flex items-center">
                      <span className="font-medium mr-1">Task Type:</span> {formatTaskType(taskType)}
                    </div>
                  </div>
                </div>
              )}
              <FeatureSelector />
              {processingStage === 'final' && (
                <div className="mt-6">
                  <DataPreview />
                  <div className="flex justify-end mt-6">
                    <Button 
                      onClick={goToNextTab} 
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                      Continue to Preprocessing
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="preprocess" className="pt-4">
              <PreprocessingOptions />
              <DataPreview />
              {datasetId && targetColumn && taskType && (
                <div className="flex justify-end mt-8">
                  <Link to="/training">
                    <Button size="lg" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
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
