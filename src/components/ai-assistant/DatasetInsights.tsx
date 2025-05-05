
import React from 'react';
import AIInsightCard from './AIInsightCard';
import { useLocation } from 'react-router-dom';
import { useDataset } from '@/contexts/DatasetContext';

const DatasetInsights: React.FC = () => {
  const location = useLocation();
  
  // Only show insights on dataset pages
  if (!location.pathname.includes('/dataset')) {
    return null;
  }
  
  // Get the dataset context data
  const { 
    datasetId, 
    overview, 
    targetColumn,
    processingStage,
    taskType,
    previewColumns,
    featureImportance
  } = useDataset();
  
  // Skip if no dataset is loaded
  if (!datasetId) {
    return null;
  }
  
  // Create context data from dataset information
  const contextData = `
    Dataset ID: ${datasetId}
    ${overview ? `Rows: ${overview.num_rows || 'unknown'}` : ''}
    ${overview ? `Columns: ${overview.num_columns || 'unknown'}` : ''}
    ${targetColumn ? `Target Column: ${targetColumn}` : 'No target column selected'}
    ${processingStage ? `Processing Stage: ${processingStage}` : ''}
    ${overview?.total_missing_values !== undefined ? `Missing Values: ${overview.total_missing_values}` : ''}
    ${overview?.missing_values_count ? `Missing Values by Column: ${JSON.stringify(overview.missing_values_count)}` : ''}
    ${taskType ? `Task Type: ${taskType}` : ''}
    ${previewColumns ? `Available Columns: ${previewColumns.join(', ')}` : ''}
    ${overview?.numerical_features ? `Numerical Features: ${overview.numerical_features.join(', ')}` : ''}
    ${overview?.categorical_features ? `Categorical Features: ${overview.categorical_features.join(', ')}` : ''}
    ${featureImportance ? `Feature Importance: ${JSON.stringify(featureImportance.slice(0, 5))}` : ''}
    ${overview?.data_types ? `Data Types: ${JSON.stringify(overview.data_types)}` : ''}
  `;
  
  // Determine the appropriate prompt based on dataset state and path
  const getInitialPrompt = () => {
    // Handle different dataset sub-pages
    if (location.pathname.includes('/dataset/upload')) {
      return "I've just uploaded this dataset. What should I look for in terms of quality and potential issues?";
    }
    
    if (location.pathname.includes('/dataset/explore')) {
      if (overview?.total_missing_values && overview.total_missing_values > 0) {
        return "This dataset has missing values. What's the best strategy to handle them for this data?";
      }
      return "Help me understand this dataset's structure and key statistics. What insights can you provide?";
    }
    
    if (location.pathname.includes('/dataset/features')) {
      const hasFeatureImportance = featureImportance && featureImportance.length > 0;
      if (hasFeatureImportance) {
        return "Based on the feature importance scores, which features should I select for my model and why?";
      }
      return "What features should I select for modeling and why? How should I handle feature selection?";
    }
    
    if (location.pathname.includes('/dataset/preprocess')) {
      return "What preprocessing techniques would be most appropriate for this dataset?";
    }
    
    // Handle different processing stages
    if (!targetColumn && !processingStage) {
      return "Analyze this dataset and suggest the first steps I should take. What preprocessing might be needed?";
    }
    
    if (processingStage === 'raw' || !processingStage) {
      if (overview?.total_missing_values && overview.total_missing_values > 0) {
        return "This dataset has missing values. What's the best strategy to handle them for this dataset?";
      }
      return "What preprocessing steps should I consider for this dataset before modeling?";
    }
    
    if (processingStage === 'cleaned') {
      if (!taskType) {
        return "Based on this dataset, what machine learning task type would be appropriate? Classification or regression?";
      }
      return "Which features should I consider most important for modeling and why?";
    }
    
    if (processingStage === 'final') {
      if (taskType === 'classification') {
        return "This dataset is ready for classification. Which algorithms would you recommend and why?";
      } else if (taskType === 'regression') {
        return "This dataset is ready for regression. Which algorithms would you recommend and why?";
      }
      return "Based on this dataset's features, what machine learning algorithms would work well for predicting the target column?";
    }
    
    return "Provide insights about this dataset and suggest next steps.";
  };
  
  return (
    <AIInsightCard
      title="Dataset AI Insights"
      initialPrompt={getInitialPrompt()}
      contextData={contextData}
      sessionId="dataset_stage"
      collapsed={false}
    />
  );
};

export default DatasetInsights;
