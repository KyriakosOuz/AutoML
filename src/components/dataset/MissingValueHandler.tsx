import React, { useState, useEffect, useMemo } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Wand2, AlertCircle, Info, CheckCircle2, BadgeAlert, CircleSlash } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type ImputationStrategy = 'mean' | 'median' | 'mode' | 'hot_deck' | 'drop' | 'skip';

// Define strategy info with descriptions and availability conditions
interface StrategyInfo {
  label: string;
  description: string;
  isEnabled: (options: {
    hasNumericalWithMissing: boolean;
    hasCategoricalWithMissing: boolean;
    hasAnyMissingValues: boolean;
  }) => boolean;
}

const strategiesInfo: Record<ImputationStrategy, StrategyInfo> = {
  mean: {
    label: 'Mean',
    description: 'Replace missing values with the average. Only for numerical columns.',
    isEnabled: ({ hasNumericalWithMissing }) => hasNumericalWithMissing,
  },
  median: {
    label: 'Median',
    description: 'Replace missing values with the median value. Only for numerical columns.',
    isEnabled: ({ hasNumericalWithMissing }) => hasNumericalWithMissing,
  },
  mode: {
    label: 'Mode',
    description: 'Replace missing values with the most frequent value. Works for any column type.',
    isEnabled: () => true, // Always enabled
  },
  hot_deck: {
    label: 'Hot Deck',
    description: 'Find similar rows and copy values from the nearest non-missing neighbor. Works for both numerical and categorical.',
    isEnabled: ({ hasAnyMissingValues }) => hasAnyMissingValues,
  },
  drop: {
    label: 'Drop',
    description: 'Remove any row with at least one missing value.',
    isEnabled: ({ hasAnyMissingValues }) => hasAnyMissingValues,
  },
  skip: {
    label: 'Skip',
    description: 'Leave missing values unchanged.',
    isEnabled: () => true, // Always enabled
  },
};

const MissingValueHandler: React.FC = () => {
  const { 
    datasetId, 
    overview, 
    updateState,
    processingStage,
    previewData,
    setPreviewData,
    previewColumns,
    setPreviewColumns
  } = useDataset();
  
  const { toast } = useToast();
  
  // Calculate which strategies should be enabled
  const strategyAvailability = useMemo(() => {
    if (!overview) return { hasNumericalWithMissing: false, hasCategoricalWithMissing: false, hasAnyMissingValues: false };
    
    const numericalFeatures = overview.numerical_features || [];
    const categoricalFeatures = overview.categorical_features || [];
    const missingValuesCount = overview.missing_values_count || {};
    
    // Check if we have numerical columns with missing values
    const hasNumericalWithMissing = numericalFeatures.some(col => (missingValuesCount[col] || 0) > 0);
    
    // Check if we have categorical columns with missing values
    const hasCategoricalWithMissing = categoricalFeatures.some(col => (missingValuesCount[col] || 0) > 0);
    
    // Check if we have any missing values at all
    const hasAnyMissingValues = overview.total_missing_values ? overview.total_missing_values > 0 : false;
    
    console.log('Strategy availability calculations:', {
      hasNumericalWithMissing,
      hasCategoricalWithMissing, 
      hasAnyMissingValues,
      totalMissing: overview?.total_missing_values
    });
    
    return {
      hasNumericalWithMissing,
      hasCategoricalWithMissing,
      hasAnyMissingValues
    };
  }, [overview]);

  // Initialize with a proper default strategy based on data
  const getDefaultStrategy = (): ImputationStrategy => {
    if (strategyAvailability.hasNumericalWithMissing) {
      return 'mean';
    } else if (strategyAvailability.hasCategoricalWithMissing) {
      return 'mode';
    } else {
      return 'skip';
    }
  };

  const [strategy, setStrategy] = useState<ImputationStrategy>(() => getDefaultStrategy());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update strategy when data changes
  useEffect(() => {
    // Only change strategy if current one is no longer valid
    if (overview && strategy) {
      const isCurrentStrategyValid = strategiesInfo[strategy]?.isEnabled(strategyAvailability);
      if (!isCurrentStrategyValid) {
        setStrategy(getDefaultStrategy());
      }
    }
  }, [strategyAvailability, overview]);

  // Add debug logging to help diagnose the issue
  useEffect(() => {
    if (datasetId && overview) {
      console.log('MissingValueHandler - Current overview:', overview);
      console.log('MissingValueHandler - Has missing values:', overview?.total_missing_values, 
                  overview?.total_missing_values > 0);
    }
  }, [datasetId, overview]);

  // Detect if there are missing values
  const hasMissingValues = overview?.total_missing_values ? overview.total_missing_values > 0 : false;
  
  // Show which columns have missing values
  const missingValueColumns = overview?.missing_values_count ? 
    Object.entries(overview.missing_values_count)
      .filter(([_, count]) => count > 0)
      .map(([column, count]) => ({ column, count, percentage: (count / (overview.num_rows || 1)) * 100 }))
      .sort((a, b) => b.count - a.count) : 
    [];

  const totalRows = overview?.num_rows || 0;
  const totalMissingCells = overview?.total_missing_values || 0;
  const totalCells = totalRows * (overview?.num_columns || 0);
  const overallMissingPercentage = totalCells > 0 ? (totalMissingCells / totalCells) * 100 : 0;

  // Get current strategy description
  const currentStrategyDescription = strategyAvailability && strategy ? 
    strategiesInfo[strategy]?.description : '';

  // Function to refresh data preview after handling missing values
  const refreshDataPreview = async () => {
    if (!datasetId) return;
    
    try {
      console.log('Refreshing data preview for cleaned data');
      const response = await datasetApi.previewDataset(datasetId, 'cleaned');
      console.log('Preview refresh response:', response);
      
      if (response && response.data) {
        setPreviewData(response.data.preview || []);
        setPreviewColumns(response.data.columns || []);
      } else {
        setPreviewData(response.preview || []);
        setPreviewColumns(response.columns || []);
      }
    } catch (error) {
      console.error('Error refreshing data preview:', error);
    }
  };

  const handleProcessMissingValues = async (e: React.FormEvent) => {
    // Prevent default to avoid any navigation
    e.preventDefault();
    
    if (!datasetId) {
      setError('No dataset selected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Processing missing values with strategy:', strategy);
      
      const response = await datasetApi.handleMissingValues(
        datasetId, 
        strategy
      );
      
      console.log('Missing values processing response:', response);
      
      // Create a consolidated update with the correct property structure
      // This matches the DatasetContextState interface properties
      const newState: Partial<{
        overview: any;
        processingStage: string;
        datasetId?: string;
        fileUrl?: string;
      }> = {
        overview: response.overview || (response.data && response.data.overview),
        processingStage: 'cleaned'
      };
      
      // Only update these if they exist in the response
      if (response.dataset_id || (response.data && response.data.dataset_id)) {
        newState.datasetId = response.dataset_id || (response.data && response.data.dataset_id);
      }
      
      if (response.file_url || (response.data && response.data.file_url)) {
        newState.fileUrl = response.file_url || (response.data && response.data.file_url);
      }
      
      // Update context with consolidated state changes
      updateState(newState);
      
      // Refresh the data preview with cleaned data
      await refreshDataPreview();
      
      toast({
        title: "Missing values processed",
        description: `Successfully handled missing values using ${strategy} strategy.`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Error handling missing values:', error);
      setError(error instanceof Error ? error.message : 'Failed to process missing values');
      
      toast({
        title: "Error processing missing values",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!datasetId || !overview) {
    return null;
  }

  return (
    <Card className="w-full mt-6 overflow-hidden border border-gray-100 shadow-md rounded-xl">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="flex items-center gap-2 text-xl text-primary">
          <BadgeAlert className="h-5 w-5" />
          Missing Values Analysis
        </CardTitle>
        <CardDescription>
          {hasMissingValues 
            ? `Your dataset has ${overview?.total_missing_values} missing values that need to be handled` 
            : processingStage === 'cleaned' 
              ? 'Missing values have been successfully handled'
              : `Your dataset doesn't have missing values`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasMissingValues ? (
          <div className="space-y-4">
            <Alert variant={overallMissingPercentage > 20 ? "destructive" : "warning"} className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Missing Data Summary</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <p>
                  Your dataset has <strong>{totalMissingCells}</strong> missing values out of <strong>{totalCells}</strong> cells ({overallMissingPercentage.toFixed(2)}% of data is missing).
                </p>
                <div className="w-full mt-1">
                  <Progress value={overallMissingPercentage} className="h-2" />
                  <p className="text-xs text-right mt-1">{overallMissingPercentage.toFixed(2)}% missing</p>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
                    <TableHead>Missing Values</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missingValueColumns.map(({ column, count, percentage }) => (
                    <TableRow key={column}>
                      <TableCell className="font-medium">{column}</TableCell>
                      <TableCell>{count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="h-2 w-24" />
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {percentage > 50 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            High
                          </span>
                        ) : percentage > 20 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Medium
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Low
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mt-4">
              <h4 className="text-sm font-medium mb-3">Select a strategy to handle missing values:</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Select
                            value={strategy}
                            onValueChange={(value) => setStrategy(value as ImputationStrategy)}
                            disabled={isLoading}
                          >
                            <SelectTrigger id="strategy">
                              <SelectValue placeholder="Select strategy" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(strategiesInfo).map(([key, info]) => {
                                const isEnabled = info.isEnabled(strategyAvailability);
                                return (
                                  <SelectItem 
                                    key={key} 
                                    value={key} 
                                    disabled={!isEnabled}
                                    className={!isEnabled ? "opacity-50" : ""}
                                  >
                                    {!isEnabled && <CircleSlash className="h-3.5 w-3.5 mr-1 text-muted-foreground inline" />}
                                    {info.label}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[220px] text-xs">
                          {!strategyAvailability.hasNumericalWithMissing && (
                            "Mean and median strategies are only available for numerical columns with missing values."
                          )}
                          {!strategyAvailability.hasAnyMissingValues && (
                            "Some strategies are disabled because your dataset has no missing values."
                          )}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="bg-white p-3 rounded-md border border-gray-200">
                  <h5 className="text-xs font-medium text-gray-700 mb-1">Strategy Description</h5>
                  <p className="text-xs text-gray-600">
                    {currentStrategyDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Alert variant="success" className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>All Data Is Complete</AlertTitle>
            <AlertDescription>
              {processingStage === 'cleaned' 
                ? 'Your dataset has been successfully processed. All missing values have been handled.'
                : 'Your dataset has no missing values. You can continue to the next step or explicitly mark it as processed.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 border-t border-gray-100 gap-2 flex justify-end">
        <Button 
          onClick={handleProcessMissingValues} 
          disabled={isLoading || !hasMissingValues}
          variant="default"
          size="lg"
          type="button"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          {isLoading ? 'Processing...' : processingStage === 'cleaned' 
            ? 'Re-process Missing Values' 
            : 'Process Missing Values'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MissingValueHandler;
