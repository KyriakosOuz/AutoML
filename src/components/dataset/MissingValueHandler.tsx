
import React, { useState, useEffect } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wand2, AlertCircle } from 'lucide-react';

type ImputationStrategy = 'mean' | 'median' | 'mode' | 'drop' | 'skip';

const MissingValueHandler: React.FC = () => {
  const [strategy, setStrategy] = useState<ImputationStrategy>('mean');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    datasetId, 
    overview, 
    updateState 
  } = useDataset();

  // Detect if there are missing values
  const hasMissingValues = overview && overview.total_missing_values > 0;
  
  // Show which columns have missing values
  const missingValueColumns = overview && overview.missing_values_count ? 
    Object.entries(overview.missing_values_count)
      .filter(([_, count]) => count > 0)
      .map(([column, count]) => ({ column, count })) : 
    [];

  const handleProcessMissingValues = async () => {
    if (!datasetId) {
      setError('No dataset selected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await datasetApi.handleMissingValues(
        datasetId, 
        strategy
      );
      
      // Update context with response data
      updateState({
        datasetId: response.dataset_id,
        fileUrl: response.file_url,
        overview: response.overview
      });
      
    } catch (error) {
      console.error('Error handling missing values:', error);
      setError(error instanceof Error ? error.message : 'Failed to process missing values');
    } finally {
      setIsLoading(false);
    }
  };

  if (!datasetId || !overview) {
    return null;
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Handle Missing Values</CardTitle>
        <CardDescription>
          {hasMissingValues 
            ? `Choose a strategy to handle ${overview.total_missing_values} missing values in your dataset` 
            : `Your dataset doesn't have missing values or they've been handled`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {missingValueColumns.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <h4 className="font-medium text-amber-800 mb-2">Missing values detected:</h4>
            <ul className="space-y-1 text-sm text-amber-700">
              {missingValueColumns.map(({ column, count }) => (
                <li key={column}>
                  <span className="font-medium">{column}</span>: {count} missing values
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Select
              value={strategy}
              onValueChange={(value) => setStrategy(value as ImputationStrategy)}
              disabled={isLoading || !hasMissingValues}
            >
              <SelectTrigger id="strategy" className="w-full">
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mean">Mean (for numerical values)</SelectItem>
                <SelectItem value="median">Median (for numerical values)</SelectItem>
                <SelectItem value="mode">Mode (most frequent value)</SelectItem>
                <SelectItem value="drop">Drop rows with missing values</SelectItem>
                <SelectItem value="skip">Skip (keep missing values)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {strategy === 'mean' && 'Replace missing values with the mean of the column (numerical only)'}
              {strategy === 'median' && 'Replace missing values with the median of the column (numerical only)'}
              {strategy === 'mode' && 'Replace missing values with the most frequent value in the column'}
              {strategy === 'drop' && 'Remove rows containing any missing values'}
              {strategy === 'skip' && 'Keep missing values as they are'}
            </p>
          </div>

          <Button 
            onClick={handleProcessMissingValues} 
            disabled={isLoading || !hasMissingValues}
            className="w-full"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {isLoading ? 'Processing...' : 'Process Missing Values'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MissingValueHandler;
