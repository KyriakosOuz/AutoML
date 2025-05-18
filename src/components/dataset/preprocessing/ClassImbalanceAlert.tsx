
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { ClassImbalanceData } from '@/contexts/DatasetContext';

interface ClassImbalanceAlertProps {
  classImbalanceData: ClassImbalanceData;
}

const ClassImbalanceAlert: React.FC<ClassImbalanceAlertProps> = ({ classImbalanceData }) => {
  if (!classImbalanceData) return null;
  
  const { 
    needs_balancing, 
    is_imbalanced, 
    target_column, 
    recommendation, 
    status_msg 
  } = classImbalanceData;

  // Severely imbalanced - needs balancing techniques
  if (needs_balancing) {
    return (
      <Alert variant="warning" className="mb-4 bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700">
          <span className="font-semibold">{status_msg || "Class imbalance detected"}</span> in target column '{target_column}'.
          {recommendation && ` ${recommendation}`}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Mild imbalance - show info but doesn't necessarily need balancing
  if (is_imbalanced && !needs_balancing) {
    return (
      <Alert className="mb-4 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <span className="font-semibold">Mild class imbalance</span> in target column '{target_column}'.
          {status_msg && ` ${status_msg}`}
          {recommendation && ` ${recommendation}`}
        </AlertDescription>
      </Alert>
    );
  }

  // Balanced distribution
  return (
    <Alert className="mb-4 bg-green-50 border-green-200">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-700">
        {status_msg || "Target class distribution looks balanced."}
      </AlertDescription>
    </Alert>
  );
};

export default ClassImbalanceAlert;
