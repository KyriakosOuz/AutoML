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

  // Improved method options with updated tooltip logic
  const getBalanceMethodOptions = () => {
    if (balanceStrategy === 'undersample') {
      return (
        <>
          {/* Random Undersampling - always enabled */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="random">
                Random Undersampling
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.random_under.name}</h5>
                <p className="text-sm">{methodDescriptions.random_under.tooltip}</p>
                <div className="bg-green-50 border border-green-100 rounded p-1 mt-1">
                  <span className="text-xs text-green-700">Works with any data types</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          
          {/* ENN method - requires numerical features */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="enn" disabled={!featureTypes.hasNumerical}>
                ENN (Edited Nearest Neighbors)
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.enn.name}</h5>
                <p className="text-sm">{methodDescriptions.enn.tooltip}</p>
                <div className="bg-amber-50 border border-amber-100 rounded p-1 mt-1">
                  <span className="text-xs text-amber-700">Requires numerical features</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          
          {/* Tomek Links method - requires numerical features */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="tomek" disabled={!featureTypes.hasNumerical}>
                Tomek Links
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.tomek.name}</h5>
                <p className="text-sm">{methodDescriptions.tomek.tooltip}</p>
                <div className="bg-amber-50 border border-amber-100 rounded p-1 mt-1">
                  <span className="text-xs text-amber-700">Requires numerical features</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          
          {/* NCR method - requires numerical features */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="ncr" disabled={!featureTypes.hasNumerical}>
                NCR (Neighborhood Cleaning Rule)
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.ncr.name}</h5>
                <p className="text-sm">{methodDescriptions.ncr.tooltip}</p>
                <div className="bg-amber-50 border border-amber-100 rounded p-1 mt-1">
                  <span className="text-xs text-amber-700">Requires numerical features</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </>
      );
    } else if (balanceStrategy === 'oversample') {
      return (
        <>
          {/* Random Oversampling - always enabled */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="random">
                Random Oversampling
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.random_over.name}</h5>
                <p className="text-sm">{methodDescriptions.random_over.tooltip}</p>
                <div className="bg-green-50 border border-green-100 rounded p-1 mt-1">
                  <span className="text-xs text-green-700">Works with any data types</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          
          {/* SMOTE - requires numerical features */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="smote" disabled={!featureTypes.hasNumerical}>
                SMOTE
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.smote.name}</h5>
                <p className="text-sm">{methodDescriptions.smote.tooltip}</p>
                <div className="bg-amber-50 border border-amber-100 rounded p-1 mt-1">
                  <span className="text-xs text-amber-700">Requires numerical features</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          
          {/* Borderline SMOTE - requires numerical features */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="borderline_smote" disabled={!featureTypes.hasNumerical}>
                Borderline SMOTE
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.borderline_smote.name}</h5>
                <p className="text-sm">{methodDescriptions.borderline_smote.tooltip}</p>
                <div className="bg-amber-50 border border-amber-100 rounded p-1 mt-1">
                  <span className="text-xs text-amber-700">Requires numerical features</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          
          {/* ADASYN - requires numerical features */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="adasyn" disabled={!featureTypes.hasNumerical}>
                ADASYN
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.adasyn.name}</h5>
                <p className="text-sm">{methodDescriptions.adasyn.tooltip}</p>
                <div className="bg-amber-50 border border-amber-100 rounded p-1 mt-1">
                  <span className="text-xs text-amber-700">Requires numerical features</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          
          {/* SMOTENC - requires mixed features (numerical and categorical) */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <SelectItem value="smotenc" disabled={!featureTypes.isMixed}>
                SMOTENC
              </SelectItem>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="right">
              <div className="space-y-2">
                <h5 className="font-semibold text-sm">{methodDescriptions.smotenc.name}</h5>
                <p className="text-sm">{methodDescriptions.smotenc.tooltip}</p>
                <div className="bg-cyan-50 border border-cyan-100 rounded p-1 mt-1">
                  <span className="text-xs text-cyan-700">Requires both categorical and numerical features</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </>
      );
    }
    return null;
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
                  <Select
                    value={balanceMethod}
                    onValueChange={(value) => setBalanceMethod(value as BalanceMethod)}
                    disabled={!isClassification || isLoadingPreview}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select balancing method" />
                    </SelectTrigger>
                    <SelectContent className="relative z-50">
                      {getBalanceMethodOptions()}
                    </SelectContent>
                  </Select>
                  
                  {/* Feature type detection info */}
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    {featureTypes.hasNumerical && featureTypes.hasCategorical && (
                      <div className="px-2 py-1 bg-blue-50 border border-blue-100 rounded">
                        <span className="font-medium">Dataset type:</span> Mixed (numerical + categorical)
                      </div>
                    )}
                    {featureTypes.hasNumerical && !featureTypes.hasCategorical && (
                      <div className="px-2 py-1 bg-blue-50 border border-blue-100 rounded">
                        <span className="font-medium">Dataset type:</span> Numerical only
                      </div>
                    )}
                    {!featureTypes.hasNumerical && featureTypes.hasCategorical && (
                      <div className="px-2 py-1 bg-blue-50 border border-blue-100 rounded">
                        <span className="font-medium">Dataset type:</span> Categorical only
                      </div>
                    )}
                    
                    {balanceStrategy === 'undersample' && balanceMethod !== 'random' && !featureTypes.hasNumerical && (
                      <p className="text-amber-500">This method requires numerical features which are not present in your selected columns.</p>
                    )}
                    {balanceStrategy === 'oversample' && balanceMethod !== 'random' && balanceMethod !== 'smotenc' && !featureTypes.hasNumerical && (
                      <p className="text-amber-500">This method requires numerical features which are not present in your selected columns.</p>
                    )}
                    {balanceStrategy === 'oversample' && balanceMethod === 'smotenc' && !featureTypes.isMixed && (
                      <p className="text-amber-500">SMOTENC requires both numerical and categorical features.</p>
                    )}
                  </div>
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
