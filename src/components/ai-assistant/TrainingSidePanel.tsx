
import React, { useMemo } from 'react';
import AISidePanel from './AISidePanel';
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

  // Pass loading state based on training status
  const isLoading = isTraining || experimentStatus === 'processing' || experimentStatus === 'running';

  return <AISidePanel insights={insights} loading={isLoading} />;
};

export default TrainingSidePanel;
