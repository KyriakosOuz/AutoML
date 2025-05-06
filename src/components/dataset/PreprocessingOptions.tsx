
import React, { useState, useMemo, useEffect } from 'react';
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

type NormalizationMethod = 'minmax' | 'standard' | 'robust' | 'log' | 'skip';
type BalanceStrategy = 'undersample' | 'oversample' | 'skip';
type UndersamplingMethod = 'random' | 'enn' | 'tomek' | 'ncr';
type OversamplingMethod = 'random' | 'smote' | 'borderline_smote' | 'adasyn' | 'smotenc';
type BalanceMethod = UndersamplingMethod | OversamplingMethod | 'none';

// Method descriptions for tooltips
interface MethodInfo {
  name: string;
  description: string;
  bestFor: string;
  limitations?: string;
}

const methodDescriptions: Record<string, MethodInfo> = {
  // Undersampling methods
  random_under: {
    name: 'Random Undersampling',
    description: 'Resamples randomly from the majority class.',
    bestFor: 'Simple datasets with many majority samples',
  },
  enn: {
    name: 'Edited Nearest Neighbors',
    description: 'Removes ambiguous samples using nearest neighbor voting.',
    bestFor: 'Datasets with noisy majority samples',
    limitations: 'Requires numerical features',
  },
  tomek: {
    name: 'Tomek Links',
    description: 'Cleans overlapping examples between classes.',
    bestFor: 'Datasets with class overlap',
    limitations: 'Requires numerical features',
  },
  ncr: {
    name: 'Neighborhood Cleaning Rule',
    description: 'Combines Tomek and ENN with more aggressive cleaning.',
    bestFor: 'Datasets with complex decision boundaries',
    limitations: 'Requires numerical features',
  },
  
  // Oversampling methods
  random_over: {
    name: 'Random Oversampling',
    description: 'Resamples randomly from the minority class.',
    bestFor: 'Simple datasets with few minority samples',
  },
  smote: {
    name: 'SMOTE',
    description: 'Generates synthetic samples using nearest neighbors.',
    bestFor: 'Datasets with numerical features',
    limitations: 'Numerical features only',
  },
  borderline_smote: {
    name: 'Borderline SMOTE',
    description: 'Focuses on difficult-to-classify minority samples.',
    bestFor: 'Datasets with complex decision boundaries',
    limitations: 'Numerical features only',
  },
  adasyn: {
    name: 'ADASYN',
    description: 'Generates more synthetic samples for harder cases (adaptive).',
    bestFor: 'Datasets with complex, imbalanced distributions',
    limitations: 'Numerical features only',
  },
  smotenc: {
    name: 'SMOTENC',
    description: 'SMOTE for mixed data (categorical + numerical).',
    bestFor: 'Mixed datasets with both categorical and numerical features',
    limitations: 'Requires both feature types',
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
  
  // Feature type detection for appropriate balancing methods
  const featureTypes = useMemo(() => {
    if (!previewData || !columnsToKeep) {
      console.log('No preview data or columns to keep for feature type detection');
      return {
        hasNumerical: false,
        hasCategorical: false,
        isMixed: false
      };
    }
    
    // Log raw data for debugging
    console.log('Feature type detection raw data:');
    console.log('- numerical_columns:', previewData.numerical_columns);
    console.log('- categorical_columns:', previewData.categorical_columns);
    console.log('- columnsToKeep:', columnsToKeep);
    
    const numericalFeatures = previewData.numerical_columns || [];
    const categoricalFeatures = previewData.categorical_columns || [];
    
    const selectedNumerical = columnsToKeep.filter(col => numericalFeatures.includes(col));
    const selectedCategorical = columnsToKeep.filter(col => categoricalFeatures.includes(col));
    
    const result = {
      hasNumerical: selectedNumerical.length > 0,
      hasCategorical: selectedCategorical.length > 0,
      isMixed: selectedNumerical.length > 0 && selectedCategorical.length > 0,
      numericalCount: selectedNumerical.length,
      categoricalCount: selectedCategorical.length
    };
    
    console.log('Feature types detected:', result);
    return result;
  }, [previewData, columnsToKeep]);

  // Effect to reset balance method when strategy changes
  useEffect(() => {
    if (balanceStrategy === 'undersample') {
      setBalanceMethod('random' as UndersamplingMethod);
    } else if (balanceStrategy === 'oversample') {
      setBalanceMethod('random' as OversamplingMethod);
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
        balanceStrategy === 'skip' ? 'skip' : `${balanceStrategy}:${balanceMethod}`
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

  // Get available balance method options based on feature types
  const getBalanceMethodOptions = () => {
    if (balanceStrategy === 'undersample') {
      return (
        <>
          <SelectItem value="random">
            <div className="flex items-center justify-between w-full pr-2">
              <span>Random Undersampling</span>
              <HoverCardTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </HoverCardTrigger>
            </div>
          </SelectItem>
          
          {featureTypes.hasNumerical && (
            <>
              <SelectItem value="enn" disabled={!featureTypes.hasNumerical}>
                <div className="flex items-center justify-between w-full pr-2">
                  <span>ENN (Edited Nearest Neighbors)</span>
                  <HoverCardTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                </div>
              </SelectItem>
              
              <SelectItem value="tomek" disabled={!featureTypes.hasNumerical}>
                <div className="flex items-center justify-between w-full pr-2">
                  <span>Tomek Links</span>
                  <HoverCardTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                </div>
              </SelectItem>
              
              <SelectItem value="ncr" disabled={!featureTypes.hasNumerical}>
                <div className="flex items-center justify-between w-full pr-2">
                  <span>NCR (Neighborhood Cleaning Rule)</span>
                  <HoverCardTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                </div>
              </SelectItem>
            </>
          )}
        </>
      );
    } else if (balanceStrategy === 'oversample') {
      return (
        <>
          <SelectItem value="random">
            <div className="flex items-center justify-between w-full pr-2">
              <span>Random Oversampling</span>
              <HoverCardTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </HoverCardTrigger>
            </div>
          </SelectItem>
          
          {featureTypes.hasNumerical && !featureTypes.hasCategorical && (
            <>
              <SelectItem value="smote">
                <div className="flex items-center justify-between w-full pr-2">
                  <span>SMOTE</span>
                  <HoverCardTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                </div>
              </SelectItem>
              
              <SelectItem value="borderline_smote">
                <div className="flex items-center justify-between w-full pr-2">
                  <span>Borderline SMOTE</span>
                  <HoverCardTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                </div>
              </SelectItem>
              
              <SelectItem value="adasyn">
                <div className="flex items-center justify-between w-full pr-2">
                  <span>ADASYN</span>
                  <HoverCardTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                </div>
              </SelectItem>
            </>
          )}
          
          {featureTypes.isMixed && (
            <SelectItem value="smotenc">
              <div className="flex items-center justify-between w-full pr-2">
                <span>SMOTENC</span>
                <HoverCardTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </HoverCardTrigger>
              </div>
            </SelectItem>
          )}
        </>
      );
    }
    return null;
  };

  // Get the appropriate method info for the current selection
  const getCurrentMethodInfo = (): MethodInfo | undefined => {
    if (balanceStrategy === 'undersample') {
      return methodDescriptions[`${balanceMethod === 'random' ? 'random_under' : balanceMethod}`];
    } else if (balanceStrategy === 'oversample') {
      return methodDescriptions[`${balanceMethod === 'random' ? 'random_over' : balanceMethod}`];
    }
    return undefined;
  };

  if (!datasetId || !taskType || !columnsToKeep || columnsToKeep.length === 0) {
    return null;
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Preprocess Dataset</CardTitle>
        <CardDescription>
          Apply normalization and balancing techniques to prepare your data for modeling
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
        
        {debugInfo && (
          <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">{debugInfo}</AlertDescription>
          </Alert>
        )}
        
        {isLoadingPreview && (
          <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">Loading dataset preview data...</AlertDescription>
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
                      disabled={!hasNumericalToNormalize || isLoadingPreview}
                    >
                      <SelectTrigger className="w-full" aria-disabled={!hasNumericalToNormalize || isLoadingPreview}>
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
            <h4 className="font-medium mb-2">Balance Classes</h4>
            
            {!isClassification && (
              <Alert className="mb-4 bg-amber-50 border-amber-200">
                <InfoIcon className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-700">
                  Class balancing is only applicable to classification tasks (binary or multiclass), not regression.
                </AlertDescription>
              </Alert>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select
                      value={balanceStrategy}
                      onValueChange={(value) => setBalanceStrategy(value as BalanceStrategy)}
                      disabled={!isClassification || isLoadingPreview}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select balance strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip Balancing</SelectItem>
                        <SelectItem value="undersample">Undersampling</SelectItem>
                        <SelectItem value="oversample">Oversampling</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                {!isClassification && (
                  <TooltipContent>
                    <p>Balancing is only supported for classification tasks, not regression.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs text-gray-500 mt-1">
              {balanceStrategy === 'undersample' && 'Reduces samples from majority classes to balance class distribution'}
              {balanceStrategy === 'oversample' && 'Increases samples in minority classes through duplication or synthetic generation'}
              {balanceStrategy === 'skip' && 'No class balancing will be applied'}
              {!isClassification && 'Class balancing is only applicable for classification tasks'}
            </p>
            
            {(balanceStrategy === 'undersample' || balanceStrategy === 'oversample') && isClassification && (
              <div className="mt-4">
                <h4 className="font-medium mb-2 text-sm">Balancing Method</h4>
                <div className="relative">
                  <HoverCard>
                    <Select
                      value={balanceMethod}
                      onValueChange={(value) => setBalanceMethod(value as BalanceMethod)}
                      disabled={!isClassification || isLoadingPreview}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select balancing method" />
                      </SelectTrigger>
                      <SelectContent className="relative">
                        {getBalanceMethodOptions()}
                      </SelectContent>
                    </Select>
                    
                    {/* Rich hover card content for method info */}
                    <HoverCardContent className="w-80">
                      {getCurrentMethodInfo() && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm">{getCurrentMethodInfo()?.name}</h5>
                          <p className="text-sm">{getCurrentMethodInfo()?.description}</p>
                          <div className="pt-2">
                            <span className="text-xs font-medium">Best for: </span>
                            <span className="text-xs">{getCurrentMethodInfo()?.bestFor}</span>
                          </div>
                          {getCurrentMethodInfo()?.limitations && (
                            <div>
                              <span className="text-xs font-medium text-amber-700">Limitations: </span>
                              <span className="text-xs text-amber-700">{getCurrentMethodInfo()?.limitations}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handlePreprocess} 
          disabled={isLoading || isLoadingPreview}
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
