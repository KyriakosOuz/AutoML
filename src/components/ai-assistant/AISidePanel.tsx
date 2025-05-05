
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AIInsightCard from './AIInsightCard';
import { useLocation } from 'react-router-dom';
import { useAIAssistant } from '@/contexts/AIAssistantContext';

interface AISidePanelProps {
  insights: Array<{
    id: string;
    title: string;
    content: string;
    suggestedPrompts?: string[];
  }>;
  loading?: boolean;
}

const AISidePanel: React.FC<AISidePanelProps> = ({ insights, loading = false }) => {
  // Start collapsed by default for better UX
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
      className={`fixed right-0 top-20 bottom-20 transition-all duration-300 flex ${
        isExpanded ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-12 w-6 absolute -left-6 top-1/2 -translate-y-1/2 rounded-l-md rounded-r-none bg-primary/90 text-primary-foreground shadow-md hover:bg-primary z-40"
        onClick={toggleExpanded}
      >
        {isExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
      
      <Card className={`h-full overflow-y-auto overflow-x-hidden transition-all shadow-lg backdrop-blur-sm bg-card/90 border-muted ${
        isExpanded ? 'w-64' : 'w-0'
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-medium">AI Assistant</h2>
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
          
          <div className="space-y-3">
            {insights.map((insight) => (
              <AIInsightCard
                key={insight.id}
                title={insight.title}
                initialPrompt={insight.content}
                contextData=""
                sessionId={sessionId}
                collapsed={true} // Start collapsed by default
                suggestedPrompts={insight.suggestedPrompts}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AISidePanel;
