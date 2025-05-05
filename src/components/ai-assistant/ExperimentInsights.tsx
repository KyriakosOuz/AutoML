
import React, { useState, useEffect } from 'react';
import AIInsightCard from './AIInsightCard';
import { useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { trainingApi } from '@/lib/api';

const ExperimentInsights: React.FC = () => {
  const location = useLocation();
  const { experimentId } = useParams<{ experimentId: string }>();
  const [activeSubTab, setActiveSubTab] = useState<string>('metrics');
  
  // Only show insights on experiment detail pages
  if (!location.pathname.includes('/experiment/')) {
    return null;
  }
  
  // Monitor for tab changes in the UI
  useEffect(() => {
    const tabObserver = new MutationObserver(() => {
      // Look for active tab buttons
      const activeTabElement = document.querySelector('[data-state="active"][role="tab"]');
      if (activeTabElement) {
        const tabValue = activeTabElement.getAttribute('data-value') || 'metrics';
        setActiveSubTab(tabValue);
      }
    });
    
    // Start observing the DOM for changes
    tabObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state']
    });
    
    return () => tabObserver.disconnect();
  }, []);
  
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
  
  // Base context data from experiment information
  const baseContextData = `
    Experiment ID: ${experimentId}
    Status: ${results.status || 'Unknown'}
    Algorithm: ${results.algorithm || results.algorithm_choice || results.selected_algorithm || 'Unknown'}
    Task Type: ${results.task_type || 'Unknown'}
    Target Column: ${results.target_column || 'Unknown'}
    Features Used: ${results.features ? results.features.join(', ') : 'Unknown'}
    Split Ratio: ${results.split_ratio || results.data_split_ratio || 'Unknown'}
  `;
  
  // Provide sub-tab specific context
  const getSubTabContext = () => {
    switch (activeSubTab) {
      case 'metrics':
        return `
          Sub-Tab: Metrics
          ${results.metrics ? `Performance Metrics: ${JSON.stringify(results.metrics)}` : 
                  results.training_results?.metrics ? JSON.stringify(results.training_results.metrics) : 
                  'No metrics available'}
          
          Common metrics to consider:
          - For classification: accuracy, precision, recall, F1-score, ROC AUC
          - For regression: R², MAE, MSE, RMSE
        `;
        
      case 'visualizations':
        return `
          Sub-Tab: Visualizations
          Available visualizations: ${results.files ? 
            results.files
              .filter(f => f.file_type.includes('plot') || f.file_type.includes('chart') || f.file_type.includes('matrix'))
              .map(f => f.file_type).join(', ') : 'None'}
          
          Common visualizations:
          - Confusion Matrix: Shows predicted vs actual class distribution
          - ROC Curve: Shows true positive vs false positive rate
          - PR Curve: Shows precision vs recall tradeoff
          - SHAP Values: Feature importance and impact
        `;
        
      case 'details':
        return `
          Sub-Tab: Details
          Hyperparameters: ${results.hyperparameters ? JSON.stringify(results.hyperparameters) : 
                          results.training_results?.hyperparameters ? JSON.stringify(results.training_results.hyperparameters) : 
                          'No hyperparameter information'}
          
          Training Time: ${results.training_time_sec ? `${results.training_time_sec} seconds` : 'Unknown'}
          Created: ${results.created_at ? new Date(results.created_at).toLocaleString() : 'Unknown'}
          Completed: ${results.completed_at ? new Date(results.completed_at).toLocaleString() : 'Unknown'}
        `;
        
      case 'downloads':
        return `
          Sub-Tab: Downloads
          Available files: ${results.files ? 
            results.files.map(f => f.file_type).join(', ') : 'None'}
          
          Common file types:
          - Model: Serialized model file for deployment
          - Report: Detailed analysis of model performance
          - Visualization: Charts and plots showing model behavior
        `;
        
      default:
        return '';
    }
  };
  
  // Combine base context with sub-tab specific context
  const contextData = `${baseContextData}\n${getSubTabContext()}`;
  
  // Determine the appropriate prompt based on sub-tab and results
  const getInitialPrompt = () => {
    if (results.status === 'failed') {
      return "This experiment failed. What might have caused this and how can I fix it?";
    }
    
    if (results.status === 'completed' || results.status === 'success') {
      switch (activeSubTab) {
        case 'metrics':
          const metrics = results.metrics || results.training_results?.metrics || {};
          const hasGoodPerformance = Object.entries(metrics).some(([key, value]) => {
            // Check for common accuracy metrics
            if ((key.includes('accuracy') || key.includes('r2') || key.includes('f1')) && 
                typeof value === 'number' && value >= 0.8) {
              return true;
            }
            return false;
          });
          
          return hasGoodPerformance ? 
            "These metrics look good. What exactly do they tell me about my model?" : 
            "These metrics don't look ideal. How might I improve this model's performance?";
          
        case 'visualizations':
          return "Help me interpret these visualizations. What insights can I draw from them?";
          
        case 'details':
          return "What do these hyperparameters mean and how did they affect model performance?";
          
        case 'downloads':
          return "What can I do with these downloadable files? How do I use them?";
      }
    }
    
    return "Help me interpret these experiment results. What do they mean?";
  };
  
  // Generate suggested follow-up prompts based on sub-tab
  const getSuggestedPrompts = () => {
    switch (activeSubTab) {
      case 'metrics':
        return [
          "What do these evaluation metrics mean in plain language?",
          "How does this model compare to industry standards?",
          "What metrics should I focus on for this task type?"
        ];
        
      case 'visualizations':
        return [
          "How do I interpret the confusion matrix?",
          "What do the SHAP values tell me about feature importance?",
          "What does this ROC curve indicate about my model?"
        ];
        
      case 'details':
        return [
          "How did these hyperparameters affect model performance?",
          "What settings could I change to improve results?",
          "Is there overfitting or underfitting in this model?"
        ];
        
      case 'downloads':
        return [
          "How do I deploy this model in production?",
          "What information is in the model report?",
          "Can I convert this model to another format?"
        ];
        
      default:
        return [
          "How good is this model overall?",
          "What can I do to improve performance?",
          "Should I try a different algorithm?"
        ];
    }
  };
  
  return (
    <AIInsightCard
      title="Experiment Results Analysis"
      initialPrompt={getInitialPrompt()}
      contextData={contextData}
      sessionId="experiment_stage"
      collapsed={false}
      suggestedPrompts={getSuggestedPrompts()}
    />
  );
};

export default ExperimentInsights;
