
import React from 'react';
import AIInsightCard from './AIInsightCard';
import { useLocation } from 'react-router-dom';

const DatasetInsights: React.FC = () => {
  const location = useLocation();
  
  // Only attempt to use dataset context on the dataset page
  if (!location.pathname.includes('/dataset')) {
    return null;
  }
  
  try {
    // Dynamically import and use the dataset context only when needed
    const { useDataset } = require('@/contexts/DatasetContext');
    const { 
      datasetId, 
      overview, 
      targetColumn,
      processingStage 
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
      ${overview?.total_missing_values ? `Missing Values: ${overview.total_missing_values}` : ''}
    `;
    
    // Determine the appropriate prompt based on dataset state
    const getInitialPrompt = () => {
      if (!targetColumn && !processingStage) {
        return "Analyze this dataset and suggest the first steps I should take. What preprocessing might be needed?";
      }
      
      if (processingStage === 'raw' || !processingStage) {
        return "This dataset may have missing values. What's the best strategy to handle them for this dataset?";
      }
      
      if (processingStage === 'cleaned') {
        return "Based on this dataset, which columns should I consider as features and why? What target column would make sense?";
      }
      
      if (processingStage === 'final') {
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
  } catch (error) {
    console.error('Error rendering DatasetInsights:', error);
    return null;
  }
};

export default DatasetInsights;
