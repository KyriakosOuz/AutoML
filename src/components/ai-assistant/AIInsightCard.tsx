
import React, { useState, useEffect } from 'react';
import { useAIAssistant, askMistral } from '@/contexts/AIAssistantContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, ChevronUp, ChevronDown } from 'lucide-react';

interface AIInsightCardProps {
  title?: string;
  initialPrompt: string;
  contextData: string;
  sessionId: string;
  collapsed?: boolean;
  suggestedPrompts?: string[];
}

const AIInsightCard: React.FC<AIInsightCardProps> = ({
  title = "AI Insight",
  initialPrompt,
  contextData,
  sessionId,
  collapsed = true,
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
      // Only fetch if not already loaded
      if (insight !== null || !isExpanded) return;
      
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
  }, [initialPrompt, contextData, sessionId, isExpanded, insight]);
  
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
    <Card className="w-full mb-3 transition-all duration-200 hover:shadow-md border-muted">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={toggleExpand} className="h-7 w-7 p-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pb-3 pt-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-3">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Loading insights...</span>
            </div>
          ) : error ? (
            <div className="text-destructive py-2 text-sm">{error}</div>
          ) : insight ? (
            <>
              <div className="text-sm whitespace-pre-wrap mb-3 text-muted-foreground">{insight}</div>
              
              {/* Suggested prompts */}
              {suggestedPrompts && suggestedPrompts.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt, index) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSuggestedPrompt(prompt)}
                      className="text-xs h-7 px-2 py-0"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleAskFollowUp}
                  className="text-xs h-7"
                >
                  Ask follow-up
                </Button>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground py-2 text-sm">No insights available</div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default AIInsightCard;
