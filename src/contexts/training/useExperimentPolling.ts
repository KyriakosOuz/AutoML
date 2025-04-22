
import { useState, useCallback, useEffect } from 'react';
import { trainingApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ExperimentStatus } from './types';
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

  const startPolling = useCallback(async (experimentId: string) => {
    stopPolling();
    
    console.log('[TrainingContext] Starting polling for experiment:', experimentId);
    setIsLoading(true);
    setPollingAttempts(0);
    setExperimentStatus('processing');

    toast({
      title: "Training in Progress",
      description: "Your model training has started. Please wait while we process your request."
    });

    const interval = setInterval(async () => {
      try {
        const statusResponse = await trainingApi.checkStatus(experimentId);
        console.log('[TrainingContext] Status response:', {
          status: statusResponse.status,
          experimentId,
          response: statusResponse
        });

        if (!statusResponse) {
          throw new Error('Invalid status response from server');
        }

        // Update experiment status based on the response
        const status = statusResponse.data?.status || statusResponse.status;
        setExperimentStatus(status as ExperimentStatus);
        
        // Only proceed to fetch results if status is completed and hasTrainingResults is true
        if (status === 'completed' && statusResponse.data?.hasTrainingResults === true) {
          console.log('[TrainingContext] Training completed successfully with results available');
          stopPolling();
          onSuccess(experimentId);
        } else if (status === 'failed' || statusResponse.status === 'error') {
          console.error('[TrainingContext] Training failed:', statusResponse.message || statusResponse.error_message);
          stopPolling();
          onError(statusResponse.message || statusResponse.error_message || 'Training failed');
          toast({
            title: "Training Failed",
            description: statusResponse.message || statusResponse.error_message || "An error occurred during training",
            variant: "destructive"
          });
        } else if (pollingAttempts >= MAX_POLL_ATTEMPTS) {
          console.warn('[TrainingContext] Reached maximum polling attempts');
          stopPolling();
          onError('Timeout while waiting for training completion');
          toast({
            title: "Training Timeout",
            description: "The training process took too long to complete",
            variant: "destructive"
          });
        } else {
          setPollingAttempts(prev => prev + 1);
        }
      } catch (error) {
        console.error('[TrainingContext] Polling error:', error);
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
  }, [onSuccess, onError, setExperimentStatus, setIsLoading, stopPolling, toast]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return { startPolling, stopPolling };
};
