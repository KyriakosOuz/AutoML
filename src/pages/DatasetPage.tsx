
import React from 'react';
import { DatasetProvider, useDataset } from '@/contexts/DatasetContext';
import FileUpload from '@/components/dataset/FileUpload';
import DataPreview from '@/components/dataset/DataPreview';
import MissingValueHandler from '@/components/dataset/MissingValueHandler';
import FeatureImportanceChart from '@/components/dataset/FeatureImportanceChart';
import TaskDetector from '@/components/dataset/TaskDetector';
import FeatureSelector from '@/components/dataset/FeatureSelector';
import PreprocessingOptions from '@/components/dataset/PreprocessingOptions';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, RotateCcw, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-5xl mx-auto px-4">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <Link to="/" className="text-xl font-bold text-gray-900">AutoML Web App</Link>
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
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dataset Upload & Preprocessing</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Upload, explore, and preprocess your datasets for machine learning. 
              Handle missing values, select features, and prepare your data for modeling.
            </p>
          </div>
        </header>
        
        <div className="space-y-6">
          <FileUpload />
          <DataPreview />
          <MissingValueHandler />
          <FeatureImportanceChart />
          <TaskDetector />
          <FeatureSelector />
          <PreprocessingOptions />
          
          {datasetId && targetColumn && taskType && (
            <div className="flex justify-center mt-8">
              <Link to="/training">
                <Button size="lg" className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Proceed to Model Training
                </Button>
              </Link>
            </div>
          )}
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
