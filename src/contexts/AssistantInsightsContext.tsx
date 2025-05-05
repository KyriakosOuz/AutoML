
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

// Import hooks conditionally to prevent errors
let useDatasetImport: any = null;
let useTrainingImport: any = null;

// Dynamically import hooks to prevent errors when providers aren't available
try {
  // Attempt to import useDataset, but don't fail if it's not available
  useDatasetImport = require('./DatasetContext').useDataset;
} catch (error) {
  console.log('DatasetContext not available');
}

try {
  // Attempt to import useTraining, but don't fail if it's not available
  useTrainingImport = require('./training/TrainingContext').useTraining;
} catch (error) {
  console.log('TrainingContext not available');
}

export interface Insight {
  id: string;
  title: string;
  content: string;
  route: string;
  timestamp: Date;
  suggestedPrompts?: string[];
}

interface AssistantInsightsContextType {
  insights: Insight[];
  addInsight: (insight: Omit<Insight, 'id' | 'timestamp'>) => void;
  removeInsight: (id: string) => void;
  clearInsights: () => void;
  getRouteInsights: (route: string) => Insight[];
}

const AssistantInsightsContext = createContext<AssistantInsightsContextType | undefined>(undefined);

export const AssistantInsightsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const location = useLocation();
  
  // Safely use contexts only if they're available
  const datasetContext = useDatasetImport ? useDatasetImport() : null;
  const trainingContext = useTrainingImport ? useTrainingImport() : null;

  // Add a new insight
  const addInsight = (insight: Omit<Insight, 'id' | 'timestamp'>) => {
    const newInsight: Insight = {
      ...insight,
      id: uuidv4(),
      timestamp: new Date()
    };
    
    setInsights(prev => {
      // Remove duplicate insights with the same title for the same route
      const filtered = prev.filter(i => !(i.title === insight.title && i.route === insight.route));
      return [...filtered, newInsight];
    });
  };

  // Remove an insight by ID
  const removeInsight = (id: string) => {
    setInsights(prev => prev.filter(insight => insight.id !== id));
  };

  // Clear all insights
  const clearInsights = () => {
    setInsights([]);
  };

  // Get insights for a specific route
  const getRouteInsights = (route: string) => {
    return insights.filter(insight => insight.route === route);
  };

  // Generate dataset insights when needed
  useEffect(() => {
    if (location.pathname.includes('/dataset') && datasetContext?.datasetId) {
      const overview = datasetContext.overview;
      
      // Dataset overview insight
      if (overview) {
        const hasMissingValues = overview.total_missing_values && overview.total_missing_values > 0;
        
        if (location.pathname.includes('/upload') || location.pathname.includes('/explore')) {
          addInsight({
            title: 'Dataset Overview',
            content: hasMissingValues 
              ? `Your dataset has ${overview.total_missing_values} missing values across ${overview.num_columns} columns. You'll need to handle them in the next step.`
              : 'Great! Your dataset has no missing values. You can continue to feature selection.',
            route: '/dataset',
            suggestedPrompts: [
              'What preprocessing steps should I consider?',
              'How should I handle these missing values?',
              'What features might be important?'
            ]
          });
        }
        
        // Features stage insight
        if (location.pathname.includes('/features') && datasetContext.targetColumn) {
          addInsight({
            title: 'Feature Selection',
            content: `You've selected '${datasetContext.targetColumn}' as your target column. Select the features you want to include in your model.`,
            route: '/dataset/features',
            suggestedPrompts: [
              'Which features are most important?',
              'How many features should I select?',
              'What happens if I select correlated features?'
            ]
          });
        }
        
        // Preprocessing stage insight
        if (location.pathname.includes('/preprocess') && datasetContext.taskType) {
          const isClassification = datasetContext.taskType === 'classification';
          addInsight({
            title: 'Preprocessing Options',
            content: isClassification
              ? 'For classification tasks, consider applying class balancing if your classes are imbalanced.'
              : 'For regression tasks, normalizing your numerical features can improve model performance.',
            route: '/dataset/preprocess',
            suggestedPrompts: [
              'Should I normalize my data?',
              isClassification ? 'How does class balancing work?' : 'What scaling method is best?',
              'What preprocessing steps are most important?'
            ]
          });
        }
      }
    }
    
    // Training insights - only generate if trainingContext is available and we're on the training page
    if (location.pathname.includes('/training') && trainingContext) {
      // We need to be more careful about accessing training context properties to avoid triggering bugs
      try {
        // Only generate insights when we're sure it's safe
        const isTraining = trainingContext.isTraining;
        const experimentResults = trainingContext.experimentResults;
        const experimentStatus = trainingContext.experimentStatus;

        // Training setup insight
        if (!isTraining && !experimentResults) {
          addInsight({
            title: 'Training Configuration',
            content: 'Select your training method: AutoML will automatically find the best model, or configure a custom model manually.',
            route: '/training',
            suggestedPrompts: [
              "What's the difference between AutoML and custom?",
              "Which algorithm should I choose?",
              "How do I interpret the results?"
            ]
          });
        }
        
        // Training results insight - only add when explicitly completed
        if (experimentStatus === 'completed' && experimentResults) {
          addInsight({
            title: 'Training Complete',
            content: `Your model training has completed successfully. Check the results to see how your model performed.`,
            route: '/training',
            suggestedPrompts: [
              "How do I interpret these metrics?",
              "Is this a good model?",
              "How can I improve my model?"
            ]
          });
        }
      } catch (error) {
        console.error('Error generating training insights:', error);
        // Don't let errors in insight generation crash the context
      }
    }
  }, [
    location.pathname,
    datasetContext?.datasetId,
    datasetContext?.overview,
    datasetContext?.targetColumn,
    datasetContext?.taskType,
    trainingContext?.isTraining,
    trainingContext?.experimentResults,
    trainingContext?.experimentStatus,
    addInsight
  ]);

  return (
    <AssistantInsightsContext.Provider value={{
      insights,
      addInsight,
      removeInsight,
      clearInsights,
      getRouteInsights
    }}>
      {children}
    </AssistantInsightsContext.Provider>
  );
};

export const useAssistantInsights = (): AssistantInsightsContextType => {
  const context = useContext(AssistantInsightsContext);
  if (context === undefined) {
    throw new Error('useAssistantInsights must be used within a AssistantInsightsProvider');
  }
  return context;
};
