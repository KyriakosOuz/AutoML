
import React, { useMemo } from 'react';
import AISidePanel from './AISidePanel';
import { useAssistantInsights } from '@/contexts/AssistantInsightsContext';

const ExperimentSidePanel: React.FC = () => {
  const { getRouteInsights } = useAssistantInsights();
  
  const insights = useMemo(() => {
    return getRouteInsights('/experiment').map(insight => ({
      id: insight.id,
      title: insight.title,
      content: insight.content,
      suggestedPrompts: insight.suggestedPrompts,
    }));
  }, [getRouteInsights]);

  return <AISidePanel insights={insights} />;
};

export default ExperimentSidePanel;
