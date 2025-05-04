
import React from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface DebugInfoProps {
  showInProduction?: boolean;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ showInProduction = false }) => {
  const { datasetId, overview, processingStage } = useDataset();
  
  // Check if we're in development or if showInProduction is true
  const isDevelopment = process.env.NODE_ENV === 'development';
  const shouldShow = isDevelopment || showInProduction;
  
  if (!shouldShow || !overview) {
    return null;
  }
  
  return (
    <Card className="mt-4 border-dashed border-yellow-300 bg-yellow-50">
      <CardHeader className="py-2">
        <CardTitle className="text-sm flex items-center gap-1 text-yellow-800">
          <Info className="h-4 w-4" /> Debug Information
        </CardTitle>
        <CardDescription className="text-xs text-yellow-700">
          This panel shows internal state for debugging and will not be visible in production.
        </CardDescription>
      </CardHeader>
      <CardContent className="py-2 space-y-2">
        <div className="text-xs">
          <span className="font-semibold">Dataset ID:</span> {datasetId || 'None'}
        </div>
        <div className="text-xs">
          <span className="font-semibold">Processing Stage:</span>
          <Badge variant="outline" className="ml-1">{processingStage || 'None'}</Badge>
        </div>
        <div className="text-xs">
          <span className="font-semibold">Missing Values:</span> {overview.total_missing_values ?? 'Not defined'}
        </div>
        <div className="text-xs">
          <span className="font-semibold">Row Count:</span> {overview.num_rows}
        </div>
        <div className="text-xs">
          <span className="font-semibold">Column Count:</span> {overview.num_columns}
        </div>
        <div className="text-xs">
          <span className="font-semibold">Numerical Features:</span> {overview.numerical_features?.length || 0}
        </div>
        <div className="text-xs">
          <span className="font-semibold">Categorical Features:</span> {overview.categorical_features?.length || 0}
        </div>
        
        {overview.missing_values_count && Object.keys(overview.missing_values_count).length > 0 && (
          <Alert className="p-2 mt-2">
            <AlertTitle className="text-xs">Missing Values by Column</AlertTitle>
            <AlertDescription className="text-xs space-y-1">
              {Object.entries(overview.missing_values_count)
                .filter(([_, count]) => count > 0)
                .map(([column, count]) => (
                  <div key={column}>
                    <span className="font-semibold">{column}:</span> {count}
                  </div>
                ))}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DebugInfo;
