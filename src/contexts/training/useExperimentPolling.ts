
import { useState, useCallback, useEffect } from 'react';
import { checkStatus } from '@/lib/training';
import { useToast } from '@/hooks/use-toast';
import { ExperimentStatus } from '@/types/training';
import { ExperimentStatusResponse } from '@/types/api';
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
  const { toast } = useToast();

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // Use setInterval, but always stop (cancel) as soon as results are reported ready!
  const startPolling = useCallback(async (experimentId: string) => {
    stopPolling();

    console.log('[TrainingContext] Starting polling for experiment:', experimentId);
    setIsLoading(true);
    setPollingAttempts(0);
    setExperimentStatus('processing');

    toast({
      title: "Training Started",
      description: "Your model training has started. Please wait while we process your request."
    });

    const poller = setInterval(async () => {
      try {
        const response = await checkStatus(experimentId);
        console.log('[TrainingContext] Status response:', response);
        
        // Handle different response formats to extract the status data
        let statusData: ExperimentStatusResponse;
        
        if (response.data) {
          statusData = response.data as ExperimentStatusResponse;
        } else {
          statusData = response as any as ExperimentStatusResponse;
        }
        
        console.log('[TrainingContext] Status data extracted:', statusData);

        if (statusData.status === 'failed' || !!statusData.error_message) {
          setExperimentStatus('failed');
          stopPolling();
          onError(statusData.error_message || 'Training failed.');
          toast({
            title: "Training Failed",
            description: statusData.error_message || "An error occurred during training.",
            variant: "destructive"
          });
          return;
        }
        setExperimentStatus(statusData.status);

        // Stop polling immediately if results are available
        if (statusData.hasTrainingResults === true) {
          console.log('[TrainingContext] Results ready — stopping poller');
          clearInterval(poller);
          setPollingInterval(null);

          setTimeout(() => {
            onSuccess(experimentId);
          }, 1000); // (optional: allow backend ready time)
          return;
        }
        if (pollingAttempts >= MAX_POLL_ATTEMPTS) {
          console.warn('[TrainingContext] Reached maximum polling attempts');
          setExperimentStatus('failed');
          stopPolling();
          onError('Timeout while waiting for training completion');
          toast({
            title: "Training Timeout",
            description: "The training process took too long to complete",
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
        if (pollingAttempts >= MAX_POLL_ATTEMPTS) {
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

  return { startPolling, stopPolling };
};
