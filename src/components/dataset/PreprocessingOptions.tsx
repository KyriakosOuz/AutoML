
import React, { useState, useMemo } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Sparkles, CircleSlash } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type NormalizationMethod = 'minmax' | 'standard' | 'robust' | 'log' | 'skip';
type BalanceStrategy = 'undersample' | 'smote' | 'skip';
type ImputationStrategy = 'mean' | 'median' | 'mode' | 'hot_deck' | 'drop' | 'skip';

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

const PreprocessingOptions: React.FC = () => {
  const { 
    datasetId, 
    taskType,
    updateState,
    columnsToKeep,
    overview
  } = useDataset();
  
  const [normalizationMethod, setNormalizationMethod] = useState<NormalizationMethod>('minmax');
  const [balanceStrategy, setBalanceStrategy] = useState<BalanceStrategy>('skip');
  const [imputationStrategy, setImputationStrategy] = useState<ImputationStrategy>('skip');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Extract information about columns and missing values
  const numericalFeatures = overview?.numerical_features || [];
  const categoricalFeatures = overview?.categorical_features || [];
  const missingValuesCount = overview?.missing_values_count || {};

  // Calculate which strategies should be enabled
  const strategyAvailability = useMemo(() => {
    // Check if we have numerical columns with missing values
    const hasNumericalWithMissing = numericalFeatures.some(col => {
      return (missingValuesCount[col] || 0) > 0;
    });

    // Check if we have categorical columns with missing values
    const hasCategoricalWithMissing = categoricalFeatures.some(col => {
      return (missingValuesCount[col] || 0) > 0;
    });

    // Check if we have any missing values at all
    const hasAnyMissingValues = overview?.total_missing_values 
      ? overview.total_missing_values > 0 
      : Object.values(missingValuesCount).some(count => count > 0);

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
  }, [numericalFeatures, categoricalFeatures, missingValuesCount, overview]);

  const hasNumericalToNormalize = useMemo(() => {
    return columnsToKeep?.some(col => numericalFeatures.includes(col)) || false;
  }, [columnsToKeep, numericalFeatures]);

  const isClassification = taskType === 'binary_classification' || taskType === 'multiclass_classification';
  
  const hasNumericalForSmote = useMemo(() => {
    return columnsToKeep?.some(col => numericalFeatures.includes(col)) || false;
  }, [columnsToKeep, numericalFeatures]);

  // Get the current strategy description
  const currentStrategyDescription = useMemo(() => {
    return strategiesInfo[imputationStrategy]?.description || '';
  }, [imputationStrategy]);

  const handlePreprocess = async () => {
    if (!datasetId) {
      setError('No dataset selected');
      return;
    }

    if (!columnsToKeep || columnsToKeep.length === 0) {
      setError('You need to save your feature selection first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await datasetApi.preprocessDataset(
        datasetId,
        normalizationMethod,
        balanceStrategy
      );
      
      // CRITICAL FIX: Just update the processingStage to 'processed'
      // This preserves all other state data and prevents tab navigation from breaking
      updateState({
        processingStage: 'processed'
      });
      
      // Extract message from the appropriate location in the response
      const responseData = response.data || response;
      const message = responseData.message || response.message || 'Data preprocessing completed successfully';
      setSuccess(message);
      
    } catch (error) {
      console.error('Error preprocessing dataset:', error);
      setError(error instanceof Error ? error.message : 'Failed to preprocess dataset');
    } finally {
      setIsLoading(false);
    }
  };

  if (!datasetId || !taskType || !columnsToKeep || columnsToKeep.length === 0) {
    return null;
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Preprocess Dataset</CardTitle>
        <CardDescription>
          Apply normalization, balancing, and missing value handling techniques to prepare your data for modeling
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <Sparkles className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Normalization</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select
                      value={normalizationMethod}
                      onValueChange={(value) => setNormalizationMethod(value as NormalizationMethod)}
                      disabled={!hasNumericalToNormalize}
                    >
                      <SelectTrigger className="w-full" aria-disabled={!hasNumericalToNormalize}>
                        <SelectValue placeholder="Select normalization method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minmax">Min-Max Scaling</SelectItem>
                        <SelectItem value="standard">Standard Scaling (Z-score)</SelectItem>
                        <SelectItem value="robust">Robust Scaling</SelectItem>
                        <SelectItem value="log">Log Transformation</SelectItem>
                        <SelectItem value="skip">Skip Normalization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                {!hasNumericalToNormalize && (
                  <TooltipContent>
                    <p>Normalization is disabled because no numerical features are selected.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs text-gray-500 mt-1">
              {normalizationMethod === 'minmax' && 'Scales features to a range of [0,1]'}
              {normalizationMethod === 'standard' && 'Transforms features to have mean=0 and variance=1'}
              {normalizationMethod === 'robust' && 'Uses median and IQR, less sensitive to outliers'}
              {normalizationMethod === 'log' && 'Applies log transformation to handle skewed data'}
              {normalizationMethod === 'skip' && 'No normalization will be applied'}
            </p>
          </div>
          
          <Separator />

          <div>
            <h4 className="font-medium mb-2">Missing Value Strategy</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {Object.entries(strategiesInfo).map(([key, info]) => {
                const strategyKey = key as ImputationStrategy;
                const isEnabled = info.isEnabled(strategyAvailability);
                
                return (
                  <TooltipProvider key={strategyKey}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => isEnabled && setImputationStrategy(strategyKey)}
                            className={`
                              flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md w-full
                              ${isEnabled
                                ? imputationStrategy === strategyKey
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80'
                                : 'bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60'
                              }
                            `}
                            disabled={!isEnabled}
                          >
                            {!isEnabled && <CircleSlash className="h-3.5 w-3.5 mr-1 text-muted-foreground" />}
                            {info.label}
                          </button>
                        </div>
                      </TooltipTrigger>
                      {!isEnabled && (
                        <TooltipContent>
                          <p>This strategy is not applicable with your current data.</p>
                          {strategyKey === 'mean' || strategyKey === 'median' ? (
                            <p className="text-xs">Requires numerical columns with missing values.</p>
                          ) : strategyKey === 'hot_deck' || strategyKey === 'drop' ? (
                            <p className="text-xs">Requires at least one column with missing values.</p>
                          ) : null}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
            <div className="bg-muted/30 p-3 rounded-md mt-2 min-h-[60px]">
              <p className="text-sm">{currentStrategyDescription}</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Balance Classes</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select
                      value={balanceStrategy}
                      onValueChange={(value) => setBalanceStrategy(value as BalanceStrategy)}
                      disabled={!isClassification || balanceStrategy === 'smote' && !hasNumericalForSmote}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select balance strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="undersample">Undersampling</SelectItem>
                        <SelectItem 
                          value="smote" 
                          disabled={!hasNumericalForSmote}
                        >
                          SMOTE (Synthetic Minority Over-sampling)
                        </SelectItem>
                        <SelectItem value="skip">Skip Balancing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                {!isClassification ? (
                  <TooltipContent>
                    <p>Balancing is only supported for classification tasks, not regression.</p>
                  </TooltipContent>
                ) : balanceStrategy === 'smote' && !hasNumericalForSmote ? (
                  <TooltipContent>
                    <p>SMOTE requires numerical features. It can't be applied if none are selected.</p>
                  </TooltipContent>
                ) : null}
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs text-gray-500 mt-1">
              {balanceStrategy === 'undersample' && 'Reduces samples from majority classes to match minority class'}
              {balanceStrategy === 'smote' && 'Creates synthetic samples for minority classes (requires numerical features)'}
              {balanceStrategy === 'skip' && 'No class balancing will be applied'}
              {!isClassification && 'Class balancing is only applicable for classification tasks'}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handlePreprocess} 
          disabled={isLoading}
          className="w-full"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isLoading ? 'Processing...' : 'Preprocess Dataset'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PreprocessingOptions;
