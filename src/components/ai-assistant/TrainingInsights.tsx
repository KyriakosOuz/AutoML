
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
    experimentId,
    selectedAlgorithm,
    taskType,
    status,
    hyperParameters,
    metrics
  } = useTraining();
  
  // Skip if no training is in progress
  if (!experimentId && !selectedAlgorithm) {
    return null;
  }
  
  // Create context data from training information
  const contextData = `
    Experiment ID: ${experimentId || 'Not started'}
    Algorithm: ${selectedAlgorithm || 'Not selected'}
    Task Type: ${taskType || 'Unknown'}
    Status: ${status || 'Not started'}
    ${hyperParameters ? `Hyperparameters: ${JSON.stringify(hyperParameters)}` : ''}
    ${metrics ? `Metrics: ${JSON.stringify(metrics)}` : ''}
  `;
  
  // Determine the appropriate prompt based on training state
  const getInitialPrompt = () => {
    if (!selectedAlgorithm) {
      return "Based on this dataset, which algorithm would you recommend for this task type?";
    }
    
    if (status === 'processing' || status === 'running') {
      return "What should I expect from this training run? What metrics should I focus on?";
    }
    
    if (status === 'completed' || status === 'success') {
      return "Analyze these model metrics. How good is this model and what do these results mean?";
    }
    
    if (status === 'failed') {
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
