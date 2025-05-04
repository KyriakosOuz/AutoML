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
import { AlertCircle, Sparkles, Info } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type NormalizationMethod = 'minmax' | 'standard' | 'robust' | 'log' | 'skip';
type BalanceStrategy = 'undersample' | 'smote' | 'skip';

const PreprocessingOptions: React.FC = () => {
  const { 
    datasetId, 
    taskType,
    updateState,
    columnsToKeep,
    overview,
    processingStage,
    fileUrls
  } = useDataset();
  
  // Extract information about columns with proper debug info
  const numericalFeatures = useMemo(() => {
    const features = overview?.numerical_features || [];
    console.log('Numerical features from overview:', features);
    setDebugInfo(prev => prev + `\nNumerical features: ${JSON.stringify(features)}`);
    return features;
  }, [overview?.numerical_features]);

  // Check if we have numerical features to normalize by comparing with columnsToKeep
  const hasNumericalToNormalize = useMemo(() => {
    // Convert arrays to sets for faster intersection calculation
    const keepSet = new Set(columnsToKeep || []);
    const numFeatures = Array.isArray(numericalFeatures) ? numericalFeatures : [];
    
    // Find intersection between columnsToKeep and numerical features
    const hasNumerical = numFeatures.some(col => keepSet.has(col));
    
    console.log('Has numerical features to normalize:', {
      keepSet: [...keepSet],
      numFeatures,
      hasNumerical
    });
    
    setDebugInfo(prev => prev + `\nhasNumericalToNormalize: ${hasNumerical}`);
    return hasNumerical;
  }, [columnsToKeep, numericalFeatures]);

  // Set initial normalization method based on numerical features availability
  const [normalizationMethod, setNormalizationMethod] = useState<NormalizationMethod>(
    hasNumericalToNormalize ? 'minmax' : 'skip'
  );
  
  const [balanceStrategy, setBalanceStrategy] = useState<BalanceStrategy>('skip');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Add useEffect to update normalization method if numerical features availability changes
  useEffect(() => {
    // If no numerical features are available, set normalization method to 'skip'
    if (!hasNumericalToNormalize && normalizationMethod !== 'skip') {
      console.log('No numerical features to normalize, setting method to skip');
      setNormalizationMethod('skip');
    }
  }, [hasNumericalToNormalize, normalizationMethod]);

  // Add useEffect to debug when columnsToKeep changes
  useEffect(() => {
    console.log('columnsToKeep updated:', columnsToKeep);
    setDebugInfo(prev => prev + `\nColumnsToKeep: ${JSON.stringify(columnsToKeep)}`);
  }, [columnsToKeep]);

  const isClassification = taskType === 'binary_classification' || taskType === 'multiclass_classification';
  
  const hasNumericalForSmote = useMemo(() => {
    return hasNumericalToNormalize;
  }, [hasNumericalToNormalize]);

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
      
      // Handle file URLs from response
      if (response.data?.file_urls) {
        console.log('Preprocess response file_urls:', response.data.file_urls);
        updateState({
          fileUrls: response.data.file_urls,
          processingStage: 'processed'
        });
      } else {
        // If no file URLs, just update the processing stage
        updateState({
          processingStage: 'processed'
        });
      }
      
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
          Apply normalization and balancing techniques to prepare your data for modeling
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Debug information - only visible during development */}
        <details className="mb-4 p-2 bg-gray-50 text-xs border rounded">
          <summary className="cursor-pointer font-medium">Debug Info</summary>
          <div className="mt-2 whitespace-pre-wrap">
            <p>processingStage: {processingStage}</p>
            <p>hasNumericalToNormalize: {String(hasNumericalToNormalize)}</p>
            <p>columnsToKeep: {JSON.stringify(columnsToKeep)}</p>
            <p>numericalFeatures: {
              Array.isArray(numericalFeatures) 
                ? JSON.stringify(numericalFeatures) 
                : String(numericalFeatures)
            }</p>
            <p>overview: {JSON.stringify(overview, null, 2)}</p>
            {debugInfo}
          </div>
        </details>
      
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
