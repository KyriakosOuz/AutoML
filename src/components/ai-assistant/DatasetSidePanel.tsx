
import React, { useMemo } from 'react';
import AIBottomPanel from './AIBottomPanel';
import { useAssistantInsights } from '@/contexts/AssistantInsightsContext';
import { useDataset } from '@/contexts/DatasetContext';

const DatasetSidePanel: React.FC = () => {
  const { getRouteInsights } = useAssistantInsights();
  const { isLoading } = useDataset();
  
  const insights = useMemo(() => {
    return getRouteInsights('/dataset').map(insight => ({
      id: insight.id,
      title: insight.title,
      content: insight.content,
      suggestedPrompts: insight.suggestedPrompts,
    }));
  }, [getRouteInsights]);

  return <AIBottomPanel insights={insights} loading={isLoading} />;
};

export default DatasetSidePanel;
