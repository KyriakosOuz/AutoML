
import React, { useEffect, useState } from 'react';
import { DatasetProvider } from '@/contexts/DatasetContext';
import { TrainingProvider, useTraining } from '@/contexts/training/TrainingContext';
import ModelTrainingContent from '@/components/training/ModelTrainingContent';
import TrainingHeader from '@/components/training/TrainingHeader';
import { Toaster } from '@/components/ui/toaster';
import { AssistantInsightsProvider } from '@/contexts/AssistantInsightsContext';
import TrainingSidePanel from '@/components/ai-assistant/TrainingSidePanel';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Create a separate component that uses the context
const TrainingPageContent: React.FC = () => {
  const { 
    checkLastExperiment, 
    experimentStatus, 
    isTraining, 
    forceResetTrainingState, 
    stopPolling,
    error
  } = useTraining();
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [showResetButton, setShowResetButton] = useState(false);
  const { toast } = useToast();
  
  // Function to handle manual reset
  const handleForceReset = () => {
    console.log("[ModelTrainingPage] Force resetting training state and clearing localStorage");
    // First attempt to clear localStorage directly for extra safety
    localStorage.removeItem('EXPERIMENT_STORAGE_KEY');
    localStorage.removeItem('EXPERIMENT_TYPE_STORAGE_KEY');
    localStorage.removeItem('EXPERIMENT_STORAGE_KEY_timestamp');
    
    // Use the context's reset function
    forceResetTrainingState();
    
    // Show confirmation toast
    toast({
      title: "Training State Reset",
      description: "All training state has been cleared. API polling has been stopped.",
    });
  };
  
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
    console.log("[ModelTrainingPage] Component mounted, adding cleanup function for polling");
    
    return () => {
      console.log("[ModelTrainingPage] Component unmounting, stopping polling");
      // Explicitly call stopPolling to ensure we don't leak intervals
      stopPolling();
    };
  }, [stopPolling]);
  
  // Always show reset button if there's an error
  useEffect(() => {
    if (error) {
      setShowResetButton(true);
    }
  }, [error]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <TrainingHeader />
      
      {/* Global Reset Button - Always visible at top of page */}
      <div className="p-2 sm:p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-end max-w-7xl mx-auto">
          <Button 
            onClick={handleForceReset} 
            variant="outline" 
            size="sm"
            className="text-gray-700 border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Reset All Training State
          </Button>
        </div>
      </div>
      
      {/* Warning banner for issues */}
      {(showResetButton && (experimentStatus === 'running' || experimentStatus === 'processing' || isTraining)) && (
        <div className="p-2 sm:p-3 bg-amber-50 border-b border-amber-200">
          <div className="flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
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
      
      {/* Error banner */}
      {error && (
        <div className="p-2 sm:p-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
            <p className="text-sm text-red-800 mr-2">
              Error: {error}
            </p>
            <Button 
              onClick={forceResetTrainingState} 
              variant="outline" 
              size="sm"
              className="text-red-800 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Reset & Try Again
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
