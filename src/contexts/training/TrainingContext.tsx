import React, { createContext, useState, useContext, useCallback } from 'react';
import { trainingApi } from '@/lib/api';
import { ExperimentResults } from '@/types/training';
import { ExperimentStatus } from './types';

interface TrainingContextType {
  lastExperimentId: string | null;
  experimentResults: ExperimentResults | null;
  isLoadingLastExperiment: boolean;
  isLoadingResults: boolean;
  setExperimentResults: (results: ExperimentResults | null) => void;
  checkLastExperiment: () => Promise<void>;
  resetExperiment: () => void;
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

interface TrainingProviderProps {
  children: React.ReactNode;
}

const initialState = {
  lastExperimentId: null,
  experimentResults: null,
  isLoadingLastExperiment: false,
  isLoadingResults: false,
};

export const TrainingProvider: React.FC<TrainingProviderProps> = ({ children }) => {
  const [lastExperimentId, setLastExperimentId] = useState<string | null>(initialState.lastExperimentId);
  const [experimentResults, setExperimentResults] = useState<ExperimentResults | null>(initialState.experimentResults);
  const [isLoadingLastExperiment, setIsLoadingLastExperiment] = useState<boolean>(initialState.isLoadingLastExperiment);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(initialState.isLoadingResults);

  const checkLastExperiment = useCallback(async () => {
    // Add a check to prevent multiple calls if already loading
    if (isLoadingLastExperiment) return;
    
    try {
      setIsLoadingLastExperiment(true);
      console.log("[TrainingContext] Checking for last experiment");
      const response = await trainingApi.getLastExperiment();
      console.log("[TrainingContext] Last experiment response:", response);
      
      if (response && response.data && response.data.experimentId) {
        setLastExperimentId(response.data.experimentId);
        // Only set experiment results if we have them and they're not already set
        if (response.data.hasTrainingResults && (!experimentResults || experimentResults.experiment_id !== response.data.experimentId)) {
          setExperimentResults(response.data);
        }
      }
    } catch (error) {
      console.error("[TrainingContext] Error checking for last experiment:", error);
      // Don't set last experiment ID if there's an error
    } finally {
      setIsLoadingLastExperiment(false);
    }
  }, [isLoadingLastExperiment, experimentResults]);

  const resetExperiment = () => {
    setLastExperimentId(null);
    setExperimentResults(null);
  };

  const value: TrainingContextType = {
    lastExperimentId,
    experimentResults,
    isLoadingLastExperiment,
    isLoadingResults,
    setExperimentResults,
    checkLastExperiment,
    resetExperiment,
  };

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
};

export const useTraining = (): TrainingContextType => {
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error("useTraining must be used within a TrainingProvider");
  }
  return context;
};
