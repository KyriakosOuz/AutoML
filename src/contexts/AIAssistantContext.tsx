
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
  
  const res = await fetch(`${API_BASE_URL}/api/ai-assistant/`, {
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
  
  const res = await fetch(`${API_BASE_URL}/api/ai-assistant/history/?session_id=${sessionId}`, {
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
      }
    } else {
      context += `No dataset uploaded yet. `;
    }
  }
  
  // Add training context if on training page
  else if (pathname.includes('/training')) {
    context += `Current view: Model training. `;
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

// Suggested prompts based on the current route
const getSuggestedPromptsForRoute = (pathname: string, datasetContext: any | null): string[] => {
  if (pathname.includes('/dataset')) {
    if (!datasetContext || !datasetContext.datasetId) {
      return [
        "What kind of dataset should I upload?",
        "How do I prepare my CSV file for upload?",
        "What types of data formats are supported?",
      ];
    }
    
    if (!datasetContext.processingStage || datasetContext.processingStage === 'raw') {
      return [
        "How should I handle missing values in my dataset?",
        "What preprocessing steps do you recommend?",
        "Can you explain the dataset overview statistics?",
      ];
    }
    
    return [
      "Which features are most important for my model?",
      "Should I scale my numerical features?",
      "How do I encode categorical variables?",
    ];
  }
  
  if (pathname.includes('/training')) {
    return [
      "Which algorithm would work best for my data?",
      "How do I interpret these model metrics?",
      "What are hyperparameters and how do I tune them?",
      "How do I prevent overfitting?",
    ];
  }
  
  if (pathname.includes('/dashboard')) {
    return [
      "How do I compare multiple experiments?",
      "What metrics should I focus on for my use case?",
      "How do I interpret the experiment results?",
    ];
  }
  
  if (pathname.includes('/experiment')) {
    return [
      "Can you explain these model metrics?",
      "How can I improve this model?",
      "What does this confusion matrix mean?",
      "How do I make predictions with this model?",
    ];
  }
  
  return [
    "What can this AutoML platform do?",
    "How do I get started with machine learning?",
    "What's the difference between classification and regression?",
  ];
};

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
  
  // Get reply content from potentially different API response formats
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
