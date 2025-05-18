
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

export interface ClassImbalanceData {
  needs_balancing: boolean;
  is_imbalanced: boolean;
  class_distribution: Record<string, number>;
  target_column: string;
  status_msg?: string;
  recommendation?: string;
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
  processingButtonClicked: boolean; // Flag to track button click
  classImbalanceData: ClassImbalanceData | null;
  
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
  setProcessingButtonClicked: (clicked: boolean) => void; // Setter for the flag
  setClassImbalanceData: (data: ClassImbalanceData | null) => void;
  
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
  processingButtonClicked: boolean; // Flag to track button click
  classImbalanceData: ClassImbalanceData | null;
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
  processingButtonClicked: false, // Initialize the flag to false
  classImbalanceData: null,
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

  // Enhanced logic for processingStage management
  useEffect(() => {
    const { datasetId, targetColumn, columnsToKeep, processingStage, overview } = state;
    
    // Only explicitly update if certain logical conditions are met
    // Avoid unnecessary updates that might trigger unwanted redirects
    
    if (datasetId && processingStage === null) {
      console.log('Setting initial processing stage to raw');
      setState(prev => ({ ...prev, processingStage: 'raw' }));
    }

    // Auto-advance to cleaned stage for datasets with no missing values
    const hasMissingValues = overview?.total_missing_values && overview.total_missing_values > 0;
    if (datasetId && processingStage === 'raw' && overview && !hasMissingValues) {
      console.log('Auto-advancing processingStage to cleaned for dataset with no missing values');
      // We don't actually set the stage here - we let the MissingValueHandler component handle it
      // This prevents race conditions with API calls
    }
    
    // Only update to final stage if we have the required data and explicitly set columnsToKeep
    // This prevents overriding the stage when it's already set to 'final' or another value
    if (datasetId && targetColumn && columnsToKeep && processingStage === 'cleaned') {
      console.log('Advancing processing stage to final');
      setState(prev => ({ ...prev, processingStage: 'final' }));
    }
  }, [state.datasetId, state.targetColumn, state.columnsToKeep, state.processingStage, state.overview]);
  
  // Individual setters - these will only update one property at a time
  const setDatasetId = (datasetId: string | null) => setState(prev => ({ 
    ...prev, 
    datasetId, 
    processingButtonClicked: false
  }));
  
  const setFileUrl = (fileUrl: string | null) => setState(prev => ({ ...prev, fileUrl }));
  
  // Ensure overview is properly merged to preserve all fields including missing values information
  const setOverview = (overview: DatasetOverview | null) => {
    setState(prev => {
      if (overview) {
        console.log('Setting overview in context:', overview);
        // Ensure we're properly preserving all fields, especially total_missing_values
        return { 
          ...prev, 
          overview: {
            ...overview,
            total_missing_values: overview.total_missing_values || 0,
            missing_values_count: overview.missing_values_count || {}
          }
        };
      }
      return { ...prev, overview };
    });
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
  
  // Enhanced setter for processingButtonClicked that also persists to localStorage
  const setProcessingButtonClicked = (processingButtonClicked: boolean) => {
    console.log('Setting processingButtonClicked to:', processingButtonClicked);
    setState(prev => ({ ...prev, processingButtonClicked }));
    // No need to explicitly update localStorage here as the effect above will handle it
  };
  
  const setClassImbalanceData = (classImbalanceData: ClassImbalanceData | null) => 
    setState(prev => ({ ...prev, classImbalanceData }));
  
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
    setState(prev => {
      // Special handling for overview to ensure all fields are preserved
      const updatedState = { ...prev, ...newState };
      
      // If we're updating the overview, make sure we keep all fields
      if (newState.overview && prev.overview) {
        updatedState.overview = {
          ...prev.overview,
          ...newState.overview,
          // Ensure missing values information is preserved
          total_missing_values: newState.overview.total_missing_values ?? prev.overview.total_missing_values,
          missing_values_count: newState.overview.missing_values_count ?? prev.overview.missing_values_count
        };
      }
      
      return updatedState;
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
    setProcessingButtonClicked,
    setClassImbalanceData,
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
