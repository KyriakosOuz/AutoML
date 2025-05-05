
import React, { useEffect } from 'react';
import { DatasetProvider } from '@/contexts/DatasetContext';
import { TrainingProvider, useTraining } from '@/contexts/training/TrainingContext';
import ModelTrainingContent from '@/components/training/ModelTrainingContent';
import TrainingHeader from '@/components/training/TrainingHeader';
import { Toaster } from '@/components/ui/toaster';

// Create a separate component that uses the context
const TrainingPageContent: React.FC = () => {
  const { checkLastExperiment } = useTraining();
  
  // Check for the most recent experiment when the component mounts
  useEffect(() => {
    console.log("[ModelTrainingPage] Component mounted, checking for most recent experiment");
    checkLastExperiment();
  }, [checkLastExperiment]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <TrainingHeader />
      <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
        <ModelTrainingContent />
      </div>
    </div>
  );
};

// Main component that provides the context
const ModelTrainingPage: React.FC = () => {
  return (
    <DatasetProvider>
      <TrainingProvider>
        <TrainingPageContent />
        <Toaster />
      </TrainingProvider>
    </DatasetProvider>
  );
};

export default ModelTrainingPage;
