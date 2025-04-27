
import React from 'react';
import ExperimentResults from '@/components/results/ExperimentResults';
import { ExperimentStatus } from '@/contexts/training/types';

interface ExperimentResultsViewProps {
  experimentId: string;
  onReset?: () => void;
}

const ExperimentResultsView: React.FC<ExperimentResultsViewProps> = ({ 
  experimentId, 
  onReset 
}) => {
  return (
    <ExperimentResults
      experimentId={experimentId}
      status="completed" 
      onReset={onReset}
    />
  );
};

export default ExperimentResultsView;
