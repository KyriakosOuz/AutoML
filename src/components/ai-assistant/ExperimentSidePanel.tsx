
import React, { useMemo } from 'react';
import AISidePanel from './AISidePanel';
import { useAssistantInsights } from '@/contexts/AssistantInsightsContext';
import { useParams } from 'react-router-dom';

const ExperimentSidePanel: React.FC = () => {
  const { getRouteInsights } = useAssistantInsights();
  const { experimentId } = useParams<{ experimentId: string }>();
  
  const insights = useMemo(() => {
    const allInsights = getRouteInsights('/experiment');
    // Ensure we have unique insights
    return allInsights.map(insight => ({
      id: insight.id,
      title: insight.title,
      content: insight.content,
      suggestedPrompts: insight.suggestedPrompts,
    }));
  }, [getRouteInsights, experimentId]);

  return <AISidePanel insights={insights} />;
};

export default ExperimentSidePanel;
