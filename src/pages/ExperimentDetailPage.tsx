import React from 'react';
import { useParams } from 'react-router-dom';
import { TrainingProvider } from '@/contexts/training/TrainingContext';
import { DatasetProvider } from '@/contexts/DatasetContext';
import ExperimentInsights from '@/components/ai-assistant/ExperimentInsights';

const ExperimentDetailPage: React.FC = () => {
  const { experimentId } = useParams<{ experimentId: string }>();
  
  return (
    <DatasetProvider>
      <TrainingProvider>
        <div className="container max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Experiment Details: {experimentId}</h1>
          <ExperimentInsights />
          {/* Rest of the component */}
        </div>
      </TrainingProvider>
    </DatasetProvider>
  );
};

export default ExperimentDetailPage;
