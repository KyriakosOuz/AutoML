
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Sparkles, InfoIcon } from 'lucide-react';

import { datasetApi } from '@/lib/api';
import { useDataset } from '@/contexts/DatasetContext';

import NormalizationSelector, { NormalizationMethod } from './NormalizationSelector';
import BalanceStrategySelector, { BalanceStrategy } from './BalanceStrategySelector';
import BalanceMethodSelector, { BalanceMethod } from './BalanceMethodSelector';

interface FeatureTypes {
  hasNumerical: boolean;
  hasCategorical: boolean;
  isMixed: boolean;
  numericalCount: number;
  categoricalCount: number;
}

interface PreprocessingCardProps {
  featureTypes: FeatureTypes;
  hasNumericalToNormalize: boolean;
  isLoadingPreview: boolean;
}

const PreprocessingCard: React.FC<PreprocessingCardProps> = ({
  featureTypes,
  hasNumericalToNormalize,
  isLoadingPreview
}) => {
  const { 
    datasetId, 
    taskType, 
    updateState,
    columnsToKeep
  } = useDataset();

  const [normalizationMethod, setNormalizationMethod] = useState<NormalizationMethod>('minmax');
  const [balanceStrategy, setBalanceStrategy] = useState<BalanceStrategy>('skip');
  const [balanceMethod, setBalanceMethod] = useState<BalanceMethod>('random');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const isClassification = taskType === 'binary_classification' || taskType === 'multiclass_classification';

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
      
      // Update state to indicate processing is complete
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
          <NormalizationSelector 
            value={normalizationMethod}
            onChange={setNormalizationMethod}
            hasNumericalFeatures={hasNumericalToNormalize}
            isLoading={isLoadingPreview}
          />
          
          <Separator />
          
          <BalanceStrategySelector
            value={balanceStrategy}
            onChange={setBalanceStrategy}
            isClassification={isClassification}
            isLoading={isLoadingPreview}
          />
          
          <BalanceMethodSelector
            balanceStrategy={balanceStrategy}
            balanceMethod={balanceMethod}
            onChange={setBalanceMethod}
            featureTypes={featureTypes}
            isClassification={isClassification}
            isLoading={isLoadingPreview}
          />
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

export default PreprocessingCard;
