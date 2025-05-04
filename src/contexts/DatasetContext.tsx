
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Types
export interface DatasetOverview {
  num_rows: number;
  num_columns: number;
  missing_values: Record<string, any>;
  numerical_features: string[];
  categorical_features: string[];
  // Properties from backend response
  total_missing_values?: number;
  missing_values_count?: Record<string, number>;
  column_names?: string[];
  unique_values_count?: Record<string, number>;
  data_types?: Record<string, string>;
  feature_classification?: Record<string, string>;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface DatasetContextProps {
  datasetId: string | null;
  fileUrl: string | null;
  overview: DatasetOverview | null;
  previewData: Record<string, any>[] | null;
  previewColumns: string[] | null;
  targetColumn: string | null;
  columnsToKeep: string[] | null;
  taskType: string | null;
  featureImportance: FeatureImportance[] | null;
  numClasses: number | null;
  processedFileUrl: string | null;
  isLoading: boolean;
  error: string | null;
  processingStage: string | null; // Track the current processing stage
  
  setDatasetId: (id: string | null) => void;
  setFileUrl: (url: string | null) => void;
  setOverview: (overview: DatasetOverview | null) => void;
  setPreviewData: (data: Record<string, any>[] | null) => void;
  setPreviewColumns: (columns: string[] | null) => void;
  setTargetColumn: (column: string | null) => void;
  setColumnsToKeep: (columns: string[] | null) => void;
  setTaskType: (type: string | null) => void;
  setFeatureImportance: (importance: FeatureImportance[] | null) => void;
  setNumClasses: (numClasses: number | null) => void;
  setProcessedFileUrl: (url: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProcessingStage: (stage: string | null) => void;
  
  resetState: () => void;
  updateState: (newState: Partial<DatasetContextState>) => void;
}

interface DatasetContextState {
  datasetId: string | null;
  fileUrl: string | null;
  overview: DatasetOverview | null;
  previewData: Record<string, any>[] | null;
  previewColumns: string[] | null;
  targetColumn: string | null;
  columnsToKeep: string[] | null;
  taskType: string | null;
  featureImportance: FeatureImportance[] | null;
  numClasses: number | null;
  processedFileUrl: string | null;
  isLoading: boolean;
  error: string | null;
  processingStage: string | null; // Track the current processing stage
}

const DatasetContext = createContext<DatasetContextProps | undefined>(undefined);

const initialState: DatasetContextState = {
  datasetId: null,
  fileUrl: null,
  overview: null,
  previewData: null,
  previewColumns: null,
  targetColumn: null,
  columnsToKeep: null,
  taskType: null,
  featureImportance: null,
  numClasses: null,
  processedFileUrl: null,
  isLoading: false,
  error: null,
  processingStage: null, // Start with null to avoid immediate redirects
};

export const DatasetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DatasetContextState>(() => {
    try {
      const savedState = localStorage.getItem('datasetState');
      return savedState ? JSON.parse(savedState) : initialState;
    } catch (error) {
      console.error('Failed to load state from localStorage:', error);
      return initialState;
    }
  });
  
  // Debug state changes
  useEffect(() => {
    if (state.overview) {
      console.log('DatasetContext - State updated, overview:', state.overview);
      console.log('DatasetContext - Missing values:', state.overview.total_missing_values);
    }
  }, [state.overview]);
  
  // Save state to localStorage with debounce to prevent rapid updates
  useEffect(() => {
    try {
      // Delay saving to localStorage to prevent race conditions
      const saveTimeout = setTimeout(() => {
        console.log('Saving state to localStorage:', state.processingStage);
        localStorage.setItem('datasetState', JSON.stringify(state));
      }, 500); // Increased from 300ms to 500ms for more stability
      
      return () => clearTimeout(saveTimeout);
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  }, [state]);

  // Ensure consistent processingStage based on data availability
  useEffect(() => {
    const { datasetId, targetColumn, columnsToKeep, processingStage } = state;
    
    // Only explicitly update if certain logical conditions are met
    // Avoid unnecessary updates that might trigger unwanted redirects
    
    if (datasetId && processingStage === null) {
      console.log('Setting initial processing stage to raw');
      setState(prev => ({ ...prev, processingStage: 'raw' }));
    }
    
    // Only update to final stage if we have the required data and explicitly set columnsToKeep
    // This prevents overriding the stage when it's already set to 'final' or another value
    if (datasetId && targetColumn && columnsToKeep && processingStage === 'cleaned') {
      console.log('Advancing processing stage to final');
      setState(prev => ({ ...prev, processingStage: 'final' }));
    }
    
    // IMPORTANT: We're NOT automatically setting processingStage to 'cleaned' here anymore
    // The 'cleaned' stage will only be set when the user explicitly clicks "Process Missing Values"
  }, [state.datasetId, state.targetColumn, state.columnsToKeep, state.processingStage]);
  
  // Individual setters - these will only update one property at a time
  const setDatasetId = (datasetId: string | null) => setState(prev => ({ ...prev, datasetId }));
  const setFileUrl = (fileUrl: string | null) => setState(prev => ({ ...prev, fileUrl }));
  const setOverview = (overview: DatasetOverview | null) => {
    console.log('Setting overview directly:', overview);
    setState(prev => ({ ...prev, overview }));
  };
  const setPreviewData = (previewData: Record<string, any>[] | null) => setState(prev => ({ ...prev, previewData }));
  const setPreviewColumns = (previewColumns: string[] | null) => setState(prev => ({ ...prev, previewColumns }));
  const setTargetColumn = (targetColumn: string | null) => setState(prev => ({ ...prev, targetColumn }));
  const setColumnsToKeep = (columnsToKeep: string[] | null) => setState(prev => ({ ...prev, columnsToKeep }));
  const setTaskType = (taskType: string | null) => setState(prev => ({ ...prev, taskType }));
  const setFeatureImportance = (featureImportance: FeatureImportance[] | null) => 
    setState(prev => ({ ...prev, featureImportance }));
  const setNumClasses = (numClasses: number | null) => setState(prev => ({ ...prev, numClasses }));
  const setProcessedFileUrl = (processedFileUrl: string | null) => 
    setState(prev => ({ ...prev, processedFileUrl }));
  const setIsLoading = (isLoading: boolean) => setState(prev => ({ ...prev, isLoading }));
  const setError = (error: string | null) => setState(prev => ({ ...prev, error }));
  const setProcessingStage = (processingStage: string | null) => setState(prev => ({ ...prev, processingStage }));
  
  const resetState = () => {
    console.log('Resetting dataset state to initial state');
    setState(initialState);
    try {
      localStorage.removeItem('datasetState');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  };
  
  // This is a more atomic update function that can update multiple state properties at once
  // Use this when you need to update multiple related properties to avoid multiple re-renders
  const updateState = (newState: Partial<DatasetContextState>) => {
    console.log('Updating dataset state with:', newState);
    
    // Special handling for overview updates to ensure we don't lose missing values
    setState(prev => {
      // If we're updating the overview, ensure we properly merge any missing fields
      if (newState.overview && prev.overview) {
        console.log('Merging overview with existing overview');
        
        // Ensure we preserve important missing value fields
        const mergedOverview = {
          ...prev.overview,
          ...newState.overview,
          // Explicitly handle missing values fields to ensure they're not lost
          total_missing_values: newState.overview.total_missing_values !== undefined 
            ? newState.overview.total_missing_values
            : prev.overview.total_missing_values,
          missing_values_count: newState.overview.missing_values_count || prev.overview.missing_values_count
        };
        
        console.log('Merged overview:', mergedOverview);
        
        return {
          ...prev,
          ...newState,
          overview: mergedOverview
        };
      }
      
      // Make a single state update instead of multiple individual updates
      return { ...prev, ...newState };
    });
  };
  
  const contextValue: DatasetContextProps = {
    ...state,
    setDatasetId,
    setFileUrl,
    setOverview,
    setPreviewData,
    setPreviewColumns,
    setTargetColumn,
    setColumnsToKeep,
    setTaskType,
    setFeatureImportance,
    setNumClasses,
    setProcessedFileUrl,
    setIsLoading,
    setError,
    setProcessingStage,
    resetState,
    updateState,
  };
  
  return (
    <DatasetContext.Provider value={contextValue}>
      {children}
    </DatasetContext.Provider>
  );
};

export const useDataset = (): DatasetContextProps => {
  const context = useContext(DatasetContext);
  if (context === undefined) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
};
