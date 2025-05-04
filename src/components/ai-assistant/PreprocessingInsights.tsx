
import React, { useState, useEffect } from 'react';
import AIInsightCard from './AIInsightCard';
import { useDataset } from '@/contexts/DatasetContext';

const PreprocessingInsights: React.FC = () => {
  const { 
    datasetId, 
    taskType, 
    overview,
    columnsToKeep,
    targetColumn,
    processingStage,
    featureImportance,
    previewColumns,
  } = useDataset();
  
  // Don't render if dataset is not in the right stage
  if (!datasetId || !targetColumn || !columnsToKeep || processingStage !== 'final') {
    return null;
  }

  // Base context data about the dataset for preprocessing insights
  const baseContextData = `
    Dataset ID: ${datasetId}
    Target Column: ${targetColumn}
    Task Type: ${taskType}
    Processing Stage: ${processingStage}
    Selected Features: ${columnsToKeep?.join(', ')}
    
    ${overview ? `
    Rows: ${overview.num_rows}
    Columns: ${overview.num_columns}
    Missing Values: ${overview.total_missing_values || 0}
    ` : ''}
    
    ${featureImportance ? `
    Feature Importance: ${JSON.stringify(featureImportance.slice(0, 5))}
    ` : ''}
  `;

  // Determine numerical and categorical columns from the overview
  const numericalColumns = overview?.numerical_features || [];
  const categoricalColumns = overview?.categorical_features || [];
  
  // Count of numerical and categorical columns among selected features
  const selectedNumericalColumns = columnsToKeep?.filter(col => 
    numericalColumns.includes(col)
  ) || [];
  
  const selectedCategoricalColumns = columnsToKeep?.filter(col => 
    categoricalColumns.includes(col)
  ) || [];

  // Additional preprocessing context based on column types
  const preprocessingContext = `
    Selected Numerical Features: ${selectedNumericalColumns.join(', ')}
    Count of Numerical Features: ${selectedNumericalColumns.length}
    Selected Categorical Features: ${selectedCategoricalColumns.join(', ')}
    Count of Categorical Features: ${selectedCategoricalColumns.length}
    
    ${taskType?.includes('classification') ? 
      'Classification Task: Class balancing might be beneficial' : 
      'Regression Task: Class balancing not applicable'}
  `;

  // Generate normalization recommendations
  const normalizationRecommendation = selectedNumericalColumns.length > 0 
    ? selectedNumericalColumns.length > 5 
      ? "Dataset has many numerical features. Normalization is strongly recommended to prevent features with larger scales from dominating the model training."
      : "Dataset has some numerical features. Consider applying normalization to ensure all features contribute equally."
    : "Dataset has no numerical features among selected columns. Normalization is not needed.";

  // Generate class balancing recommendations
  const classBalancingRecommendation = taskType?.includes('classification')
    ? "This is a classification task. Consider checking class distribution and applying balancing techniques if imbalanced."
    : "This is a regression task. Class balancing is not applicable.";

  // Complete context for the AI
  const contextData = `${baseContextData}\n${preprocessingContext}\n
    Normalization Recommendation: ${normalizationRecommendation}\n
    Class Balancing Recommendation: ${classBalancingRecommendation}
  `;

  // Initial prompt based on dataset characteristics
  const getInitialPrompt = () => {
    if (selectedNumericalColumns.length > 0 && taskType?.includes('classification')) {
      return "Based on this dataset's characteristics, what normalization method and class balancing strategy would you recommend?";
    } else if (selectedNumericalColumns.length > 0) {
      return "This dataset has numerical features. Which normalization method would be most appropriate and why?";
    } else if (taskType?.includes('classification')) {
      return "This is a classification task with no numerical features. How should I approach class balancing?";
    } else {
      return "What preprocessing steps should I consider for this dataset?";
    }
  };

  // Suggested follow-up prompts
  const suggestedPrompts = [
    "What's the difference between MinMax and Standard scaling?",
    "When should I use Robust scaling instead of Standard scaling?",
    "What is SMOTE and when is it better than undersampling?",
    "How does normalization affect model performance?",
    "What happens if I don't balance my classes?"
  ];

  return (
    <AIInsightCard
      title="Preprocessing Insights"
      initialPrompt={getInitialPrompt()}
      contextData={contextData}
      sessionId="preprocess_stage"
      collapsed={false}
      suggestedPrompts={suggestedPrompts}
    />
  );
};

export default PreprocessingInsights;
