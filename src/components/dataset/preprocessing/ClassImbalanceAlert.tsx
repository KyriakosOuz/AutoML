
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
    status_msg,
    class_distribution
  } = classImbalanceData;

  // Format the class distribution for display
  const formatDistribution = () => {
    if (!class_distribution) return '';
    
    return Object.entries(class_distribution)
      .map(([className, percentage]) => `Class '${className}': ${(percentage * 100).toFixed(1)}%`)
      .join(', ');
  };

  // Severely imbalanced - needs balancing techniques
  if (needs_balancing) {
    return (
      <Alert variant="warning" className="mb-4 bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700">
          <div className="font-semibold">⚠️ Imbalanced Dataset</div>
          <div>Target column: '{target_column}'</div>
          <div className="text-xs mt-1">{formatDistribution()}</div>
          {recommendation && (
            <div className="mt-2 font-medium">{recommendation}</div>
          )}
          {status_msg && status_msg !== recommendation && (
            <div className="mt-1 text-sm">{status_msg}</div>
          )}
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
          <div className="font-semibold">ℹ️ Mildly Imbalanced Dataset</div>
          <div>Target column: '{target_column}'</div>
          <div className="text-xs mt-1">{formatDistribution()}</div>
          {recommendation && (
            <div className="mt-2 font-medium">{recommendation}</div>
          )}
          {status_msg && status_msg !== recommendation && (
            <div className="mt-1 text-sm">{status_msg}</div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Balanced distribution
  return (
    <Alert className="mb-4 bg-green-50 border-green-200">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-700">
        <div className="font-semibold">✅ Balanced Dataset</div>
        <div>Target column: '{target_column}'</div>
        <div className="text-xs mt-1">{formatDistribution()}</div>
        {recommendation && recommendation !== "No balancing needed" && (
          <div className="mt-2 font-medium">{recommendation}</div>
        )}
        {status_msg && status_msg !== recommendation && status_msg !== "Target class distribution looks balanced." && (
          <div className="mt-1 text-sm">{status_msg}</div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ClassImbalanceAlert;
