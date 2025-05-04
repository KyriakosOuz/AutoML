
import React, { useState, useEffect } from 'react';
import AIInsightCard from './AIInsightCard';
import { useLocation } from 'react-router-dom';
import { useTraining } from '@/contexts/training/TrainingContext';

// Track if user has visited the training page before
const TRAINING_VISITED_KEY = 'ml_training_visited';

const TrainingInsights: React.FC = () => {
  const location = useLocation();
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(false);
  
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
    experimentResults,
    activeTab,
  } = useTraining();
  
  // Check if this is user's first visit to training
  useEffect(() => {
    const hasVisited = localStorage.getItem(TRAINING_VISITED_KEY);
    if (!hasVisited) {
      setIsFirstVisit(true);
      localStorage.setItem(TRAINING_VISITED_KEY, 'true');
    }
  }, []);
  
  // Create base context data from training information only (no dataset leakage)
  const baseContextData = `
    Training Context:
    Current Tab: ${activeTab}
    Experiment ID: ${activeExperimentId || 'Not started'}
    Training Type: ${lastTrainingType || 'Not selected'}
    Algorithm: ${lastTrainingType === 'automl' ? automlParameters?.automlEngine : 
                lastTrainingType === 'custom' ? customParameters?.algorithm : 'Not selected'}
    Status: ${experimentStatus || 'Not started'}
    ${experimentResults?.hyperparameters ? `Hyperparameters: ${JSON.stringify(experimentResults.hyperparameters)}` : ''}
    ${experimentResults?.metrics ? `Metrics: ${JSON.stringify(experimentResults.metrics)}` : ''}
  `;
  
  // Generate tab-specific context data based on active tab
  const getTabSpecificContext = () => {
    switch(activeTab) {
      case 'automl':
        return `
          Tab: AutoML Training
          AutoML Engine: ${automlParameters?.automlEngine || 'Not selected'}
          Test Size: ${automlParameters?.testSize || 0.2}
          Stratify: ${automlParameters?.stratify ? 'Yes' : 'No'}
          Random Seed: ${automlParameters?.randomSeed || 42}
          
          Available AutoML Engines:
          - mljar: Good for tabular data, efficient for small-medium datasets
          - autokeras: Based on Keras, good for deep learning tasks
          - h2o: Robust enterprise-grade AutoML with many algorithms
        `;
        
      case 'custom':
        return `
          Tab: Custom Training
          Algorithm: ${customParameters?.algorithm || 'Not selected'}
          Test Size: ${customParameters?.testSize || 0.2}
          Stratify: ${customParameters?.stratify ? 'Yes' : 'No'}
          Random Seed: ${customParameters?.randomSeed || 42}
          Use Default Hyperparameters: ${customParameters?.useDefaultHyperparameters ? 'Yes' : 'No'}
          
          ${customParameters?.hyperparameters ? `Custom Hyperparameters: ${JSON.stringify(customParameters.hyperparameters)}` : ''}
          
          Common Algorithms:
          - Random Forest: Ensemble learning for classification and regression
          - XGBoost: Gradient boosting, high performance
          - Logistic Regression: Good for binary classification, interpretable
          - Linear Regression: For regression tasks, interpretable
          - SVM: Effective for high-dimensional spaces
        `;
        
      case 'results':
        return `
          Tab: Training Results
          Experiment Status: ${experimentStatus || 'Unknown'}
          ${experimentResults?.metrics ? `Performance Metrics: ${JSON.stringify(experimentResults.metrics)}` : 'No metrics available'}
          
          Results include:
          - Performance metrics (accuracy, F1, precision, recall, etc.)
          - Confusion matrix for classification tasks
          - Feature importance
          - ROC and PR curves where applicable
          - Classification report details
        `;
        
      case 'predict':
        return `
          Tab: Model Predictions
          Model available for predictions: ${activeExperimentId ? 'Yes' : 'No'}
          
          Prediction options:
          - Manual input prediction: Enter feature values individually
          - Batch prediction from CSV: Upload a file with multiple instances
          ${experimentStatus === 'completed' ? 'Model is ready for predictions' : 'Model is not yet ready for predictions'}
        `;
        
      default:
        return '';
    }
  };
  
  // Combine base context with tab-specific context
  const contextData = `${baseContextData}\n${getTabSpecificContext()}`;
  
  // Determine the appropriate prompt based on training state and active tab
  const getInitialPrompt = () => {
    // First-time visitor to training page
    if (isFirstVisit && !activeExperimentId) {
      return "I'm new to machine learning. How should I approach model training with this platform?";
    }
    
    // No active experiment yet
    if (!activeExperimentId && !lastTrainingType) {
      switch(activeTab) {
        case 'automl':
          return "Which AutoML engine would you recommend for my dataset and why?";
        case 'custom':
          return "What algorithm would be best suited for this type of data?";
        case 'results':
          return "What metrics should I look for to evaluate my model's performance?";
        case 'predict':
          return "How do I get started with making predictions using my trained model?";
        default:
          return "What should I know about getting started with model training?";
      }
    }
    
    // Experiment is running
    if (experimentStatus === 'processing' || experimentStatus === 'running') {
      switch(activeTab) {
        case 'automl':
          return "While AutoML is running, what should I know about the selected engine?";
        case 'custom':
          return "What should I expect from this algorithm with the current hyperparameters?";
        default:
          return "What should I expect from this training run? What metrics should I focus on?";
      }
    }
    
    // Experiment completed
    if (experimentStatus === 'completed' || experimentStatus === 'success') {
      switch(activeTab) {
        case 'results':
          return "Analyze these model metrics. How good is this model and what do these results mean?";
        case 'predict':
          return "How should I interpret the prediction results from this model?";
        default:
          return "My training is complete. How do these results compare to industry standards?";
      }
    }
    
    // Experiment failed
    if (experimentStatus === 'failed') {
      return "My model training failed. What might have caused this and how can I fix it?";
    }
    
    return "What should I know about this algorithm and training process?";
  };
  
  // Generate suggested follow-up prompts based on active tab
  const getSuggestedPrompts = () => {
    switch(activeTab) {
      case 'automl':
        return [
          "What's the difference between the AutoML engines?",
          "Should I use stratified sampling for this dataset?",
          "What test size is optimal for my data?",
          "How long should I expect the AutoML process to take?"
        ];
      case 'custom':
        return [
          "What hyperparameters should I tune for this algorithm?",
          "How do I avoid overfitting with this model?",
          "When should I use Random Forest vs XGBoost?",
          "How does increasing the max_depth affect my model?"
        ];
      case 'results':
        return [
          "What do these evaluation metrics mean?",
          "How can I improve my model's performance?",
          "How do I interpret the confusion matrix?",
          "What's considered a good F1 score for this type of problem?"
        ];
      case 'predict':
        return [
          "How accurate are these predictions likely to be?",
          "What input values would make the prediction unreliable?",
          "How do I prepare my CSV for batch prediction?",
          "Can I export these predictions for further analysis?"
        ];
      default:
        return [
          "Which algorithm is best for my dataset?",
          "How do I improve model accuracy?",
          "What metrics should I focus on?",
          "How do I know if my model is overfitting?"
        ];
    }
  };
  
  return (
    <AIInsightCard
      title="Training AI Insights"
      initialPrompt={getInitialPrompt()}
      contextData={contextData}
      sessionId="training_stage"
      collapsed={false}
      suggestedPrompts={getSuggestedPrompts()}
    />
  );
};

export default TrainingInsights;
