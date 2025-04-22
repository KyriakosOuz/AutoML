import React, { useState, useEffect } from 'react';
import { getExperimentResults } from '@/lib/training';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader, FileInput } from 'lucide-react';
import { predictManual } from '@/lib/training';

interface PredictionPanelProps {
  experimentId: string;
}

const PredictionPanel: React.FC<PredictionPanelProps> = ({ experimentId }) => {
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [sampleRow, setSampleRow] = useState<Record<string, any>>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [prediction, setPrediction] = useState<any>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [taskType, setTaskType] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchExperimentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getExperimentResults(experimentId);
        
        if (!result) {
          throw new Error('Failed to fetch experiment results');
        }
        
        const target = result.target_column;
        setTargetColumn(target);
        
        const taskTypeResult = result.task_type || '';
        setTaskType(taskTypeResult);
        
        if (result.training_results?.y_true && result.training_results.y_pred) {
          if (result.files?.some(file => file.file_type === 'dataset')) {
            const datasetFile = result.files.find(file => file.file_type === 'dataset');
            if (datasetFile?.file_url) {
              try {
                const resp = await fetch(datasetFile.file_url);
                const text = await resp.text();
                const allCols = text.split('\n')[0].split(',').map(col => col.trim());
                
                const featureList = allCols.filter(col => col !== target);
                setFeatures(featureList);
                
                const sampleData: Record<string, string> = {};
                featureList.forEach(feature => {
                  sampleData[feature] = `Sample ${feature} value`;
                });
                setSampleRow(sampleData);
                
                const initialInputs: Record<string, string> = {};
                featureList.forEach(feature => {
                  initialInputs[feature] = '';
                });
                setInputValues(initialInputs);
              } catch (err) {
                console.error('Error fetching dataset file:', err);
                setError('Could not load feature columns from dataset');
              }
            }
          } else {
            const availableColumns = Object.keys(result.metrics || {})
              .filter(key => !['accuracy', 'f1_score', 'precision', 'recall', 'classification_report'].includes(key))
              .map(key => key.replace('_importance', ''));
            
            if (availableColumns.length > 0) {
              setFeatures(availableColumns);
              
              const sampleData: Record<string, string> = {};
              availableColumns.forEach(feature => {
                sampleData[feature] = `Sample ${feature} value`;
              });
              setSampleRow(sampleData);
              
              const initialInputs: Record<string, string> = {};
              availableColumns.forEach(feature => {
                initialInputs[feature] = '';
              });
              setInputValues(initialInputs);
            } else {
              setError('Could not determine feature columns from available data');
            }
          }
        } else {
          if (result.columns_to_keep && result.columns_to_keep.length > 0) {
            const featureList = result.columns_to_keep.filter(col => col !== target);
            setFeatures(featureList);
            
            const sampleData: Record<string, string> = {};
            featureList.forEach(feature => {
              sampleData[feature] = `Sample ${feature} value`;
            });
            setSampleRow(sampleData);
            
            const initialInputs: Record<string, string> = {};
            featureList.forEach(feature => {
              initialInputs[feature] = '';
            });
            setInputValues(initialInputs);
          } else {
            setError('No feature columns available');
          }
        }
      } catch (err) {
        console.error('Error fetching experiment data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    if (experimentId) {
      fetchExperimentData();
    }
  }, [experimentId]);
  
  const handleInputChange = (feature: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [feature]: value
    }));
  };
  
  const areAllInputsFilled = () => {
    return features.every(feature => inputValues[feature]?.trim() !== '');
  };
  
  const handlePredict = async () => {
    try {
      setPredicting(true);
      setPrediction(null);
      setConfidence(null);
      
      const formattedInputs: Record<string, any> = {};
      Object.entries(inputValues).forEach(([key, value]) => {
        const numValue = Number(value);
        formattedInputs[key] = isNaN(numValue) ? value : numValue;
      });
      
      const result = await predictManual(experimentId, formattedInputs);
      
      if (result.prediction !== undefined) {
        setPrediction(result.prediction);
        
        if (taskType.includes('classification') && result.probability !== undefined) {
          setConfidence(result.probability);
        }
        
        toast({
          title: 'Prediction Generated',
          description: 'The model has successfully generated a prediction.',
        });
      } else {
        throw new Error('Invalid prediction result');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate prediction');
      
      toast({
        title: 'Prediction Failed',
        description: err instanceof Error ? err.message : 'Could not generate prediction',
        variant: 'destructive',
      });
    } finally {
      setPredicting(false);
    }
  };
  
  const isClassification = taskType.includes('classification');
  
  const formattedPrediction = () => {
    if (prediction === null) return '';
    
    if (typeof prediction === 'number') {
      return prediction.toFixed(4);
    }
    
    return prediction.toString();
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Prediction Form</CardTitle>
          <CardDescription>Preparing prediction interface...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prediction Unavailable</CardTitle>
          <CardDescription>There was a problem loading the prediction form</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Prediction</CardTitle>
        <CardDescription>
          Enter values for each feature to generate a prediction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {features.map((feature) => (
            <div key={feature} className="space-y-2">
              <Label htmlFor={`feature-${feature}`}>{feature}</Label>
              <Input
                id={`feature-${feature}`}
                placeholder={sampleRow[feature]?.toString() || `Enter ${feature}`}
                value={inputValues[feature]}
                onChange={(e) => handleInputChange(feature, e.target.value)}
              />
            </div>
          ))}
          
          <div className="space-y-2 mt-4 pt-4 border-t">
            <Label htmlFor="prediction">{targetColumn || 'Prediction'}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="prediction"
                value={formattedPrediction()}
                placeholder="Prediction will appear here"
                readOnly
                disabled
                className={prediction ? "bg-primary/5 font-medium" : ""}
              />
              
              {isClassification && confidence !== null && (
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {(confidence * 100).toFixed(1)}% confidence
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handlePredict} 
          disabled={predicting || !areAllInputsFilled()}
          className="w-full"
        >
          {predicting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Generating Prediction...
            </>
          ) : (
            'Generate Prediction'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PredictionPanel;
