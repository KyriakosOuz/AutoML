
import { useState, useCallback, useEffect, useRef } from 'react';
import { checkStatus } from '@/lib/training';
import { useToast } from '@/hooks/use-toast';
import { ExperimentStatus } from '@/types/training';
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
  const [lastStatusChange, setLastStatusChange] = useState<Date | null>(null);
  const lastStatusRef = useRef<string | null>(null);
  const isPollingActiveRef = useRef<boolean>(false);
  const experimentIdRef = useRef<string | null>(null);
  const MAX_TIME_WITHOUT_STATUS_CHANGE = 60000 * 5; // 5 minutes without status change
  const { toast } = useToast();

  // Enhanced stopPolling function with better cleanup
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      console.log('[TrainingContext] Polling interval cleared');
    }
    
    // Reset all state to ensure polling is truly stopped
    setPollingInterval(null);
    isPollingActiveRef.current = false;
    experimentIdRef.current = null;
    console.log('[TrainingContext] Polling stopped completely');
  }, [pollingInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        console.log('[TrainingContext] Polling cleared on unmount');
      }
    };
  }, [pollingInterval]);

  // Check if an experiment is already completed to avoid polling
  const checkIfAlreadyCompleted = useCallback(async (experimentId: string): Promise<boolean> => {
    try {
      console.log('[TrainingContext] Checking if experiment is already completed:', experimentId);
      const response = await checkStatus(experimentId);
      const data = response.data;
      
      // Improved completion check - explicitly check both status and hasTrainingResults
      if ((data.status === 'completed' || data.status === 'success') && data.hasTrainingResults === true) {
        console.log('[TrainingContext] Experiment already completed with results, no need to start polling');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[TrainingContext] Error checking if experiment is already completed:', error);
      return false;
    }
  }, []);

  // Use setInterval, but always stop (cancel) as soon as results are reported ready!
  const startPolling = useCallback(async (experimentId: string) => {
    // First, check if this experiment is already completed to avoid polling
    const isAlreadyCompleted = await checkIfAlreadyCompleted(experimentId);
    if (isAlreadyCompleted) {
      setExperimentStatus('completed');
      onSuccess(experimentId);
      return;
    }
    
    // Prevent multiple polling instances for the same experiment
    if (isPollingActiveRef.current && experimentIdRef.current === experimentId) {
      console.log('[TrainingContext] Polling already active for this experiment, not starting again');
      return;
    }
    
    // Stop any existing polling first
    stopPolling();
    
    console.log('[TrainingContext] Starting polling for experiment:', experimentId);
    experimentIdRef.current = experimentId;
    isPollingActiveRef.current = true;
    setIsLoading(true);
    setPollingAttempts(0);
    setExperimentStatus('processing');
    setLastStatusChange(new Date());
    lastStatusRef.current = 'processing';

    toast({
      title: "Training Started",
      description: "Your model training has started. Please wait while we process your request."
    });
    
    // Do an initial status check before setting up interval
    try {
      const initialResponse = await checkStatus(experimentId);
      const initialData = initialResponse.data;
      console.log('[TrainingContext] Initial status check response:', initialData);
      
      // Improved completion check - explicitly check both status and hasTrainingResults
      if ((initialData.status === 'completed' || initialData.status === 'success') && 
          initialData.hasTrainingResults === true) {
        console.log('[TrainingContext] Experiment already completed with results, not starting polling');
        setExperimentStatus(initialData.status === 'success' ? 'completed' : initialData.status as ExperimentStatus);
        onSuccess(experimentId);
        return;
      }
    } catch (error) {
      console.error('[TrainingContext] Error in initial status check:', error);
      // Continue to polling anyway, as the error might be temporary
    }

    const poller = setInterval(async () => {
      try {
        if (!isPollingActiveRef.current) {
          console.log('[TrainingContext] Polling disabled, clearing interval');
          clearInterval(poller);
          return;
        }
        
        const response = await checkStatus(experimentId);
        const data = response.data;
        console.log('[TrainingContext] Status response data:', data);

        // Check if status has changed
        if (lastStatusRef.current !== data.status) {
          lastStatusRef.current = data.status;
          setLastStatusChange(new Date());
        } else {
          // Check if we're stuck in the same status for too long
          const now = new Date();
          const timeSinceLastChange = lastStatusChange ? now.getTime() - lastStatusChange.getTime() : 0;
          if (timeSinceLastChange > MAX_TIME_WITHOUT_STATUS_CHANGE && data.status === 'running') {
            console.warn(`[TrainingContext] Experiment seems stuck in '${data.status}' status for over 5 minutes`);
            stopPolling();
            setExperimentStatus('failed');
            onError('Training seems to be stuck. The experiment has been in the same status for too long.');
            toast({
              title: "Training Stuck",
              description: "Training has been in the same status for too long. Please try again.",
              variant: "destructive"
            });
            return;
          }
        }

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

        // Improved completion check - explicitly check both status and hasTrainingResults
        if ((data.status === 'completed' || data.status === 'success') && 
            data.hasTrainingResults === true) {
          console.log('[TrainingContext] Results ready and experiment completed — stopping poller');
          stopPolling();

          setTimeout(() => {
            onSuccess(experimentId);
          }, 1000); // (optional: allow backend ready time)
          return;
        }
        
        // Also stop if status is completed even if hasTrainingResults isn't explicitly true 
        // (fallback safety check, some backends might not set this flag)
        if (data.status === 'completed' || data.status === 'success') {
          console.log('[TrainingContext] Experiment completed status detected — stopping poller');
          stopPolling();
          
          setTimeout(() => {
            onSuccess(experimentId);
          }, 1000);
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
        
        // Handle 404/400 errors specially - experiment might not exist
        if (error.status === 404 || error.status === 400) {
          stopPolling();
          setExperimentStatus('failed');
          onError('Experiment not found. It may have been deleted or never existed.');
          toast({
            title: "Experiment Not Found",
            description: "The experiment you're trying to monitor doesn't exist. Starting fresh.",
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
  }, [onSuccess, onError, setExperimentStatus, setIsLoading, stopPolling, toast, checkIfAlreadyCompleted]);

  return { startPolling, stopPolling };
};
