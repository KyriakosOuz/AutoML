
import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  
  React.useEffect(() => {
    try {
      localStorage.setItem('datasetState', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  }, [state]);
  
  const setDatasetId = (datasetId: string | null) => setState(prev => ({ ...prev, datasetId }));
  const setFileUrl = (fileUrl: string | null) => setState(prev => ({ ...prev, fileUrl }));
  const setOverview = (overview: DatasetOverview | null) => setState(prev => ({ ...prev, overview }));
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
  
  const resetState = () => setState(initialState);
  
  const updateState = (newState: Partial<DatasetContextState>) => {
    setState(prev => ({ ...prev, ...newState }));
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
