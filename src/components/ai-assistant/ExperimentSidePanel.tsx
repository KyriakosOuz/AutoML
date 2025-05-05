
import React, { useMemo } from 'react';
import AIBottomPanel from './AIBottomPanel';
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

  return <AIBottomPanel insights={insights} />;
};

export default ExperimentSidePanel;
