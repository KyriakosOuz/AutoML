
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { ClassImbalanceData } from '@/contexts/DatasetContext';

interface ClassImbalanceAlertProps {
  classImbalanceData: ClassImbalanceData;
}

const ClassImbalanceAlert: React.FC<ClassImbalanceAlertProps> = ({ classImbalanceData }) => {
  if (!classImbalanceData) return null;
  
  const { needs_balancing, target_column, recommendation } = classImbalanceData;

  if (needs_balancing) {
    return (
      <Alert variant="warning" className="mb-4 bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700">
          <span className="font-semibold">Class imbalance detected</span> in target column '{target_column}'.
          {recommendation && ` ${recommendation}.`}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 bg-green-50 border-green-200">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-700">
        Target class distribution looks balanced.
      </AlertDescription>
    </Alert>
  );
};

export default ClassImbalanceAlert;
