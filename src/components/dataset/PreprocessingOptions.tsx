
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
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type NormalizationMethod = 'minmax' | 'standard' | 'robust' | 'log' | 'skip';
type BalanceStrategy = 'undersample' | 'oversample' | 'skip';
type UndersamplingMethod = 'random' | 'enn' | 'tomek' | 'ncr';
type OversamplingMethod = 'random' | 'smote' | 'bsmote' | 'adasyn';
type BalanceMethod = UndersamplingMethod | OversamplingMethod | 'none';

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
    console.log('Preview data:', previewData);
    console.log('Columns to keep:', columnsToKeep);
    console.log('Overview data_types:', overview?.data_types);
  }, [previewData, columnsToKeep, overview?.data_types]);
  
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
  
  const hasNumericalForSmote = useMemo(() => {
    if (!previewData || !columnsToKeep) return false;
    
    // Check if any of the kept columns are in the numerical columns from preview data
    return columnsToKeep.some(col => 
      (previewData.numerical_columns || []).includes(col)
    );
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
      
      // FIX: Update the API call to use the correct number of arguments
      // We need to modify our API call to match what's expected
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

  const getBalanceMethodOptions = () => {
    if (balanceStrategy === 'undersample') {
      return (
        <>
          <SelectItem value="random">Random Undersampling</SelectItem>
          <SelectItem value="enn">ENN (Edited Nearest Neighbors)</SelectItem>
          <SelectItem value="tomek">Tomek Links</SelectItem>
          <SelectItem value="ncr">NCR (Neighborhood Cleaning Rule)</SelectItem>
        </>
      );
    } else if (balanceStrategy === 'oversample') {
      return (
        <>
          <SelectItem value="random">Random Oversampling</SelectItem>
          <SelectItem value="smote">SMOTE</SelectItem>
          <SelectItem value="bsmote">Borderline SMOTE</SelectItem>
          <SelectItem value="adasyn">ADASYN</SelectItem>
        </>
      );
    }
    return null;
  };

  const getBalanceMethodDescription = () => {
    if (balanceStrategy === 'undersample') {
      switch (balanceMethod) {
        case 'random':
          return 'Randomly removes samples from majority classes';
        case 'enn':
          return 'Removes samples whose class differs from the majority of their neighbors';
        case 'tomek':
          return 'Removes points that form Tomek links to clean decision boundaries';
        case 'ncr':
          return 'Combines ENN and Condensed NN to remove noisy points';
        default:
          return '';
      }
    } else if (balanceStrategy === 'oversample') {
      switch (balanceMethod) {
        case 'random':
          return 'Randomly duplicates samples from minority classes';
        case 'smote':
          return 'Creates synthetic examples from existing minority samples';
        case 'bsmote':
          return 'Focuses synthetic generation near decision boundaries';
        case 'adasyn':
          return 'Generates more samples in difficult-to-learn regions';
        default:
          return '';
      }
    }
    return '';
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
            
            {/* FIX: Fixed comparison below to check if balanceStrategy is not 'skip' instead of comparing to 'undersample' | 'oversample' */}
            {balanceStrategy !== 'skip' && isClassification && (
              <div className="mt-4">
                <h4 className="font-medium mb-2 text-sm">Balancing Method</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Select
                          value={balanceMethod}
                          onValueChange={(value) => setBalanceMethod(value as BalanceMethod)}
                          disabled={!isClassification || isLoadingPreview || balanceStrategy === 'skip'}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select balancing method" />
                          </SelectTrigger>
                          <SelectContent>
                            {getBalanceMethodOptions()}
                          </SelectContent>
                        </Select>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select a specific algorithm for the chosen balancing strategy.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <p className="text-xs text-gray-500 mt-1">
                  {getBalanceMethodDescription()}
                </p>
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
