
import React, { useState, useEffect } from 'react';
import { useAIAssistant, askMistral } from '@/contexts/AIAssistantContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';

interface AIInsightCardProps {
  title?: string;
  initialPrompt: string;
  contextData: string;
  sessionId: string;
  collapsed?: boolean;
  suggestedPrompts?: string[];
}

const AIInsightCard: React.FC<AIInsightCardProps> = ({
  title = "Mistral AI Insights",
  initialPrompt,
  contextData,
  sessionId,
  collapsed = false,
  suggestedPrompts = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { openChat, sendMessage } = useAIAssistant();
  
  // Fetch initial insight on component mount or when prompt/context changes
  useEffect(() => {
    const loadInsight = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await askMistral(initialPrompt, contextData, sessionId);
        
        if (response && response.data && response.data.reply) {
          setInsight(response.data.reply);
        } else {
          throw new Error('Invalid response from AI assistant');
        }
      } catch (error) {
        console.error('Failed to load insight:', error);
        setError('Failed to load AI insights');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch insights if card is expanded to save API calls
    if (isExpanded) {
      loadInsight();
    }
  }, [initialPrompt, contextData, sessionId, isExpanded]);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleAskFollowUp = () => {
    openChat(); // Open the chat dialog
    if (insight) {
      // Send the initial prompt + insight as context to the chat
      sendMessage("I'd like to ask a follow-up question about this insight: " + insight.substring(0, 100) + "...");
    }
  };
  
  const handleSuggestedPrompt = (prompt: string) => {
    openChat(); // Open the chat dialog
    sendMessage(prompt);
  };
  
  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-500" />
            {title}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={toggleExpand}>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pb-3">
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>Loading insights...</span>
            </div>
          ) : error ? (
            <div className="text-destructive py-2">{error}</div>
          ) : insight ? (
            <>
              <div className="text-sm whitespace-pre-wrap mb-3">{insight}</div>
              
              {/* Suggested prompts */}
              {suggestedPrompts && suggestedPrompts.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt, index) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSuggestedPrompt(prompt)}
                      className="text-xs"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAskFollowUp}
                  className="text-xs"
                >
                  Ask follow-up questions
                </Button>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground py-2">No insights available</div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default AIInsightCard;
