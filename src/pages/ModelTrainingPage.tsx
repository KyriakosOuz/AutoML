
import React, { useEffect, useState } from 'react';
import { DatasetProvider } from '@/contexts/DatasetContext';
import { TrainingProvider, useTraining } from '@/contexts/training/TrainingContext';
import ModelTrainingContent from '@/components/training/ModelTrainingContent';
import TrainingHeader from '@/components/training/TrainingHeader';
import { Toaster } from '@/components/ui/toaster';
import { AssistantInsightsProvider } from '@/contexts/AssistantInsightsContext';
import TrainingSidePanel from '@/components/ai-assistant/TrainingSidePanel';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

// Create a separate component that uses the context
const TrainingPageContent: React.FC = () => {
  const { 
    checkLastExperiment, 
    experimentStatus, 
    isTraining, 
    forceResetTrainingState, 
    stopPolling // Make sure we have access to stopPolling
  } = useTraining();
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [showResetButton, setShowResetButton] = useState(false);
  
  // Check for the most recent experiment when the component mounts, but only once
  useEffect(() => {
    if (!hasAttemptedFetch) {
      console.log("[ModelTrainingPage] Component mounted, checking for most recent experiment");
      checkLastExperiment();
      setHasAttemptedFetch(true);
      
      // Set a timeout to show the reset button if we're still in a processing/running state
      const timer = setTimeout(() => {
        if (experimentStatus === 'running' || experimentStatus === 'processing' || isTraining) {
          console.log("[ModelTrainingPage] Training still in progress after timeout, showing reset button");
          setShowResetButton(true);
        }
      }, 30000); // Show after 30 seconds
      
      return () => clearTimeout(timer);
    }
  }, [checkLastExperiment, hasAttemptedFetch, experimentStatus, isTraining]);
  
  // Make sure we stop polling when component unmounts
  useEffect(() => {
    return () => {
      console.log("[ModelTrainingPage] Component unmounting, stopping polling");
      stopPolling();
    };
  }, [stopPolling]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <TrainingHeader />
      {showResetButton && (experimentStatus === 'running' || experimentStatus === 'processing' || isTraining) && (
        <div className="p-2 sm:p-3 bg-amber-50 border-b border-amber-200">
          <div className="flex items-center justify-center">
            <p className="text-sm text-amber-800 mr-2">
              Training seems to be taking a while. If you're experiencing issues:
            </p>
            <Button 
              onClick={forceResetTrainingState} 
              variant="outline" 
              size="sm"
              className="text-amber-800 border-amber-300 hover:bg-amber-100"
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Reset Training State
            </Button>
          </div>
        </div>
      )}
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
