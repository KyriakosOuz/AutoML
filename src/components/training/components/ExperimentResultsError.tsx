
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ExperimentResultsErrorProps {
  errorMessage?: string;
}

const ExperimentResultsError: React.FC<ExperimentResultsErrorProps> = ({
  errorMessage = 'Failed to load experiment results. Please try again.'
}) => {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {errorMessage}
      </AlertDescription>
    </Alert>
  );
};

export default ExperimentResultsError;
