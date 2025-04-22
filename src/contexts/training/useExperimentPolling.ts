
import { useState, useCallback, useEffect } from 'react';
import { checkStatus } from '@/lib/training';
import { useToast } from '@/hooks/use-toast';
import { ExperimentStatus } from './types';
import { POLL_INTERVAL, MAX_POLL_ATTEMPTS } from './constants';
import { ApiResponse, ExperimentStatusResponse } from '@/types/api';

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

    const interval = setInterval(async () => {
      try {
        const response = await checkStatus(experimentId);
        console.log('[TrainingContext] Status response:', response);

        const data = response.data;

        if (data.status === 'failed' || !!data.error_message) {
          setExperimentStatus('failed');
          stopPolling();
          onError(data.error_message || 'Training failed.');
          toast({
            title: "Training Failed",
            description: data.error_message || "An error occurred during training.",
            variant: "destructive"
          });
          return;
        }

        setExperimentStatus(data.status as ExperimentStatus);

        // Stop polling if status is "completed" or "success" regardless of hasTrainingResults
        if (data.status === 'completed' || data.status === 'success') {
          console.log('[TrainingContext] Training completed, stopping polling.');
          stopPolling();
          onSuccess(experimentId);
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

        // Session expired/401
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

    setPollingInterval(interval);
  }, [onSuccess, onError, setExperimentStatus, setIsLoading, stopPolling, toast, pollingAttempts]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return { startPolling, stopPolling };
};
