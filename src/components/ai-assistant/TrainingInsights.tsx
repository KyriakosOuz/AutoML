
import React from 'react';
import AISidePanel from './AISidePanel';
import { useAssistantInsights } from '@/contexts/AssistantInsightsContext';

const TrainingInsights: React.FC = () => {
  const { getRouteInsights } = useAssistantInsights();
  
  const insights = getRouteInsights('/training').map(insight => ({
    id: insight.id,
    title: insight.title,
    content: insight.content,
    suggestedPrompts: insight.suggestedPrompts,
  }));
  
  return <AISidePanel insights={insights} />;
};

export default TrainingInsights;
