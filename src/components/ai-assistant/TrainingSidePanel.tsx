
import React, { useMemo, useEffect, useState } from 'react';
import AISidePanel from './AISidePanel';
import { useAssistantInsights } from '@/contexts/AssistantInsightsContext';
import { useTraining } from '@/contexts/training/TrainingContext';

const TrainingSidePanel: React.FC = () => {
  const { getRouteInsights } = useAssistantInsights();
  const trainingContext = useTraining();
  const [loading, setLoading] = useState(false);
  
  // Safely access training context values
  useEffect(() => {
    if (trainingContext) {
      setLoading(trainingContext.isTraining);
    }
  }, [trainingContext]);
  
  const insights = useMemo(() => {
    return getRouteInsights('/training').map(insight => ({
      id: insight.id,
      title: insight.title,
      content: insight.content,
      suggestedPrompts: insight.suggestedPrompts,
    }));
  }, [getRouteInsights]);

  return <AISidePanel insights={insights} loading={loading} />;
};

export default TrainingSidePanel;
