
import React from 'react';
import { Steps, Step } from '@/components/ui/steps';
import { FileSpreadsheet, Table, Sliders, PlayCircle } from 'lucide-react';

interface DatasetHeaderProps {
  user: any;
  signOut: () => void;
  activeStep: number;
  datasetId: string | null;
  targetColumn: string | null;
  columnsToKeep: string[] | null;
}

const DatasetHeader: React.FC<DatasetHeaderProps> = ({
  activeStep,
  datasetId,
  targetColumn,
  columnsToKeep
}) => {
  return (
    <header className="mb-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Dataset Processing</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload, explore, and preprocess your datasets for machine learning. 
          Handle missing values, analyze features, and prepare your data for modeling.
        </p>
        <p className="mt-3 text-sm font-medium text-primary">
          Step {activeStep + 1} of 4
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
          title="Dataset" 
          description="Handle" 
          icon={<Table className="h-5 w-5" />} 
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
