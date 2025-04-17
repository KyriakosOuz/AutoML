
import React, { useState, useEffect } from 'react';
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
    targetColumn
  } = useDataset();
  
  const [normalizationMethod, setNormalizationMethod] = useState<NormalizationMethod>('minmax');
  const [balanceStrategy, setBalanceStrategy] = useState<BalanceStrategy>('skip');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isClassification = taskType === 'binary_classification' || taskType === 'multiclass_classification';
  
  // Extract numerical features from overview
  const numericalFeatures = overview?.numerical_features || [];
  
  // Determine if there are numerical features to normalize
  const hasNumericalToNormalize = columnsToKeep && 
    numericalFeatures.some(f => columnsToKeep.includes(f));
    
  // Check if dataset has numerical features for SMOTE
  const hasNumericalForSmote = columnsToKeep && 
    numericalFeatures.some(f => columnsToKeep.includes(f));
    
  // Reset balancing strategy if SMOTE is selected but no numerical features
  useEffect(() => {
    if (balanceStrategy === 'smote' && !hasNumericalForSmote) {
      setBalanceStrategy('skip');
    }
  }, [balanceStrategy, hasNumericalForSmote]);

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
      
      // Update context with response data without altering tab navigation
      updateState({
        datasetId: response.dataset_id,
        processedFileUrl: response.processed_file_url,
        overview: response.overview,
        processingStage: 'processed' // Mark as processed but don't affect tab access
      });
      
      setSuccess(response.message || 'Data preprocessing completed successfully');
      
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
        <CardTitle className="text-xl text-primary flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Advanced Preprocessing
        </CardTitle>
        <CardDescription>
          Fine-tune your dataset with normalization and class balancing
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
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">Normalization</h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p className="text-sm">
                      Normalization scales your numerical features to make them comparable in magnitude
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <TooltipProvider>
              <Tooltip open={!hasNumericalToNormalize ? undefined : false}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Select
                      value={normalizationMethod}
                      onValueChange={(value) => setNormalizationMethod(value as NormalizationMethod)}
                      disabled={isLoading || !hasNumericalToNormalize}
                    >
                      <SelectTrigger className={`w-full ${!hasNumericalToNormalize ? 'opacity-70' : ''}`}>
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
                <TooltipContent side="right" className="max-w-[250px]">
                  <p className="text-sm text-amber-700">
                    Normalization is disabled because no numerical features are selected.
                  </p>
                </TooltipContent>
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
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">Balance Classes</h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p className="text-sm">
                      {isClassification 
                        ? "Class balancing makes sure all target classes are equally represented"
                        : "Class balancing is only applicable for classification tasks"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <TooltipProvider>
              <Tooltip open={!isClassification ? undefined : false}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Select
                      value={balanceStrategy}
                      onValueChange={(value) => setBalanceStrategy(value as BalanceStrategy)}
                      disabled={isLoading || !isClassification}
                    >
                      <SelectTrigger className={`w-full ${!isClassification ? 'opacity-70' : ''}`}>
                        <SelectValue placeholder="Select balance strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="undersample">Undersampling</SelectItem>
                        <TooltipProvider>
                          <Tooltip open={balanceStrategy === 'smote' && !hasNumericalForSmote ? undefined : false}>
                            <TooltipTrigger asChild>
                              <div>
                                <SelectItem 
                                  value="smote" 
                                  disabled={!hasNumericalForSmote}
                                  className={!hasNumericalForSmote ? 'opacity-50' : ''}
                                >
                                  SMOTE (Synthetic Minority Over-sampling)
                                </SelectItem>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[250px]">
                              <p className="text-sm text-amber-700">
                                SMOTE requires numerical features. It can't be applied if none are selected.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <SelectItem value="skip">Skip Balancing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[250px]">
                  <p className="text-sm text-amber-700">
                    Balancing is only supported for classification tasks, not regression.
                  </p>
                </TooltipContent>
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
