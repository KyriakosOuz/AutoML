
import React, { useState, useEffect } from 'react';
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
import ClassImbalanceAlert from './ClassImbalanceAlert';
import ClassDistributionChart from './ClassDistributionChart';

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
    columnsToKeep,
    targetColumn,
    classImbalanceData, 
    setClassImbalanceData 
  } = useDataset();

  const [normalizationMethod, setNormalizationMethod] = useState<NormalizationMethod>('minmax');
  const [balanceStrategy, setBalanceStrategy] = useState<BalanceStrategy>('skip');
  const [balanceMethod, setBalanceMethod] = useState<BalanceMethod>('random');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [isCheckingImbalance, setIsCheckingImbalance] = useState(false);

  const isClassification = taskType === 'binary_classification' || taskType === 'multiclass_classification';

  // Effect to check for class imbalance when the component mounts
  useEffect(() => {
    const checkClassImbalance = async () => {
      if (!datasetId || !isClassification || isCheckingImbalance) return;

      try {
        setIsCheckingImbalance(true);
        console.log('Checking class imbalance for dataset:', datasetId);
        
        const response = await datasetApi.checkClassImbalance(datasetId);
        console.log('Class imbalance response:', response);
        
        const imbalanceData = response.data || response;
        
        // Update the class imbalance data in the context
        setClassImbalanceData(imbalanceData);
        
        // If imbalance is detected and there's a recommendation, update the balance strategy
        if (imbalanceData.needs_balancing && imbalanceData.recommendation) {
          const lowerCaseRec = imbalanceData.recommendation.toLowerCase();
          
          if (lowerCaseRec.includes('smote')) {
            setBalanceStrategy('oversample');
            setBalanceMethod('smote');
          } else if (lowerCaseRec.includes('oversample')) {
            setBalanceStrategy('oversample');
            setBalanceMethod('random');
          } else if (lowerCaseRec.includes('undersample')) {
            setBalanceStrategy('undersample');
            setBalanceMethod('random');
          }
        }
      } catch (error) {
        console.error('Error checking class imbalance:', error);
        setDebugInfo('Failed to check class imbalance: ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        setIsCheckingImbalance(false);
      }
    };

    checkClassImbalance();
  }, [datasetId, isClassification, setClassImbalanceData]);

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
        
        {isCheckingImbalance && (
          <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">Analyzing class distribution...</AlertDescription>
          </Alert>
        )}
        
        {/* Class Imbalance Alert - Only for classification tasks */}
        {isClassification && classImbalanceData && !isCheckingImbalance && (
          <>
            <ClassImbalanceAlert classImbalanceData={classImbalanceData} />
            {/* Display chart for class distribution */}
            <ClassDistributionChart 
              classData={classImbalanceData.class_distribution} 
              targetColumn={classImbalanceData.target_column} 
            />
            <Separator className="my-6" />
          </>
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
          disabled={isLoading || isLoadingPreview || isCheckingImbalance}
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
