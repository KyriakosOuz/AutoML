
import React, { useState, useEffect } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Milestone } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type ImputationStrategy = 'mean' | 'median' | 'mode' | 'drop' | 'hot_deck' | 'skip';

interface MissingValueHandlerProps {
  onComplete?: () => void;
}

const MissingValueHandler: React.FC<MissingValueHandlerProps> = ({ onComplete }) => {
  const { 
    datasetId, 
    overview, 
    updateState
  } = useDataset();
  
  const [missingStrategy, setMissingStrategy] = useState<ImputationStrategy>('mean');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();
  
  const hasMissingValues = overview && overview.total_missing_values && overview.total_missing_values > 0;
  
  useEffect(() => {
    // Reset success message when the selected strategy changes
    setSuccess(null);
  }, [missingStrategy]);
  
  const getMissingValueStats = () => {
    if (!overview || !overview.missing_values_count) {
      return [];
    }
    
    // Create an array of [column, count] pairs and sort by count in descending order
    return Object.entries(overview.missing_values_count)
      .filter(([_, count]) => count > 0) // Only include columns with missing values
      .sort((a, b) => b[1] - a[1]); // Sort by count (descending)
  };
  
  const getMissingPercentage = (count: number) => {
    if (!overview || !overview.num_rows || overview.num_rows === 0) return 0;
    return (count / overview.num_rows) * 100;
  };
  
  const handleProcessMissingValues = async () => {
    if (!datasetId) {
      setError('No dataset selected');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await datasetApi.handleMissingValues(
        datasetId,
        missingStrategy
      );
      
      // Update context with response data
      updateState({
        datasetId: response.dataset_id,
        processingStage: 'cleaned',
        overview: response.overview,
        fileUrl: response.file_url
      });
      
      setSuccess('Missing values handled successfully.');
      
      toast({
        title: "Process Complete",
        description: missingStrategy === 'skip' 
          ? "No processing applied (skip strategy)" 
          : `Missing values handled using ${missingStrategy} strategy`,
        duration: 3000,
      });

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
      
    } catch (error) {
      console.error('Error handling missing values:', error);
      setError(error instanceof Error ? error.message : 'Failed to process missing values');
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : 'Failed to process missing values',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getStrategyDescription = (strategy: ImputationStrategy): string => {
    switch(strategy) {
      case 'mean':
        return 'Replace missing values with the mean of each column (numerical only)';
      case 'median':
        return 'Replace missing values with the median of each column (numerical only)';
      case 'mode':
        return 'Replace missing values with the most common value in each column';
      case 'drop':
        return 'Remove rows containing any missing values';
      case 'hot_deck':
        return 'Replace missing values with values from similar rows';
      case 'skip':
        return 'Skip processing missing values for now';
      default:
        return 'Select a strategy to handle missing values';
    }
  };
  
  if (!datasetId || !overview) {
    return null;
  }
  
  const missingValueStats = getMissingValueStats();
  const totalMissingCount = overview.total_missing_values || 0;
  
  // If there are no missing values, show a simpler card
  if (!hasMissingValues) {
    return (
      <Card className="w-full mt-6">
        <CardHeader>
          <CardTitle className="flex items-center text-green-600 gap-2">
            <Milestone className="h-5 w-5" />
            Missing Values Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription className="text-green-800">
              No missing values detected in your dataset. You may proceed to the next step.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Handle Missing Values</CardTitle>
        <CardDescription>
          {totalMissingCount > 0 
            ? `Your dataset has ${totalMissingCount} missing values (${(totalMissingCount / (overview.num_rows * overview.num_columns) * 100).toFixed(2)}% of all cells)`
            : 'Your dataset has no missing values'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
        
        {missingValueStats.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Columns with Missing Values</h3>
            <div className="space-y-2">
              {missingValueStats.map(([column, count]) => (
                <div key={column} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{column}</span>
                    <span className="text-gray-500">
                      {count} missing ({getMissingPercentage(count).toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={getMissingPercentage(count)} />
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Select Processing Strategy</h3>
          <Select
            value={missingStrategy}
            onValueChange={(value) => setMissingStrategy(value as ImputationStrategy)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mean">Mean Imputation</SelectItem>
              <SelectItem value="median">Median Imputation</SelectItem>
              <SelectItem value="mode">Mode Imputation</SelectItem>
              <SelectItem value="drop">Drop Rows</SelectItem>
              <SelectItem value="hot_deck">Hot Deck Imputation</SelectItem>
              <SelectItem value="skip">Skip (No Processing)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">
            {getStrategyDescription(missingStrategy)}
          </p>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleProcessMissingValues} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Process Missing Values'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MissingValueHandler;
