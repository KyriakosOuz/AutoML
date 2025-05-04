
import React from 'react';
import AIInsightCard from './AIInsightCard';
import { useLocation } from 'react-router-dom';
import { useTraining } from '@/contexts/training/TrainingContext';

const TrainingInsights: React.FC = () => {
  const location = useLocation();
  
  // Only show insights on training pages
  if (!location.pathname.includes('/training')) {
    return null;
  }
  
  // Get the training context data
  const { 
    activeExperimentId,
    lastTrainingType,
    automlParameters,
    customParameters,
    experimentStatus,
    experimentResults
  } = useTraining();
  
  // Skip if no training is in progress
  if (!activeExperimentId && !lastTrainingType) {
    return null;
  }
  
  // Create context data from training information
  const contextData = `
    Experiment ID: ${activeExperimentId || 'Not started'}
    Algorithm: ${lastTrainingType === 'automl' ? automlParameters?.automlEngine : 
                 lastTrainingType === 'custom' ? customParameters?.algorithm : 'Not selected'}
    Status: ${experimentStatus || 'Not started'}
    ${experimentResults?.hyperparameters ? `Hyperparameters: ${JSON.stringify(experimentResults.hyperparameters)}` : ''}
    ${experimentResults?.metrics ? `Metrics: ${JSON.stringify(experimentResults.metrics)}` : ''}
  `;
  
  // Determine the appropriate prompt based on training state
  const getInitialPrompt = () => {
    if (!lastTrainingType) {
      return "Based on this dataset, which algorithm would you recommend for this task type?";
    }
    
    if (experimentStatus === 'processing' || experimentStatus === 'running') {
      return "What should I expect from this training run? What metrics should I focus on?";
    }
    
    if (experimentStatus === 'completed' || experimentStatus === 'success') {
      return "Analyze these model metrics. How good is this model and what do these results mean?";
    }
    
    if (experimentStatus === 'failed') {
      return "My model training failed. What might have caused this and how can I fix it?";
    }
    
    return "What should I know about this algorithm and training process?";
  };
  
  return (
    <AIInsightCard
      title="Training AI Insights"
      initialPrompt={getInitialPrompt()}
      contextData={contextData}
      sessionId="training_stage"
      collapsed={false}
    />
  );
};

export default TrainingInsights;
