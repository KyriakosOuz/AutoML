
import React from 'react';
import { Link } from 'react-router-dom';
import { Database, LogOut, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Steps, Step } from '@/components/ui/steps';
import { FileSpreadsheet, Workflow, Sliders, PlayCircle } from 'lucide-react';

interface DatasetHeaderProps {
  user: any;
  signOut: () => void;
  activeStep: number;
  datasetId: string | null;
  targetColumn: string | null;
  columnsToKeep: string[] | null;
}

const DatasetHeader: React.FC<DatasetHeaderProps> = ({
  user,
  signOut,
  activeStep,
  datasetId,
  targetColumn,
  columnsToKeep
}) => {
  return (
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
      
      <Steps active={activeStep}>
        <Step 
          title="Upload" 
          description="Dataset" 
          icon={<FileSpreadsheet className="h-5 w-5" />} 
          status={!datasetId ? "current" : "complete"} 
        />
        <Step 
          title="Handle" 
          description="Dataset" 
          icon={datasetId && !targetColumn ? <Workflow className="h-5 w-5" /> : <Check className="h-5 w-5" />} 
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
  );
};

export default DatasetHeader;
