
import React, { useEffect, useState } from 'react';
import { DatasetProvider } from '@/contexts/DatasetContext';
import { TrainingProvider, useTraining } from '@/contexts/training/TrainingContext';
import ModelTrainingContent from '@/components/training/ModelTrainingContent';
import TrainingHeader from '@/components/training/TrainingHeader';
import { Toaster } from '@/components/ui/toaster';
import { AssistantInsightsProvider } from '@/contexts/AssistantInsightsContext';
import TrainingSidePanel from '@/components/ai-assistant/TrainingSidePanel';

// Create a separate component that uses the context
const TrainingPageContent: React.FC = () => {
  const { checkLastExperiment } = useTraining();
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  
  // Check for the most recent experiment when the component mounts
  useEffect(() => {
    if (!hasAttemptedFetch) {
      console.log("[ModelTrainingPage] Component mounted, checking for most recent experiment");
      checkLastExperiment();
      setHasAttemptedFetch(true);
    }
  }, [checkLastExperiment, hasAttemptedFetch]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <TrainingHeader />
      <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
        <ModelTrainingContent />
      </div>
      <TrainingSidePanel />
    </div>
  );
};

// Main component that provides the context
const ModelTrainingPage: React.FC = () => {
  return (
    <DatasetProvider>
      <TrainingProvider>
        <AssistantInsightsProvider>
          <TrainingPageContent />
          <Toaster />
        </AssistantInsightsProvider>
      </TrainingProvider>
    </DatasetProvider>
  );
};

export default ModelTrainingPage;
