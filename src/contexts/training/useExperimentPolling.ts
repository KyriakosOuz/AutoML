
import { useState, useCallback, useEffect } from 'react';
import { checkStatus } from '@/lib/training';
import { useToast } from '@/hooks/use-toast';
import { ExperimentStatus, ExperimentStatusResponse } from '@/types/training';
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
  const [experimentType, setExperimentType] = useState<'automl' | 'custom' | null>(null);
  const { toast } = useToast();

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      console.log('[useExperimentPolling] Stopping polling');
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // Use setInterval, but always stop (cancel) as soon as results are reported ready!
  const startPolling = useCallback(async (experimentId: string, type: 'automl' | 'custom' = 'automl') => {
    stopPolling();

    console.log(`[TrainingContext] Starting polling for ${type} experiment:`, experimentId);
    setIsLoading(true);
    setPollingAttempts(0);
    setExperimentType(type);
    setExperimentStatus('processing');

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
        const response = await checkStatus(experimentId);
        const data = response.data;
        console.log(`[TrainingContext] Status response data (${type} experiment):`, data);

        // FIX: Properly check for failure status and error message in the response
        if (data.status === 'failed' || data.status === 'error' || !!data.error_message) {
          console.log(`[TrainingContext] Experiment ${experimentId} FAILED - stopping poller`);
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

        // Enhanced check for AutoML experiment completion
        const isCompleted = data.hasTrainingResults === true || 
                          data.status === 'success' || 
                          data.status === 'completed';

        if (isCompleted) {
          console.log(`[TrainingContext] ${type.toUpperCase()} experiment completed — stopping poller`);
          stopPolling();

          // Add a small delay to ensure backend is ready - slightly longer for AutoML
          const delay = type === 'automl' ? 1500 : 1000;
          setTimeout(() => {
            console.log(`[TrainingContext] Calling onSuccess for ${type} experiment:`, experimentId);
            onSuccess(experimentId);
          }, delay);
          return;
        }
        
        // FIX: Adjusted to use a lower MAX_POLL_ATTEMPTS for faster timeout in case of issues
        if (pollingAttempts >= MAX_POLL_ATTEMPTS) {
          console.warn('[TrainingContext] Reached maximum polling attempts');
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
        console.error('[TrainingContext] Polling error:', error);
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
          console.log('[TrainingContext] Too many errors during polling, stopping');
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
  }, [onSuccess, onError, setExperimentStatus, setIsLoading, stopPolling, toast, pollingAttempts]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return { startPolling, stopPolling, experimentType };
};
