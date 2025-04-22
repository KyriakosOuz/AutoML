
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader, Upload } from 'lucide-react';

interface PredictionPanelProps {
  experimentId: string;
}

interface SchemaResponse {
  features: string[];
  target_column: string;
  sample_row: Record<string, any>;
}

const PredictionPanel: React.FC<PredictionPanelProps> = ({ experimentId }) => {
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [prediction, setPrediction] = useState<any>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [taskType, setTaskType] = useState<string>('');
  const { toast } = useToast();

  // Fetch schema on component mount
  useEffect(() => {
    const fetchSchema = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/prediction/schema/${experimentId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setSchema(data);
        
        // Initialize input values with empty strings
        const initialInputs: Record<string, string> = {};
        data.features.forEach((feature: string) => {
          initialInputs[feature] = '';
        });
        setInputValues(initialInputs);

        // Also fetch experiment details to get task type if needed
        const experimentResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/experiments/experiment-results/${experimentId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        });

        if (experimentResponse.ok) {
          const experimentData = await experimentResponse.json();
          const experimentResult = experimentData.data || experimentData;
          setTaskType(experimentResult.task_type || '');
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prediction form');
      } finally {
        setLoading(false);
      }
    };

    if (experimentId) {
      fetchSchema();
    }
  }, [experimentId]);

  const handleInputChange = (feature: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [feature]: value
    }));
  };

  const areAllInputsFilled = () => {
    if (!schema) return false;
    return schema.features.every(feature => inputValues[feature]?.trim() !== '');
  };

  const handlePredict = async () => {
    setPredicting(true);
    setPrediction(null);
    setConfidence(null);
    setError(null);

    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('experiment_id', experimentId);
      
      // Convert input values to JSON string
      formData.append('input_values', JSON.stringify(inputValues));

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/prediction/predict-manual/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Prediction failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status === 'success' && result.data.prediction !== undefined) {
        setPrediction(result.data.prediction);
        
        // Set confidence if available and task is classification
        if (taskType.includes('classification') && result.data.probability !== undefined) {
          setConfidence(result.data.probability);
        }
        
        toast({
          title: 'Prediction Generated',
          description: 'The model has successfully generated a prediction.',
        });
      } else {
        throw new Error('Invalid prediction result');
      }
    } catch (err) {
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

  const handleBatchPrediction = () => {
    // Batch prediction functionality would go here
    toast({
      title: 'Batch Prediction',
      description: 'Batch prediction is not yet implemented.',
      variant: 'default',
    });
  };

  // --- Render ---
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
        <CardTitle>Model Predictions</CardTitle>
        <CardDescription>
          Generate predictions using your trained model
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="manual">Manual Input</TabsTrigger>
            <TabsTrigger value="batch">Batch Prediction</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Enter values for each feature to generate a prediction.
            </div>
            
            <form
              onSubmit={e => {
                e.preventDefault();
                handlePredict();
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {schema && schema.features.map((feature) => (
                  <div key={feature} className="flex flex-col space-y-1.5">
                    <Label htmlFor={`feature-${feature}`}>{feature}</Label>
                    <Input
                      id={`feature-${feature}`}
                      placeholder={schema.sample_row[feature]?.toString() || `Enter ${feature}`}
                      value={inputValues[feature] || ''}
                      onChange={e => handleInputChange(feature, e.target.value)}
                      disabled={predicting}
                      className="w-full"
                      autoComplete="off"
                    />
                  </div>
                ))}
              </div>
              
              {/* Target column display */}
              {schema && (
                <div className="flex flex-col space-y-1.5 mb-6 max-w-md mx-auto">
                  <Label htmlFor={`target-${schema.target_column}`} className="font-semibold text-center">
                    {schema.target_column} (Prediction)
                  </Label>
                  <Input
                    id={`target-${schema.target_column}`}
                    value={
                      prediction !== null
                        ? typeof prediction === 'number'
                          ? prediction.toFixed(4)
                          : prediction
                        : ''
                    }
                    readOnly
                    disabled
                    className="bg-primary/10 text-primary focus:shadow-none opacity-90 font-semibold ring-0 border-2 border-primary/20 text-center"
                  />
                  {taskType.includes('classification') && confidence !== null && (
                    <Badge variant="outline" className="mx-auto mt-1 bg-primary/10 text-primary text-xs">
                      {(confidence * 100).toFixed(1)}% confidence
                    </Badge>
                  )}
                </div>
              )}
              
              <Button
                type="submit"
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
            </form>
          </TabsContent>
          
          <TabsContent value="batch" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Upload a CSV file containing multiple samples to generate predictions in batch.
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="flex flex-col items-center">
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium mb-1">Drop your CSV file here or click to browse</p>
                <p className="text-xs text-muted-foreground">CSV file should contain all feature columns (without the target column)</p>
              </div>
              
              <Button variant="outline" className="mt-4" onClick={handleBatchPrediction}>
                Upload and Predict
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PredictionPanel;
