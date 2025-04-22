
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
        
        if (response.status === 'error') {
          throw new Error(response.message || 'Invalid status response from server');
        }

        const data = response.data;
        setExperimentStatus(data.status as ExperimentStatus);

        if (data.status === 'completed' && data.hasTrainingResults) {
          console.log('[TrainingContext] Training completed successfully');
          stopPolling();
          onSuccess(experimentId);
        } else if (data.status === 'failed') {
          console.error('[TrainingContext] Training failed:', data.error_message);
          stopPolling();
          onError(data.error_message || 'Training failed');
          toast({
            title: "Training Failed",
            description: data.error_message || "An error occurred during training",
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
