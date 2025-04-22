
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
        
        setExperimentStatus(statusResponse.status as ExperimentStatus);
        
        if (statusResponse.status === 'completed' || statusResponse.status === 'success') {
          console.log('[TrainingContext] Training completed successfully');
          stopPolling();
          onSuccess(experimentId);
        } else if (statusResponse.status === 'failed') {
          console.error('[TrainingContext] Training failed');
          stopPolling();
          onError('Training failed');
        } else if (pollingAttempts >= MAX_POLL_ATTEMPTS) {
          console.warn('[TrainingContext] Reached maximum polling attempts');
          stopPolling();
          onError('Timeout while waiting for training completion');
        } else {
          setPollingAttempts(prev => prev + 1);
        }
      } catch (error) {
        console.error('[TrainingContext] Polling error:', error);
        if (pollingAttempts >= MAX_POLL_ATTEMPTS) {
          setExperimentStatus('failed');
          stopPolling();
          onError('Failed to check experiment status after multiple attempts');
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
