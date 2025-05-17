
import React from 'react';
import { useExperimentResults } from './hooks/useExperimentResults';
import ExperimentResultsLoading from './components/ExperimentResultsLoading';
import ExperimentResultsError from './components/ExperimentResultsError';
import ExperimentResultsSelector from './components/ExperimentResultsSelector';

interface ExperimentResultsViewProps {
  experimentId: string;
}

export const ExperimentResultsView: React.FC<ExperimentResultsViewProps> = ({
  experimentId
}) => {
  // Use our custom hook to handle all the experiment results logic
  const { data, isLoading, error, resultType, handleReset, handleRefresh } = useExperimentResults(experimentId);
  
  // Use localLoadingState instead of isLoading to prevent UI flickering
  if (isLoading) {
    return <ExperimentResultsLoading />;
  }

  if (error || !data) {
    return <ExperimentResultsError />;
  }

  // Pass the data to our selector component to render the appropriate experiment results
  return (
    <ExperimentResultsSelector
      experimentId={experimentId}
      data={data}
      resultType={resultType}
      onReset={handleReset}
      onRefresh={handleRefresh}
    />
  );
};

export default ExperimentResultsView;
