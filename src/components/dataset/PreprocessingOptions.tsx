import React, { useState, useMemo, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Sparkles, InfoIcon } from 'lucide-react';
import { 
  TooltipProvider, 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

// Import the components we need for balance strategy and method selection
import BalanceStrategySelector, { BalanceStrategy } from './preprocessing/BalanceStrategySelector';
import BalanceMethodSelector, { BalanceMethod } from './preprocessing/BalanceMethodSelector';

// Define types properly to avoid type comparison issues
type NormalizationMethod = 'minmax' | 'standard' | 'robust' | 'log' | 'skip';
type BalanceStrategy = 'undersample' | 'oversample' | 'skip';
type UndersamplingMethod = 'random' | 'enn' | 'tomek' | 'ncr';
type OversamplingMethod = 'random' | 'smote' | 'borderline_smote' | 'adasyn' | 'smotenc';
type BalanceMethod = UndersamplingMethod | OversamplingMethod | 'none';

// Method descriptions for tooltips based on the provided specifications
interface MethodInfo {
  name: string;
  description: string;
  requiresNumerical: boolean;
  requiresMixed: boolean;
  tooltip: string;
}

const methodDescriptions: Record<string, MethodInfo> = {
  // Undersampling methods
  random_under: {
    name: 'Random Undersampling',
    description: 'Randomly removes samples from majority classes until classes are balanced.',
    requiresNumerical: false,
    requiresMixed: false,
    tooltip: "Works with any data type by randomly duplicating or removing samples."
  },
  enn: {
    name: 'Edited Nearest Neighbors',
    description: 'Removes majority samples whose class differs from the class of their nearest neighbors.',
    requiresNumerical: true,
    requiresMixed: false,
    tooltip: "Removes ambiguous samples using nearest neighbors. Requires numerical features."
  },
  tomek: {
    name: 'Tomek Links',
    description: 'Identifies and removes majority samples that form "Tomek links" (pairs of closest samples from different classes).',
    requiresNumerical: true,
    requiresMixed: false,
    tooltip: "Removes overlapping samples. Requires numerical features."
  },
  ncr: {
    name: 'Neighborhood Cleaning Rule',
    description: 'Combines ENN with additional cleaning rules to remove more majority samples.',
    requiresNumerical: true,
    requiresMixed: false,
    tooltip: "Cleans noisy data by removing mislabeled examples. Requires numerical features."
  },
  
  // Oversampling methods
  random_over: {
    name: 'Random Oversampling',
    description: 'Creates exact duplicates of minority class samples.',
    requiresNumerical: false,
    requiresMixed: false,
    tooltip: "Works with any data type by randomly duplicating or removing samples."
  },
  smote: {
    name: 'SMOTE',
    description: 'Creates synthetic samples along the line segments joining minority class neighbors.',
    requiresNumerical: true,
    requiresMixed: false,
    tooltip: "Requires numerical features. Creates synthetic samples using distance-based interpolation."
  },
  borderline_smote: {
    name: 'Borderline SMOTE',
    description: 'Creates synthetic samples specifically for minority samples near the class boundary.',
    requiresNumerical: true,
    requiresMixed: false,
    tooltip: "Like SMOTE, but focuses on borderline examples. Requires numerical features."
  },
  adasyn: {
    name: 'ADASYN',
    description: 'Generates more synthetic samples for minority instances that are harder to learn.',
    requiresNumerical: true,
    requiresMixed: false,
    tooltip: "Generates more synthetic data for harder examples. Requires numerical features."
  },
  smotenc: {
    name: 'SMOTENC',
    description: 'SMOTE adaptation for datasets with mixed numerical and categorical features.',
    requiresNumerical: true,
    requiresMixed: true,
    tooltip: "Handles both numerical and categorical features. Use only if dataset is mixed."
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
  
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  // Extract information about columns from preview data response
  const numericalColumns = previewData?.numerical_columns || [];
  const categoricalColumns = previewData?.categorical_columns || [];
  
  // Debug logging to identify what's happening
  useEffect(() => {
    console.log('PreprocessingOptions - Preview data:', previewData);
    console.log('PreprocessingOptions - Columns to keep:', columnsToKeep);
    console.log('PreprocessingOptions - Overview data_types:', overview?.data_types);
    console.log('PreprocessingOptions - numerical_columns:', numericalColumns);
    console.log('PreprocessingOptions - categorical_columns:', categoricalColumns);
  }, [previewData, columnsToKeep, overview?.data_types, numericalColumns, categoricalColumns]);
  
  // Fetch preview data to get accurate column information
  useEffect(() => {
    const fetchPreviewData = async () => {
      if (!datasetId) return;
      
      try {
        setIsLoadingPreview(true);
        const response = await datasetApi.previewDataset(datasetId, 'final');
        console.log('Preview API response:', response);
        
        // Handle both direct response and nested data
        const data = response.data || response;
        setPreviewData(data);
      } catch (error) {
        console.error('Error fetching preview data:', error);
      } finally {
        setIsLoadingPreview(false);
      }
    };
    
    fetchPreviewData();
  }, [datasetId]);

  // Determine if normalization should be enabled based on preview data
  const hasNumericalToNormalize = useMemo(() => {
    if (!previewData || !columnsToKeep) {
      console.log('No preview data or columns to keep available');
      return false;
    }

    // Check if any of the columns to keep are in the numerical_columns from preview
    const hasNumerical = columnsToKeep.some(col => 
      (previewData.numerical_columns || []).includes(col)
    );
    
    console.log('Has numerical columns to normalize:', hasNumerical);
    return hasNumerical && previewData.numerical_features > 0;
  }, [previewData, columnsToKeep]);

  // Initialize normalization method - default to minmax only when initializing
  const [normalizationMethod, setNormalizationMethod] = useState<NormalizationMethod>('minmax');
  
  // Only set a default when component first mounts and data is loaded
  useEffect(() => {
    if (hasNumericalToNormalize && normalizationMethod === 'skip') {
      // Set initial default only if not explicitly chosen by user
      console.log('Setting initial default normalization method to minmax');
      setNormalizationMethod('minmax');
      setDebugInfo(null);
    } else if (!hasNumericalToNormalize) {
      console.log('No numerical features detected, defaulting to skip');
      setNormalizationMethod('skip');
      setDebugInfo('Normalization disabled: No numerical features detected in selected columns');
    }
  }, [hasNumericalToNormalize]); // Only run when hasNumericalToNormalize changes, not when normalizationMethod changes
  
  // Enhanced balance strategy state
  const [balanceStrategy, setBalanceStrategy] = useState<BalanceStrategy>('skip');
  const [balanceMethod, setBalanceMethod] = useState<BalanceMethod>('random');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Debug message for UI feedback
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const isClassification = taskType === 'binary_classification' || taskType === 'multiclass_classification';
  
  // Feature type detection for appropriate balancing methods using direct API response
  const featureTypes = useMemo(() => {
    if (!previewData) {
      console.log('No preview data available for feature type detection');
      return {
        hasNumerical: false,
        hasCategorical: false,
        isMixed: false
      };
    }
    
    // Direct usage of numerical_columns and categorical_columns from API
    const numericalFeatures = previewData.numerical_columns || [];
    const categoricalFeatures = previewData.categorical_columns || [];
    
    const hasNumerical = numericalFeatures.length > 0;
    const hasCategorical = categoricalFeatures.length > 0;
    const isMixed = hasNumerical && hasCategorical;
    
    const result = {
      hasNumerical,
      hasCategorical,
      isMixed,
      numericalCount: numericalFeatures.length,
      categoricalCount: categoricalFeatures.length
    };
    
    console.log('Feature types detected:', result);
    return result;
  }, [previewData]);

  // Effect to reset balance method when strategy changes
  useEffect(() => {
    if (balanceStrategy === 'undersample') {
      setBalanceMethod('random' as BalanceMethod);
    } else if (balanceStrategy === 'oversample') {
      setBalanceMethod('random' as BalanceMethod);
    } else {
      setBalanceMethod('none');
    }
  }, [balanceStrategy]);

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
      setDebugInfo(null);
      
      const response = await datasetApi.preprocessDataset(
        datasetId,
        normalizationMethod,
        balanceStrategy,
        balanceStrategy !== 'skip' ? balanceMethod : undefined
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Sparkles className="h-4 w-4 mr-2 text-primary" />
            Preprocessing Options
          </CardTitle>
          <CardDescription>
            Apply transformations to prepare your data for better model performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Normalization/Scaling Section */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              Feature Scaling
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 ml-1 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Scaling puts numerical features on a similar scale for better model performance
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
            <Select 
              value={normalizationMethod} 
              onValueChange={(v) => setNormalizationMethod(v as NormalizationMethod)}
              disabled={!hasNumericalToNormalize || isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select scaling method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minmax">Min-Max Scaling (0-1 range)</SelectItem>
                <SelectItem value="standard">Standard Scaling (Z-score)</SelectItem>
                <SelectItem value="robust">Robust Scaling (handles outliers)</SelectItem>
                <SelectItem value="log">Log Transformation</SelectItem>
                <SelectItem value="skip">Skip Scaling</SelectItem>
              </SelectContent>
            </Select>
            {!hasNumericalToNormalize && (
              <p className="text-xs text-amber-600 mt-1">
                No numerical features detected for scaling
              </p>
            )}
          </div>
          
          <Separator />
          
          {/* Class Balancing Section - Only for classification */}
          {isClassification && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                Class Balancing
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 ml-1 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Balances classes for better performance on imbalanced datasets
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h3>
              <div className="space-y-3">
                {/* Use the BalanceStrategySelector component for strategy selection */}
                <BalanceStrategySelector
                  value={balanceStrategy}
                  onChange={setBalanceStrategy}
                  isClassification={isClassification}
                  isLoading={isLoading}
                />
                
                {/* Use the BalanceMethodSelector component for method selection */}
                {balanceStrategy !== 'skip' && (
                  <BalanceMethodSelector
                    balanceStrategy={balanceStrategy}
                    balanceMethod={balanceMethod}
                    onChange={setBalanceMethod}
                    featureTypes={featureTypes}
                    isClassification={isClassification}
                    isLoading={isLoading}
                  />
                )}
              </div>
            </div>
          )}
          
          {/* Debug Information */}
          {debugInfo && (
            <Alert variant="warning" className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 text-xs">
                {debugInfo}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Success Message */}
          {success && (
            <Alert variant="success" className="bg-green-50 border-green-200">
              <Sparkles className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-end">
            <Button 
              onClick={handlePreprocess} 
              disabled={isLoading}
              className="bg-primary text-white"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Apply Preprocessing
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreprocessingOptions;
