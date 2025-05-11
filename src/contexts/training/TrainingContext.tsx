import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { trainingApi } from '@/lib/api';
import { ExperimentResults, ExperimentStatusResponse } from '@/types/training';
import { TrainingContextValue, TrainingContextState, ExperimentStatus } from './types';
import { EXPERIMENT_STORAGE_KEY, EXPERIMENT_TYPE_STORAGE_KEY, defaultAutomlParameters, defaultCustomParameters } from './constants';
import { useExperimentPolling } from './useExperimentPolling';
import { checkStatus } from '@/lib/training';

const TrainingContext = createContext<TrainingContextValue | undefined>(undefined);

// New constant for experiment name storage
const EXPERIMENT_NAME_STORAGE_KEY = 'experiment_name';
// New flag to prevent resultsLoaded from being reset during loading
const RESULTS_LOADED_DELAY_MS = 1500; // Extended delay before potentially setting resultsLoaded back to false

export const TrainingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [state, setState] = useState<TrainingContextState>({
    isTraining: false,
    isSubmitting: false, // Initialize isSubmitting state
    lastTrainingType: null,
    automlParameters: defaultAutomlParameters,
    customParameters: defaultCustomParameters,
    automlResult: null,
    customResult: null,
    error: null,
    activeExperimentId: null,
    experimentResults: null,
    isLoadingResults: false,
    experimentStatus: 'idle', // Changed from 'processing' to 'idle'
    statusResponse: null,
    automlEngine: defaultAutomlParameters.automlEngine,
    testSize: defaultAutomlParameters.testSize,
    stratify: defaultAutomlParameters.stratify,
    randomSeed: defaultAutomlParameters.randomSeed,
    activeTab: 'automl',
    isCheckingLastExperiment: false,
    resultsLoaded: false, // Initialize resultsLoaded state explicitly
    experimentName: null, // Initialize experiment name as null
  });

  // Track if we just completed polling - extend timeout for more reliability
  const [recentlyCompletedPolling, setRecentlyCompletedPolling] = useState(false);
  const [isAutoMLExperiment, setIsAutoMLExperiment] = useState(false);

  // Improved polling state tracking with experiment ID
  const [currentPollingInfo, setCurrentPollingInfo] = useState<{
    experimentId: string | null;
    type: 'automl' | 'custom' | null;
  }>({
    experimentId: null,
    type: null
  });

  // Enhanced experiment restoration with improved logging and error handling
  useEffect(() => {
    const restoreExperiment = async () => {
      try {
        const savedExperimentId = localStorage.getItem(EXPERIMENT_STORAGE_KEY);
        const savedTrainingType = localStorage.getItem(EXPERIMENT_TYPE_STORAGE_KEY) as 'automl' | 'custom' | null;
        const savedExperimentName = localStorage.getItem(EXPERIMENT_NAME_STORAGE_KEY);
        
        if (savedExperimentId) {
          console.log("[TrainingContext] Restored experiment ID from storage:", savedExperimentId);
          
          // First update state with basic info we have from storage
          setState(prev => ({
            ...prev,
            activeExperimentId: savedExperimentId,
            lastTrainingType: savedTrainingType,
            experimentStatus: 'processing', // Start with processing status until we know more
            isLoadingResults: true,
            experimentName: savedExperimentName // Restore saved experiment name
          }));
          
          // Then check the actual experiment status from the API
          try {
            console.log("[TrainingContext] Checking status of restored experiment");
            const statusResponse = await checkStatus(savedExperimentId);
            const status = statusResponse.data;
            console.log("[TrainingContext] Retrieved status for restored experiment:", status);
            
            // Map backend status to our internal status type
            let mappedStatus: ExperimentStatus = status.status as ExperimentStatus;
            
            // If backend returns 'success', map it to our 'completed' status
            if (mappedStatus === 'success' || mappedStatus === 'completed') {
              mappedStatus = 'completed';
            }
            
            // Update with the actual status
            setState(prev => ({
              ...prev,
              experimentStatus: mappedStatus,
              statusResponse: status,
              isLoadingResults: false,
              // If experiment is still running or processing, we want to set isTraining to true
              isTraining: ['running', 'processing'].includes(mappedStatus)
            }));
            
            // If the experiment is still in progress, restart polling
            if (['running', 'processing'].includes(mappedStatus)) {
              console.log("[TrainingContext] Experiment still in progress, restarting polling");
              
              // Make sure we're not already polling for this experiment
              if (currentPollingInfo.experimentId !== savedExperimentId) {
                startPolling(savedExperimentId, savedTrainingType || 'automl');
              }
            } 
            // If it's completed, fetch results
            else if (mappedStatus === 'completed') {
              console.log("[TrainingContext] Experiment completed, fetching results");
              getExperimentResults();
            }
          } catch (error) {
            console.error("[TrainingContext] Error checking status of restored experiment:", error);
            // If there's an error checking status, assume it's completed to prevent blocking the UI
            setState(prev => ({
              ...prev,
              experimentStatus: 'completed',
              isLoadingResults: false
            }));
            
            // Show toast to inform user
            toast({
              title: "Error checking experiment status",
              description: "Could not verify the current experiment status. Showing cached data instead.",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error("[TrainingContext] Error restoring experiment from localStorage:", error);
      }
    };
    
    restoreExperiment();
  }, []);

  // New method to check for the most recent experiment
  const checkLastExperiment = async () => {
    // Skip if we already have an active experiment or are already checking
    if (state.activeExperimentId || state.isCheckingLastExperiment) {
      console.log("[TrainingContext] Already have an active experiment or checking, skipping last experiment lookup");
      return;
    }

    try {
      console.log("[TrainingContext] Checking for most recent experiment");
      
      setState(prev => ({
        ...prev,
        isCheckingLastExperiment: true
      }));
      
      // Get the latest experiment from the API
      const latestExperiment = await trainingApi.getLastExperiment();
      
      if (!latestExperiment) {
        console.log("[TrainingContext] No recent experiments found");
        setState(prev => ({ ...prev, isCheckingLastExperiment: false }));
        return;
      }
      
      console.log("[TrainingContext] Found recent experiment:", latestExperiment);
      
      // Update state with the latest experiment
      const experimentId = latestExperiment.id;
      
      // First update with basic info
      setState(prev => ({
        ...prev,
        activeExperimentId: experimentId,
        experimentStatus: 'processing',
        lastTrainingType: latestExperiment.automl_engine ? 'automl' : 'custom',
        isLoadingResults: true,
        experimentName: latestExperiment.experiment_name || null // Get experiment name from response
      }));
      
      // Save to localStorage for persistence between page refreshes
      localStorage.setItem(EXPERIMENT_STORAGE_KEY, experimentId);
      localStorage.setItem(EXPERIMENT_TYPE_STORAGE_KEY, latestExperiment.automl_engine ? 'automl' : 'custom');
      if (latestExperiment.experiment_name) {
        localStorage.setItem(EXPERIMENT_NAME_STORAGE_KEY, latestExperiment.experiment_name);
      }
      
      // Then check the actual status
      const statusResponse = await checkStatus(experimentId);
      const status = statusResponse.data;
      
      // Map backend status to our internal status type
      let mappedStatus: ExperimentStatus = status.status as ExperimentStatus;
      
      // If backend returns 'success', map it to our 'completed' status
      if (mappedStatus === 'success' || mappedStatus === 'completed') {
        mappedStatus = 'completed';
      }
      
      // Update with the actual status
      setState(prev => ({
        ...prev,
        experimentStatus: mappedStatus,
        statusResponse: status,
        isLoadingResults: false,
        isCheckingLastExperiment: false,
        // If experiment is still running, we want to set isTraining to true
        isTraining: ['running', 'processing'].includes(mappedStatus)
      }));
      
      // If has results and is completed, fetch them right away
      if (status.hasTrainingResults && mappedStatus === 'completed') {
        console.log("[TrainingContext] Latest experiment has results, fetching them");
        getExperimentResults();
      }
      
      // If still running, start polling
      if (['running', 'processing'].includes(mappedStatus)) {
        console.log("[TrainingContext] Latest experiment still in progress, starting polling");
        const trainingType = latestExperiment.automl_engine ? 'automl' : 'custom';
        
        // Stop any existing polling before starting new
        stopPolling();
        
        // Start new polling
        startPolling(experimentId, trainingType);
        
        // Show toast to inform user
        toast({
          title: "Experiment in progress",
          description: "We found an experiment in progress and resumed monitoring it for you.",
        });
      }
    } catch (error) {
      console.error("[TrainingContext] Error checking for most recent experiment:", error);
      setState(prev => ({ ...prev, isCheckingLastExperiment: false }));
    }
  };

  useEffect(() => {
    try {
      if (state.activeExperimentId) {
        localStorage.setItem(EXPERIMENT_STORAGE_KEY, state.activeExperimentId);
        if (state.lastTrainingType) {
          localStorage.setItem(EXPERIMENT_TYPE_STORAGE_KEY, state.lastTrainingType);
        }
        if (state.experimentName) {
          localStorage.setItem(EXPERIMENT_NAME_STORAGE_KEY, state.experimentName);
        }
      } else {
        localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
        localStorage.removeItem(EXPERIMENT_TYPE_STORAGE_KEY);
        localStorage.removeItem(EXPERIMENT_NAME_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error saving experiment data to localStorage:", error);
    }
  }, [state.activeExperimentId, state.lastTrainingType, state.experimentName]);

  // Effect to fetch results when status indicates they're ready
  useEffect(() => {
    if (state.statusResponse?.hasTrainingResults === true && 
        state.activeExperimentId && 
        !state.experimentResults && 
        !state.isLoadingResults) {
      console.log("[TrainingContext] Status indicates results are ready, fetching them now");
      getExperimentResults();
    }
  }, [state.statusResponse, state.activeExperimentId, state.experimentResults, state.isLoadingResults]);

  // IMPROVED: Separate success handler specifically for AutoML experiments
  const handleAutoMLPollingSuccess = useCallback(async (experimentId: string) => {
    console.log("[TrainingContext] ★★★ AUTOML EXPERIMENT COMPLETED ★★★");
    console.log("[TrainingContext] Current state before status update:", {
      experimentStatus: state.experimentStatus,
      isTraining: state.isTraining,
      isLoadingResults: state.isLoadingResults,
      hasResults: !!state.experimentResults,
      resultsLoaded: state.resultsLoaded,
      lastTrainingType: state.lastTrainingType,
      currentPollingInfo: currentPollingInfo
    });
    
    // Set current polling info to null to indicate polling has completed
    setCurrentPollingInfo({
      experimentId: null,
      type: null
    });
    
    // Flag this as an AutoML experiment
    setIsAutoMLExperiment(true);
    
    // Set flag to prevent resultsLoaded reset during subsequent API calls
    setRecentlyCompletedPolling(true);
    
    // Extended timeout for AutoML specifically
    setTimeout(() => {
      setRecentlyCompletedPolling(false);
    }, 20000); // Even longer timeout for AutoML to ensure all loading completes
    
    // CRITICAL: Explicitly set all relevant states for AutoML
    setState(prev => ({
      ...prev,
      statusResponse: {
        status: 'completed',
        hasTrainingResults: true
      },
      experimentStatus: 'completed',
      isTraining: false,
      isLoadingResults: false,
      resultsLoaded: true, // CRITICAL: Set this to true for AutoML
      lastTrainingType: 'automl' // Ensure this is set for AutoML
    }));
    
    // Show toast notification
    toast({
      title: "AutoML Training Complete",
      description: "Your AutoML model has finished training successfully!"
    });
    
    try {
      console.log("[TrainingContext] Fetching results after successful AutoML training");
      // Set a slight delay to ensure the backend has processed everything
      setTimeout(async () => {
        await getExperimentResults();
        
        // Verify resultsLoaded is true after getting results
        if (!state.resultsLoaded) {
          console.log("[TrainingContext] Forcing resultsLoaded to TRUE for AutoML experiment");
          setState(prev => ({
            ...prev,
            resultsLoaded: true
          }));
        }
      }, 1000);
    } catch (error) {
      console.error("[TrainingContext] Error fetching AutoML results:", error);
    }
  }, [toast, state.experimentStatus, state.isTraining, state.isLoadingResults, state.experimentResults, state.resultsLoaded, state.lastTrainingType, currentPollingInfo]);

  const handlePollingSuccess = React.useCallback(async (experimentId: string) => {
    console.log("[TrainingContext] Polling success handler called for experiment:", experimentId);
    console.log("[TrainingContext] Current polling info:", currentPollingInfo);
    
    // Safety check: If the completed experiment doesn't match our currently tracked one,
    // log a warning but continue with the success flow
    if (currentPollingInfo.experimentId && currentPollingInfo.experimentId !== experimentId) {
      console.warn("[TrainingContext] Success handler called for experiment ID that doesn't match current polling:", 
        {current: currentPollingInfo.experimentId, completed: experimentId});
    }
    
    // Reset current polling info
    setCurrentPollingInfo({
      experimentId: null,
      type: null
    });
    
    // Check if this is an AutoML experiment
    if (state.lastTrainingType === 'automl' || isAutoMLExperiment) {
      console.log("[TrainingContext] Detected AutoML experiment, using specialized handler");
      return handleAutoMLPollingSuccess(experimentId);
    }
    
    console.log("[TrainingContext] Polling completed successfully for experiment:", experimentId);
    
    // Enhanced debugging for status transition
    console.log("[TrainingContext] ★★★ EXPERIMENT COMPLETED ★★★");
    console.log("[TrainingContext] Current state before status update:", {
      experimentStatus: state.experimentStatus,
      isTraining: state.isTraining,
      isLoadingResults: state.isLoadingResults,
      hasResults: !!state.experimentResults,
      resultsLoaded: state.resultsLoaded,
    });
    
    // Set flag to prevent resultsLoaded reset during subsequent API calls
    setRecentlyCompletedPolling(true);
    
    // Clear the flag after a delay
    setTimeout(() => {
      setRecentlyCompletedPolling(false);
    }, 15000); // Extended timeout to ensure all loading completes
    
    setState(prev => ({
      ...prev,
      statusResponse: {
        status: 'completed',
        hasTrainingResults: true
      },
      experimentStatus: 'completed',
      isTraining: false, // Make sure to set isTraining to false when completed
      isLoadingResults: false, // Ensure isLoadingResults is also set to false
      resultsLoaded: true, // Explicitly set resultsLoaded to true when polling completes successfully
    }));
    
    toast({
      title: "Training Complete",
      description: "Your model has finished training successfully!"
    });
    
    // Automatically fetch results when training completes
    try {
      console.log("[TrainingContext] Fetching results after successful training");
      await getExperimentResults();
    } catch (error) {
      console.error("[TrainingContext] Error fetching results after successful training:", error);
    }
  }, [toast, state.experimentStatus, state.isTraining, state.isLoadingResults, state.experimentResults, state.resultsLoaded, state.lastTrainingType, isAutoMLExperiment, handleAutoMLPollingSuccess, currentPollingInfo]);

  const handlePollingError = useCallback((error: string) => {
    console.log("[TrainingContext] Polling error:", error);
    
    // Reset current polling info
    setCurrentPollingInfo({
      experimentId: null,
      type: null
    });
    
    setState(prev => ({
      ...prev,
      error,
      isLoadingResults: false,
      isTraining: false,
      resultsLoaded: false, // Make sure to set resultsLoaded to false on error
      statusResponse: {
        status: 'failed',
        hasTrainingResults: false,
        error_message: error
      },
      experimentStatus: 'failed'
    }));
    
    toast({
      title: "Training Error",
      description: error,
      variant: "destructive"
    });
  }, [toast]);

  // ✅ UPDATED: Get startPolling from the hook but don't expose it directly
  const { 
    startPolling: startPollingHook, 
    stopPolling: stopPollingHook, 
    isPolling, 
    activeExperimentId: pollingExperimentId 
  } = useExperimentPolling({
    onSuccess: handlePollingSuccess,
    onError: handlePollingError,
    setExperimentStatus: (status) => setState(prev => ({ ...prev, experimentStatus: status })),
    setIsLoading: (loading) => setState(prev => ({ ...prev, isLoadingResults: loading })),
    setIsTraining: (isTraining) => setState(prev => ({ ...prev, isTraining })) // Pass setIsTraining to the hook
  });

  // ✅ FIX: Define the stopPolling function properly using stopPollingHook
  const stopPolling = useCallback(() => {
    console.log("[TrainingContext] Stopping all polling operations");
    
    // Stop the polling in the hook
    stopPollingHook();
    
    // Reset polling-related state
    setCurrentPollingInfo({
      experimentId: null,
      type: null
    });
    
    // Update training context state
    setState(prev => ({
      ...prev,
      isTraining: false,
      // Only update experimentStatus if it's currently in a "polling" state
      experimentStatus: ['processing', 'running'].includes(prev.experimentStatus) ? 
        'idle' : prev.experimentStatus
    }));
  }, [stopPollingHook]);

  // ✅ UPDATED: Create wrapped startPolling function that accepts two arguments
  const startPolling = useCallback((experimentId: string, type: 'automl' | 'custom' = 'automl') => {
    // Default to the current lastTrainingType if type is not provided
    const trainingType = type || state.lastTrainingType || 'automl';
    
    console.log(`[TrainingContext] Starting polling for ${trainingType} experiment:`, experimentId);
    
    // First ensure we stop any existing polling
    stopPolling();
    
    // Update current polling info
    setCurrentPollingInfo({
      experimentId,
      type: trainingType
    });
    
    // Update the auto-detection flag for AutoML experiments
    if (trainingType === 'automl') {
      setIsAutoMLExperiment(true);
      
      // Update the lastTrainingType if not already set
      if (state.lastTrainingType !== 'automl') {
        setState(prev => ({
          ...prev,
          lastTrainingType: 'automl'
        }));
      }
    } else {
      setIsAutoMLExperiment(false);
    }
    
    // Start the actual polling, passing both experimentId and trainingType
    startPollingHook(experimentId, trainingType);
  }, [startPollingHook, stopPolling, state.lastTrainingType]);

  // Log polling state changes
  useEffect(() => {
    console.log("[TrainingContext] Polling state changed:", { 
      isPolling, 
      pollingExperimentId, 
      currentPollingInfo,
      activeExperimentId: state.activeExperimentId
    });
  }, [isPolling, pollingExperimentId, currentPollingInfo, state.activeExperimentId]);

  const getExperimentResults = React.useCallback(async () => {
    if (!state.activeExperimentId) return;
    
    // Don't refetch if we already have results and aren't explicitly loading
    if (state.experimentResults && !state.isLoadingResults) {
      console.log("[TrainingContext] Already have results, not fetching again");
      return;
    }
    
    // Get the current experiment type (automl or custom)
    const currentPollingType = currentPollingInfo.type;
    const currentExperimentType = state.lastTrainingType || 
                                currentPollingType || 
                                (isAutoMLExperiment ? 'automl' : 'custom');
    
    console.log(`[TrainingContext] Fetching results for ${currentExperimentType} experiment:`, state.activeExperimentId, 
      "recentlyCompletedPolling:", recentlyCompletedPolling);

    // IMPROVED: Only set isLoadingResults to true, but don't reset resultsLoaded
    // if we recently completed polling or already have resultsLoaded=true
    setState(prev => ({ 
      ...prev, 
      isLoadingResults: true,
      // NEVER reset resultsLoaded to false if:
      // 1. We recently completed polling
      // 2. We already have resultsLoaded=true 
      // 3. This is an AutoML experiment that just completed
      resultsLoaded: recentlyCompletedPolling || 
                    prev.resultsLoaded || 
                    (currentExperimentType === 'automl' && isAutoMLExperiment)
    }));

    try {
      // Use the correct endpoint for full experiment results
      const results = await trainingApi.getExperimentResults(state.activeExperimentId);

      if (results) {
        // Check if this is an AutoML experiment from the results
        const isAutoML = results.automl_engine || results.training_type === 'automl';
        
        console.log(`[TrainingContext] Successfully fetched ${isAutoML ? 'AutoML' : 'custom'} experiment results`, {
          status: results.status,
          algorithm: results.algorithm,
          automl_engine: results.automl_engine,
          hasMetrics: !!results.metrics,
          training_type: results.training_type || (isAutoML ? 'automl' : 'custom')
        });
        
        // Handle 'success' status from API by mapping it to 'completed'
        let resultStatus = results.status || 'completed';
        if (resultStatus === 'success') {
          resultStatus = 'completed';
          console.log("[TrainingContext] Mapped 'success' status to 'completed'");
        }
        
        // Prioritize existing experiment name if we have one
        const updatedExperimentName = state.experimentName || results.experiment_name;
        
        // Determine training type - be more aggressive about detecting AutoML
        const trainingType = results.training_type || 
                           (results.automl_engine ? 'automl' : 
                           (state.lastTrainingType || 'custom'));
        
        console.log("[TrainingContext] Experiment type detection:", {
          fromResults: results.training_type,
          fromAutomlEngine: results.automl_engine ? 'automl' : null,
          fromState: state.lastTrainingType,
          final: trainingType
        });
        
        // Update all related state values to ensure consistency - ALWAYS set resultsLoaded to true
        setState(prev => ({ 
          ...prev, 
          experimentResults: results, 
          isLoadingResults: false,
          error: null,
          experimentStatus: resultStatus as ExperimentStatus,
          isTraining: false, // Ensure isTraining is false when results are loaded
          // CRITICAL: For AutoML, ALWAYS force resultsLoaded to true
          resultsLoaded: trainingType === 'automl' ? true : (prev.resultsLoaded || true),
          experimentName: updatedExperimentName,
          lastTrainingType: trainingType as 'automl' | 'custom' | null,
          // Ensure statusResponse is updated to be consistent
          statusResponse: {
            status: resultStatus as ExperimentStatus,
            hasTrainingResults: true
          }
        }));
        
        // Set the AutoML detection flag
        setIsAutoMLExperiment(trainingType === 'automl');
        
        // Also update experiment name in local storage if we have one
        if (updatedExperimentName) {
          localStorage.setItem(EXPERIMENT_NAME_STORAGE_KEY, updatedExperimentName);
        }
        
        // For AutoML experiments, double-check that tab switching is triggered
        if (trainingType === 'automl' && resultStatus === 'completed') {
          console.log("[TrainingContext] AutoML experiment completed and results fetched - ensure resultsLoaded is true");
          // Double check after a short delay to ensure state has been updated
          setTimeout(() => {
            setState(prev => {
              // Only update if not already set
              if (!prev.resultsLoaded) {
                console.log("[TrainingContext] Forcing resultsLoaded to TRUE for completed AutoML experiment");
                return {
                  ...prev,
                  resultsLoaded: true
                };
              }
              return prev;
            });
          }, 1000);
        }
      } else {
        console.log("[TrainingContext] No results returned from API");
        setState(prev => ({ 
          ...prev, 
          isLoadingResults: false,
          resultsLoaded: false,
          experimentStatus: 'failed',
          statusResponse: {
            status: 'failed',
            hasTrainingResults: false,
            error_message: 'No results returned'
          }
        }));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch experiment results';
      console.error("[TrainingContext] Error fetching results:", errorMessage);
      
      // On error, set resultsLoaded to false
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoadingResults: false,
        resultsLoaded: false,
        experimentStatus: 'failed',
        isTraining: false,
        statusResponse: {
          status: 'failed',
          hasTrainingResults: false,
          error_message: errorMessage
        }
      }));
      
      toast({
        title: "Error Fetching Results",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [state.activeExperimentId, state.experimentResults, state.isLoadingResults, state.experimentName, state.lastTrainingType, recentlyCompletedPolling, toast, currentPollingInfo, isAutoMLExperiment]);

  const contextValue: TrainingContextValue = {
    ...state,
    setIsTraining: (isTraining) => setState(prev => ({ ...prev, isTraining })),
    setIsSubmitting: (isSubmitting) => setState(prev => ({ ...prev, isSubmitting })), // Add setter for isSubmitting
    setLastTrainingType: (type) => {
      setState(prev => ({ ...prev, lastTrainingType: type }));
      // Update the auto-detection flag for AutoML experiments
      if (type === 'automl') {
        setIsAutoMLExperiment(true);
      } else {
        setIsAutoMLExperiment(false);
      }
    },
    setAutomlParameters: (params) => setState(prev => ({ ...prev, automlParameters: { ...prev.automlParameters, ...params } })),
    setCustomParameters: (params) => setState(prev => ({ ...prev, customParameters: { ...prev.customParameters, ...params } })),
    setAutomlResult: (result) => setState(prev => ({ ...prev, automlResult: result })),
    setCustomResult: (result) => setState(prev => ({ ...prev, customResult: result })),
    setError: (error) => setState(prev => ({ ...prev, error })),
    setActiveExperimentId: (id) => setState(prev => ({ ...prev, activeExperimentId: id })),
    setExperimentResults: (results) => setState(prev => ({ ...prev, experimentResults: results })),
    setIsLoadingResults: (isLoading) => setState(prev => ({ ...prev, isLoadingResults: isLoading })),
    setExperimentStatus: (status) => setState(prev => ({ ...prev, experimentStatus: status })),
    setStatusResponse: (response) => setState(prev => ({ ...prev, statusResponse: response })),
    setAutomlEngine: (engine) => setState(prev => ({ ...prev, automlEngine: engine })),
    setTestSize: (size) => setState(prev => ({ ...prev, testSize: size })),
    setStratify: (stratify) => setState(prev => ({ ...prev, stratify })),
    setRandomSeed: (seed) => setState(prev => ({ ...prev, randomSeed: seed })),
    setActiveTab: (tab) => setState(prev => ({ ...prev, activeTab: tab })),
    setResultsLoaded: (loaded) => setState(prev => ({ ...prev, resultsLoaded: loaded })),
    setExperimentName: (name) => setState(prev => ({ ...prev, experimentName: name })),
    resetTrainingState: () => {
      // Enhanced reset to ensure all polling is stopped
      stopPolling();
      setCurrentPollingInfo({
        experimentId: null,
        type: null
      });
      setRecentlyCompletedPolling(false);
      setIsAutoMLExperiment(false);
      
      setState({
        isTraining: false,
        isSubmitting: false, // Reset isSubmitting in resetTrainingState
        lastTrainingType: null,
        automlParameters: defaultAutomlParameters,
        customParameters: defaultCustomParameters,
        automlResult: null,
        customResult: null,
        error: null,
        activeExperimentId: null,
        experimentResults: null,
        isLoadingResults: false,
        experimentStatus: 'idle',
        statusResponse: null,
        automlEngine: defaultAutomlParameters.automlEngine,
        testSize: defaultAutomlParameters.testSize,
        stratify: defaultAutomlParameters.stratify,
        randomSeed: defaultAutomlParameters.randomSeed,
        activeTab: 'automl',
        isCheckingLastExperiment: false,
        resultsLoaded: false,
        experimentName: null,
      });
      localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
      localStorage.removeItem(EXPERIMENT_TYPE_STORAGE_KEY);
      localStorage.removeItem(EXPERIMENT_NAME_STORAGE_KEY);
    },
    clearExperimentResults: () => {
      // Enhanced clear to ensure all polling is stopped
      stopPolling();
      setCurrentPollingInfo({
        experimentId: null,
        type: null
      });
      setRecentlyCompletedPolling(false);
      setIsAutoMLExperiment(false);
      
      setState(prev => ({
        ...prev,
        experimentResults: null,
        activeExperimentId: null,
        statusResponse: null,
        resultsLoaded: false,
        experimentName: null
      }));
      localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
      localStorage.removeItem(EXPERIMENT_TYPE_STORAGE_KEY);
      localStorage.removeItem(EXPERIMENT_NAME_STORAGE_KEY);
    },
    getExperimentResults,
    startPolling, // ✅ Now using our wrapped function that accepts 2 parameters
    stopPolling,
    checkLastExperiment,
  };

  return (
    <TrainingContext.Provider value={contextValue}>
      {children}
    </TrainingContext.Provider>
  );
};

export const useTraining = (): TrainingContextValue => {
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
};
