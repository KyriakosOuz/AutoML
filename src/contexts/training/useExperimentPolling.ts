
import { useState, useCallback, useEffect, useRef } from 'react';
import { checkStatus } from '@/lib/training';
import { useToast } from '@/hooks/use-toast';
import { ExperimentStatus, ExperimentStatusResponse, TrainingType } from '@/types/training';
import { POLL_INTERVAL, MAX_POLL_ATTEMPTS } from './constants';

export interface UseExperimentPollingProps {
  onSuccess: (experimentId: string) => void;
  onError: (error: string) => void;
  setExperimentStatus: (status: ExperimentStatus) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useExperimentPolling = ({
  onSuccess,
  onError,
  setExperimentStatus,
  setIsLoading
}: UseExperimentPollingProps) => {
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [experimentType, setExperimentType] = useState<TrainingType | null>(null);
  const [activeExperimentId, setActiveExperimentId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Using a ref to track if polling has been stopped manually
  const isManuallyStoppedRef = useRef<boolean>(false);
  // Track if polling is currently active
  const isPollingActiveRef = useRef<boolean>(false);

  // Log the state whenever experimentType changes
  useEffect(() => {
    console.log('[useExperimentPolling] Experiment type changed:', experimentType);
  }, [experimentType]);
  
  // Log the state whenever activeExperimentId changes
  useEffect(() => {
    console.log('[useExperimentPolling] Active experiment ID changed:', activeExperimentId);
  }, [activeExperimentId]);

  const stopPolling = useCallback(() => {
    if (pollingInterval || isPollingActiveRef.current) {
      console.log('[useExperimentPolling] Stopping polling for experiment:', activeExperimentId);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      isManuallyStoppedRef.current = true;
      isPollingActiveRef.current = false;
      
      console.log('[useExperimentPolling] Resetting experiment state');
      // Reset active experiment ID when polling is stopped
      setActiveExperimentId(null);
      
      // Also reset the experiment type when polling stops
      setExperimentType(null);
      
      // Reset polling attempts
      setPollingAttempts(0);
      
      console.log('[useExperimentPolling] Polling has been fully stopped');
    }
  }, [pollingInterval, activeExperimentId]);

  // Use setInterval, but always stop (cancel) as soon as results are reported ready!
  const startPolling = useCallback(async (experimentId: string, type: TrainingType = 'automl') => {
    // Always stop any existing polling first
    stopPolling();

    console.log(`[useExperimentPolling] Starting polling for ${type} experiment:`, experimentId);
    setIsLoading(true);
    setPollingAttempts(0);
    setExperimentType(type);
    setExperimentStatus('processing');
    setActiveExperimentId(experimentId);
    isManuallyStoppedRef.current = false;
    isPollingActiveRef.current = true;

    // Show toast notification with information about the background processing
    toast({
      title: "Training Started",
      description: "Your model training has started and will continue even if you close the app. You can return anytime to check progress."
    });

    // Show a second toast with important information about background processing
    setTimeout(() => {
      toast({
        title: "Background Processing",
        description: "This training job will continue on our servers even if you close this browser tab or window. You can return later to check the results.",
      });
    }, 1500);

    const poller = setInterval(async () => {
      try {
        // Check if polling was manually stopped
        if (isManuallyStoppedRef.current) {
          console.log('[useExperimentPolling] Polling manually stopped, skipping interval');
          return;
        }

        // Log current polling state
        console.log(`[useExperimentPolling] Polling attempt ${pollingAttempts + 1} for ${type} experiment (${experimentId})`);

        const response = await checkStatus(experimentId);
        const data = response.data;
        console.log(`[useExperimentPolling] Status response for ${type} experiment (${experimentId}):`, data);

        // IMPROVED: Better failure detection - check explicitly for 'failed' status
        // or an error_message in the response
        if (data.status === 'failed' || data.status === 'error' || !!data.error_message) {
          console.log(`[useExperimentPolling] Experiment ${experimentId} FAILED - stopping poller`);
          setExperimentStatus('failed');
          stopPolling();
          
          // Display the error message from the API or a generic one
          const errorMessage = data.error_message || 'Training failed.';
          onError(errorMessage);
          
          toast({
            title: "Training Failed",
            description: errorMessage,
            variant: "destructive"
          });
          return;
        }
        
        // Map 'success' status to 'completed' for consistency
        const mappedStatus = data.status === 'success' ? 'completed' : data.status;
        setExperimentStatus(mappedStatus);

        // Enhanced check for experiment completion
        const isCompleted = data.hasTrainingResults === true || 
                          data.status === 'success' || 
                          data.status === 'completed';

        if (isCompleted) {
          console.log(`[useExperimentPolling] ${type.toUpperCase()} experiment completed — stopping poller`);
          
          // Call onSuccess first, before stopping polling, to ensure state is available
          console.log(`[useExperimentPolling] Calling onSuccess for ${type} experiment:`, experimentId);
          
          // Add a small delay to ensure backend is ready - slightly longer for AutoML
          const delay = type === 'automl' ? 1500 : 1000;
          
          setTimeout(() => {
            // Make sure we're still in a valid state before calling onSuccess
            if (!isManuallyStoppedRef.current) {
              onSuccess(experimentId);
            }
            // Now stop polling after onSuccess has been called
            stopPolling();
          }, delay);
          return;
        }
        
        // FIX: Adjusted to use a lower MAX_POLL_ATTEMPTS for faster timeout in case of issues
        if (pollingAttempts >= MAX_POLL_ATTEMPTS) {
          console.warn('[useExperimentPolling] Reached maximum polling attempts');
          setExperimentStatus('failed');
          stopPolling();
          onError('Timeout while waiting for training completion. The training job may still be running on our servers - please check back later.');
          toast({
            title: "Training Timeout",
            description: "The training process took too long to complete. However, the job may still be running on our servers. You can check back later for results.",
            variant: "destructive"
          });
          return;
        }
        setPollingAttempts(prev => prev + 1);
      } catch (error: any) {
        console.error('[useExperimentPolling] Polling error:', error);
        
        // Increment retry count
        const newRetryCount = pollingAttempts + 1;
        setPollingAttempts(newRetryCount);
        
        if (
          typeof error.message === 'string' &&
          (error.message.includes('Unauthorized') || error.message.includes('401'))
        ) {
          stopPolling();
          setExperimentStatus('failed');
          onError('Your session has expired. Please log in again.');
          toast({
            title: "Session Expired",
            description: "Please log in again to continue training.",
            variant: "destructive"
          });
          return;
        }
        
        // FIX: Ensure we set failed status and stop polling after fewer attempts
        if (pollingAttempts >= Math.min(5, MAX_POLL_ATTEMPTS)) {
          console.log('[useExperimentPolling] Too many errors during polling, stopping');
          setExperimentStatus('failed');
          stopPolling();
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          onError(`Failed to check experiment status: ${errorMessage}`);
          toast({
            title: "Error",
            description: `Failed to check experiment status: ${errorMessage}`,
            variant: "destructive"
          });
        } else {
          setPollingAttempts(prev => prev + 1);
        }
      }
    }, POLL_INTERVAL);

    setPollingInterval(poller);
    
    // Return an object containing info about the current polling operation
    return {
      experimentId,
      type,
      stop: stopPolling
    };
  }, [onSuccess, onError, setExperimentStatus, setIsLoading, stopPolling, toast, pollingAttempts]);

  // Ensure we clean up on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        console.log('[useExperimentPolling] Cleaning up polling on unmount');
        clearInterval(pollingInterval);
        isPollingActiveRef.current = false;
      }
    };
  }, [pollingInterval]);

  return { 
    startPolling, 
    stopPolling, 
    experimentType,
    activeExperimentId,
    isPolling: !!pollingInterval || isPollingActiveRef.current
  };
};
