
import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AIInsightCard from './AIInsightCard';
import { useLocation } from 'react-router-dom';
import { useAIAssistant } from '@/contexts/AIAssistantContext';

interface AIBottomPanelProps {
  insights: Array<{
    id: string;
    title: string;
    content: string;
    suggestedPrompts?: string[];
  }>;
  loading?: boolean;
}

const AIBottomPanel: React.FC<AIBottomPanelProps> = ({ insights, loading = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const { openChat } = useAIAssistant();
  
  const getSessionId = (pathname: string): string => {
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

  const sessionId = getSessionId(location.pathname);
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 transition-all duration-300 flex flex-col z-40 ${
        isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'
      }`}
    >
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-10 w-full rounded-t-md rounded-b-none bg-primary/90 text-primary-foreground shadow-md hover:bg-primary z-40 flex items-center justify-center"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          <span className="text-sm font-medium">AI Assistant</span>
          {isExpanded ? <ChevronDown className="h-4 w-4 ml-2" /> : <ChevronUp className="h-4 w-4 ml-2" />}
        </div>
      </Button>
      
      <Card className={`w-full overflow-y-auto overflow-x-hidden transition-all shadow-lg backdrop-blur-sm bg-card/95 border-muted rounded-t-none ${
        isExpanded ? 'max-h-64' : 'max-h-0'
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-medium">AI Assistant Insights</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={openChat}
              className="text-xs"
            >
              Ask a question
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((insight) => (
              <AIInsightCard
                key={insight.id}
                title={insight.title}
                initialPrompt={insight.content}
                contextData=""
                sessionId={sessionId}
                collapsed={true}
                suggestedPrompts={insight.suggestedPrompts}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIBottomPanel;
