import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getAuthHeaders } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

// Define the message interface
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  loading?: boolean;
}

// Define the AIAssistant context interface
interface AIAssistantContextType {
  messages: AIMessage[];
  isChatOpen: boolean;
  isLoading: boolean;
  currentSession: string;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  suggestedPrompts: string[];
}

// Create the context
const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

// Generate a unique ID for messages
const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper function to ask Mistral AI
export async function askMistral(prompt: string, context: string, sessionId: string) {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API_BASE_URL}/ai-assistant/`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, context, session_id: sessionId }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('[Mistral API Error]:', errorText);
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  
  return await res.json();
}

// Helper function to get conversation history
export async function getMistralHistory(sessionId: string) {
  const headers = await getAuthHeaders();
  
  const res = await fetch(`${API_BASE_URL}/ai-assistant/history/?session_id=${sessionId}`, {
    headers
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('[Mistral History Error]:', errorText);
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  
  return await res.json();
}

// Determine the session ID based on the current route
const getSessionIdFromRoute = (pathname: string): string => {
  if (pathname.includes('/dataset/upload')) return 'upload_stage';
  if (pathname.includes('/dataset/explore')) return 'explore_stage';
  if (pathname.includes('/dataset/features')) return 'features_stage';
  if (pathname.includes('/dataset/preprocess')) return 'preprocess_stage';
  if (pathname.includes('/dataset')) return 'dataset_stage';
  if (pathname.includes('/training')) return 'training_stage';
  if (pathname.includes('/dashboard')) return 'dashboard_stage';
  if (pathname.includes('/experiment')) return 'experiment_stage';
  if (pathname.includes('/feedback')) return 'feedback_stage';
  return 'general_stage';
};

// Generate context based on app state and current route
const generateContext = (pathname: string, datasetContext: any | null, userId: string | undefined): string => {
  let context = `User ID: ${userId || 'unauthenticated'}. `;
  
  // Add dataset context if on dataset page and context exists
  if (pathname.includes('/dataset') && datasetContext) {
    const { datasetId, targetColumn, processingStage, overview } = datasetContext;
    context += `Current view: Dataset management. `;
    
    if (datasetId) {
      context += `Dataset ID: ${datasetId}. `;
      if (targetColumn) context += `Target column: ${targetColumn}. `;
      if (processingStage) context += `Processing stage: ${processingStage}. `;
      
      if (overview) {
        context += `Dataset has ${overview.num_rows || 'unknown'} rows and ${overview.num_columns || 'unknown'} columns. `;
        if (overview.total_missing_values) {
          context += `Dataset has ${overview.total_missing_values} missing values. `;
        }
        
        // Add more detailed dataset information
        if (overview.numerical_features) {
          context += `Numerical features: ${overview.numerical_features.join(', ')}. `;
        }
        
        if (overview.categorical_features) {
          context += `Categorical features: ${overview.categorical_features.join(', ')}. `;
        }
        
        // Add information about data types and unique values
        if (overview.data_types) {
          context += `Data types: ${JSON.stringify(overview.data_types)}. `;
        }
        
        if (overview.unique_values_count) {
          // Find columns with few unique values (potential categorical)
          const categoricalCandidates = Object.entries(overview.unique_values_count)
            .filter(([_, count]) => {
              const countVal = count as any;
              return typeof countVal === 'number' && countVal < 10 && countVal > 1;
            })
            .map(([col]) => col);
            
          if (categoricalCandidates.length > 0) {
            context += `Columns with few unique values: ${categoricalCandidates.join(', ')}. `;
          }
        }
      }
      
      // Add information about processing stages
      if (processingStage === 'raw') {
        context += `Dataset is in raw state and needs preprocessing. `;
      } else if (processingStage === 'cleaned') {
        context += `Dataset has been cleaned but features need to be selected. `;
      } else if (processingStage === 'final') {
        context += `Dataset is preprocessed and ready for training. `;
      }
    } else {
      context += `No dataset uploaded yet. `;
    }
  }
  
  // Add training context if on training page
  else if (pathname.includes('/training')) {
    context += `Current view: Model training. `;
    
    // Try to get training context
    try {
      // Only use if we're on the training route
      // Use property names that match what's in TrainingContext
      const trainingContext = window.__TRAINING_CONTEXT__;
      
      if (trainingContext) {
        const { activeExperimentId, lastTrainingType, experimentStatus, automlParameters, customParameters, experimentResults } = trainingContext;
        
        if (activeExperimentId) context += `Experiment ID: ${activeExperimentId}. `;
        if (lastTrainingType) context += `Training type: ${lastTrainingType}. `;
        if (experimentStatus) context += `Training status: ${experimentStatus}. `;
        
        // Add algorithm information
        if (lastTrainingType === 'automl' && automlParameters?.automlEngine) {
          context += `AutoML engine: ${automlParameters.automlEngine}. `;
        } else if (lastTrainingType === 'custom' && customParameters?.algorithm) {
          context += `Algorithm: ${customParameters.algorithm}. `;
        }
        
        // Add hyperparameters and metrics if available
        if (experimentResults) {
          if (experimentResults.hyperparameters) {
            context += `Hyperparameters: ${JSON.stringify(experimentResults.hyperparameters)}. `;
          }
          
          if (experimentResults.metrics) {
            context += `Training metrics: ${JSON.stringify(experimentResults.metrics)}. `;
          }
          
          if (experimentResults.task_type) {
            context += `Task type: ${experimentResults.task_type}. `;
          }
        }
      }
    } catch (error) {
      console.log('Training context not available');
    }
  }
  
  // Add dashboard context if on dashboard page
  else if (pathname.includes('/dashboard')) {
    context += `Current view: Dashboard with experiments overview. `;
  }
  
  // Add experiment details context if on experiment page
  else if (pathname.includes('/experiment')) {
    const experimentId = pathname.split('/experiment/')[1];
    context += `Current view: Viewing experiment with ID: ${experimentId}. `;
  }
  
  return context;
};

// Enhanced suggested prompts based on the current route and context
const getSuggestedPromptsForRoute = (pathname: string, datasetContext: any | null): string[] => {
  // 1. Dataset Upload & Preview
  if (pathname.includes('/dataset/upload') || pathname.includes('/dataset/explore')) {
    if (!datasetContext || !datasetContext.datasetId) {
      return [
        "What makes a good training dataset?",
        "How do I know if my data is balanced?",
        "What should I look for in my data before modeling?",
      ];
    }
    
    return [
      "Is this enough data for machine learning?",
      "How do I interpret these data distributions?",
      "Are these outliers problematic for my model?",
      "How much missing data is too much?",
    ];
  }
  
  // 2. Missing Value Handling
  if (datasetContext?.processingStage === 'raw' || 
     (pathname.includes('/dataset/explore') && datasetContext?.overview?.total_missing_values > 0)) {
    return [
      "When should I use mean vs. median imputation?",
      "Is my imputation strategy introducing bias?",
      "What's the impact of dropping vs. imputing?",
      "How do different imputation methods affect model accuracy?",
    ];
  }
  
  // 3. Feature Selection
  if (pathname.includes('/dataset/features') || datasetContext?.processingStage === 'cleaned') {
    return [
      "What's a good feature importance score?",
      "How do I interpret feature correlations?",
      "Are these features sufficient for my model?",
      "Should I remove correlated features?",
    ];
  }
  
  // 4. Preprocessing
  if (pathname.includes('/dataset/preprocess') || datasetContext?.processingStage === 'final') {
    return [
      "When is normalization necessary?",
      "How do I interpret my class balance ratio?",
      "What's the difference between scaling and normalization?",
      "How does class imbalance affect different algorithms?",
    ];
  }
  
  // 5. Model Training
  if (pathname.includes('/training')) {
    return [
      "What hyperparameters matter most for this algorithm?",
      "Why would my model be underfitting?",
      "How do I know if my model is overfitting?",
      "What's a good learning rate for my model?",
    ];
  }
  
  // 6. Model Results & Visualizations
  if (pathname.includes('/training') && window.__TRAINING_CONTEXT__?.experimentStatus === 'completed') {
    return [
      "Is 75% accuracy good for my classification model?",
      "How do I interpret this confusion matrix?",
      "What's a good AUC score?",
      "Why is precision more important than recall for my use case?",
    ];
  }
  
  // 7. Predictions
  if (pathname.includes('/training') && pathname.includes('predict')) {
    return [
      "How reliable are these prediction probabilities?",
      "What's a good confidence threshold for my model?",
      "How can I improve my model's prediction accuracy?",
      "What do these prediction intervals mean?",
    ];
  }
  
  // 8. Dashboard & Comparisons
  if (pathname.includes('/dashboard')) {
    return [
      "Which metrics should I prioritize when comparing models?",
      "Is this difference in model performance significant?",
      "How do I interpret differences in learning curves?",
      "When is a simpler model better than a complex one?",
    ];
  }
  
  // 9. Experiment details
  if (pathname.includes('/experiment')) {
    return [
      "Is this model performance good enough for production?",
      "What do these evaluation metrics tell me?",
      "How do I interpret this ROC curve?",
      "What's causing these false positives in my model?",
    ];
  }
  
  // General prompts
  return [
    "What's a good F1 score for my model?",
    "How do I interpret the confusion matrix?",
    "What's the difference between precision and recall?",
    "Is my model's performance statistically significant?",
  ];
};

// Make the training context globally available to avoid import errors
declare global {
  interface Window {
    __TRAINING_CONTEXT__?: any;
  }
}

// Provider component
export const AIAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState('general_stage');
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const { toast } = useToast();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get dataset context safely - it might not be available on all routes
  let datasetContext = null;
  try {
    // Only use the dataset context if we're on a route that has the DatasetProvider
    if (location.pathname.includes('/dataset')) {
      // We'll try to import and use the dataset context, but we'll handle errors gracefully
      const { useDataset } = require('@/contexts/DatasetContext');
      datasetContext = useDataset();
    }
  } catch (error) {
    console.log('Dataset context not available on this route');
  }
  
  // Update session ID when route changes
  useEffect(() => {
    const newSessionId = getSessionIdFromRoute(location.pathname);
    setCurrentSession(newSessionId);
    
    // Update suggested prompts based on new route
    const newPrompts = getSuggestedPromptsForRoute(location.pathname, datasetContext);
    setSuggestedPrompts(newPrompts);
    
    // Load message history for this session
    loadSessionHistory(newSessionId);
  }, [location.pathname, datasetContext]);
  
  // Load message history for the current session
  const loadSessionHistory = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const history = await getMistralHistory(sessionId);
      
      if (history && Array.isArray(history.data)) {
        // Map API history format to our message format
        const historyMessages = history.data.flatMap((item: any) => {
          const messages: AIMessage[] = [];
          
          // Add user message
          messages.push({
            id: generateId(),
            role: 'user',
            content: item.prompt,
            timestamp: item.timestamp,
          });
          
          // Add assistant response
          messages.push({
            id: generateId(),
            role: 'assistant',
            content: item.response,
            timestamp: item.timestamp,
          });
          
          return messages;
        });
        
        setMessages(historyMessages);
      }
    } catch (error) {
      console.error('Failed to load message history:', error);
      // Don't show error toast for initial load - could be first time user
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open the chat panel
  const openChat = () => setIsChatOpen(true);
  
  // Close the chat panel
  const closeChat = () => setIsChatOpen(false);
  
  // Extract the getReplyContent function to handle different API response formats
  const extractReplyFromResponse = (response: any): string => {
    // Log the response structure for debugging
    console.log('[AI Assistant] Response structure:', JSON.stringify(response));
    
    // Check for nested data.reply format
    if (response && response.data && response.data.reply) {
      return response.data.reply;
    }
    
    // Check for top-level reply format
    if (response && response.reply) {
      return response.reply;
    }
    
    // If neither format exists, throw a descriptive error
    throw new Error('Invalid response format: missing reply content');
  };
  
  // Send a message to the AI assistant
  const sendMessage = async (content: string) => {
    try {
      // Add the user message to the UI immediately
      const userMessageId = generateId();
      const userMessage: AIMessage = {
        id: userMessageId,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      
      // Add a placeholder for the assistant's response
      const assistantMessageId = generateId();
      const assistantMessage: AIMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        loading: true,
      };
      
      setMessages(prev => [...prev, userMessage, assistantMessage]);
      setIsLoading(true);
      
      // Generate context for the current state
      const context = generateContext(location.pathname, datasetContext, user?.id);
      
      // Send the message to the API
      const response = await askMistral(content, context, currentSession);
      
      try {
        // Extract reply using the helper function that handles different formats
        const replyContent = extractReplyFromResponse(response);
        
        // Update the placeholder with the actual response
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId
              ? { 
                  ...msg, 
                  content: replyContent, 
                  loading: false 
                }
              : msg
          )
        );
      } catch (formatError) {
        console.error('[AI Assistant] Format error:', formatError);
        console.error('[AI Assistant] Response received:', response);
        throw new Error(`Failed to parse AI response: ${formatError.message}`);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Update the placeholder with an error message
      setMessages(prev => 
        prev.map(msg => 
          msg.loading
            ? { 
                ...msg, 
                content: "Sorry, I couldn't generate a response. Please try again.", 
                loading: false 
              }
            : msg
        )
      );
      
      toast({
        title: "Assistant Error",
        description: error instanceof Error ? error.message : "Failed to get a response from the assistant",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear all messages in the current session
  const clearMessages = () => {
    setMessages([]);
  };
  
  const value = {
    messages,
    isChatOpen,
    isLoading,
    currentSession,
    openChat,
    closeChat,
    sendMessage,
    clearMessages,
    suggestedPrompts,
  };
  
  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  );
};

// Hook to use the AIAssistant context
export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (context === undefined) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  return context;
};
