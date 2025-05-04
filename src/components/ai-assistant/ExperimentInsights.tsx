
import React from 'react';
import AIInsightCard from './AIInsightCard';
import { useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { trainingApi } from '@/lib/api';

const ExperimentInsights: React.FC = () => {
  const location = useLocation();
  const { experimentId } = useParams<{ experimentId: string }>();
  
  // Only show insights on experiment detail pages
  if (!location.pathname.includes('/experiment/')) {
    return null;
  }
  
  // Fetch experiment data
  const { data: results, isLoading, error } = useQuery({
    queryKey: ['experimentResults', experimentId],
    queryFn: () => experimentId ? trainingApi.getExperimentResults(experimentId) : Promise.resolve(null),
    enabled: !!experimentId,
  });
  
  // Skip if no experiment data is available
  if (isLoading || error || !results) {
    return null;
  }
  
  // Create context data from experiment information
  const contextData = `
    Experiment ID: ${experimentId}
    Status: ${results.status || 'Unknown'}
    Algorithm: ${results.algorithm || 'Unknown'}
    Task Type: ${results.task_type || 'Unknown'}
    Target Column: ${results.target_column || 'Unknown'}
    Metrics: ${results.training_results?.metrics ? JSON.stringify(results.training_results.metrics) : 'No metrics available'}
  `;
  
  // Determine the appropriate prompt based on experiment results
  const getInitialPrompt = () => {
    if (results.status === 'failed') {
      return "This experiment failed. What might have caused this and how can I fix it?";
    }
    
    if (results.status === 'completed' || results.status === 'success') {
      const metrics = results.training_results?.metrics || {};
      const hasGoodPerformance = Object.values(metrics).some(
        value => typeof value === 'number' && value >= 0.8
      );
      
      if (hasGoodPerformance) {
        return "This model seems to perform well. What do these metrics mean and how can I interpret them?";
      } else {
        return "These metrics don't look ideal. How might I improve this model's performance?";
      }
    }
    
    return "Help me interpret these experiment results. What do they mean?";
  };
  
  return (
    <AIInsightCard
      title="Experiment Results Analysis"
      initialPrompt={getInitialPrompt()}
      contextData={contextData}
      sessionId="experiment_stage"
      collapsed={false}
    />
  );
};

export default ExperimentInsights;
