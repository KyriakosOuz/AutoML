import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { trainingApi } from '@/lib/training';
import CustomTrainingForm from './CustomTrainingForm';
import ExperimentResults from './ExperimentResults';

interface CustomTrainingProps {
  datasetId: string;
  taskType: string;
}

const CustomTraining: React.FC<CustomTrainingProps> = ({ datasetId, taskType }) => {
  const [experimentId, setExperimentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasResults, setHasResults] = useState(false);

  const handleTrainingComplete = (newExperimentId: string) => {
    setExperimentId(newExperimentId);
    setHasResults(true);
  };

  useEffect(() => {
    if (experimentId) {
      setIsLoading(true);
      trainingApi.getExperimentStatus(experimentId)
        .then(status => {
          setHasResults(status.hasTrainingResults);
        })
        .catch(err => {
          setError(err.message || 'Failed to fetch experiment status');
        })
        .finally(() => setIsLoading(false));
    }
  }, [experimentId]);

  return (
    <Card className="w-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}
      {experimentId ? (
        <ExperimentResults experimentId={experimentId} />
      ) : (
        <CustomTrainingForm
          datasetId={datasetId}
          taskType={taskType}
          onTrainingComplete={handleTrainingComplete}
        />
      )}
    </Card>
  );
};

export default CustomTraining;
