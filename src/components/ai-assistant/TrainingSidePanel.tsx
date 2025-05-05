
import React, { useMemo } from 'react';
import AIBottomPanel from './AIBottomPanel';
import { useAssistantInsights } from '@/contexts/AssistantInsightsContext';
import { useTraining } from '@/contexts/training/TrainingContext';

const TrainingSidePanel: React.FC = () => {
  const { getRouteInsights } = useAssistantInsights();
  const { isTraining, experimentStatus, activeExperimentId } = useTraining();
  
  const insights = useMemo(() => {
    return getRouteInsights('/training').map(insight => ({
      id: insight.id,
      title: insight.title,
      content: insight.content,
      suggestedPrompts: insight.suggestedPrompts,
    }));
  }, [getRouteInsights]);

  return <AIBottomPanel insights={insights} loading={isTraining} />;
};

export default TrainingSidePanel;
