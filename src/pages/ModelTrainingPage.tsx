
import React, { useEffect } from 'react';
import { useTraining } from '@/contexts/training/TrainingContext';
import ModelTrainingContent from '@/components/training/ModelTrainingContent';
import TrainingHeader from '@/components/training/TrainingHeader';
import { Toaster } from '@/components/ui/toaster';
import TrainingSidePanel from '@/components/ai-assistant/TrainingSidePanel';

const ModelTrainingPage: React.FC = () => {
  const { checkLastExperiment } = useTraining();
  
  // Check for the most recent experiment when the component mounts
  useEffect(() => {
    console.log("[ModelTrainingPage] Component mounted, checking for most recent experiment");
    checkLastExperiment();
    // Only check once on mount, no need to re-check on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen">
      <TrainingHeader />
      <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
        <ModelTrainingContent />
      </div>
      <TrainingSidePanel />
      <Toaster />
    </div>
  );
};

export default ModelTrainingPage;
