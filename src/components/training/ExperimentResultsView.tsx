import React from 'react';
import ExperimentResultsContainer from '../experiments/ExperimentResultsContainer';

interface ExperimentResultsViewProps {
  experimentId: string;
  onReset?: () => void;
}

const ExperimentResultsView: React.FC<ExperimentResultsViewProps> = ({ experimentId, onReset }) => {
  return (
    <ExperimentResultsContainer experimentId={experimentId} status="completed" onReset={onReset} />
  );
};

export default ExperimentResultsView;
