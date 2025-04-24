import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPredictionSchema } from '@/lib/training';
import { API_BASE_URL } from '@/lib/constants';
import { getAuthHeaders } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import BatchPredictionView from './prediction/BatchPredictionView';
import { ManualPredictionResponse, TaskType } from './prediction/PredictionResponse.types';

interface DynamicPredictionFormProps {
  experimentId: string;
}

const DynamicPredictionForm: React.FC<DynamicPredictionFormProps> = ({ experimentId }) => {
  const [columns, setColumns] = useState<string[]>([]);
  const [target, setTarget] = useState<string>('');
  const [example, setExample] = useState<Record<string, any>>({});
  const [manualInputs, setManualInputs] = useState<Record<string, any>>({});
  const [prediction, setPrediction] = useState<ManualPredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setColumns([]);
    setTarget('');
    setExample({});
    setManualInputs({});
    setPrediction(null);

    if (!experimentId) return;

    const fetchSchema = async () => {
      try {
        const schema = await getPredictionSchema(experimentId);
        setColumns(Array.isArray(schema.columns) ? schema.columns : []);
        setTarget(schema.target ?? '');
        setExample(schema.example ?? {});
        
        const newInputs: Record<string, any> = {};
        (schema.columns ?? []).forEach(col => {
          if (col !== schema.target) newInputs[col] = '';
        });
        setManualInputs(newInputs);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch prediction schema';
        setError(msg);
        toast({
          title: "Error",
          description: msg,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchema();
  }, [experimentId, toast]);

  const handleInputChange = (col: string, value: string) => {
    setManualInputs(prev => ({ ...prev, [col]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    setError(null);
    setPrediction(null);

    try {
      console.log('Input values before processing:', manualInputs);
      
      const processedInputs: Record<string, any> = {};
      for (const [key, value] of Object.entries(manualInputs)) {
        const numValue = Number(value);
        processedInputs[key] = isNaN(numValue) ? value : numValue;
      }
      
      const formData = new FormData();
      formData.append('experiment_id', experimentId);
      formData.append('input_values', JSON.stringify(processedInputs));

      const token = (await getAuthHeaders())?.Authorization?.replace('Bearer ', '');
      const headers = new Headers();
      if (token) {
        headers.append('Authorization', `Bearer ${token}`);
      }

      const response = await fetch(
        `${API_BASE_URL}/prediction/predict-manual/`,
        {
          method: 'POST',
          headers,
          body: formData,
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const json = await response.json();
      console.log('Prediction response:', json);
      
      if (json.data) {
        setPrediction(json.data);
        toast({
          title: "Success",
          description: "Prediction generated successfully",
        });
      } else {
        throw new Error('Invalid prediction response format');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate prediction';
      setError(msg);
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsPredicting(false);
    }
  };

  const renderPredictionValue = (prediction: ManualPredictionResponse) => {
    const value = prediction.prediction;
    
    if (prediction.task_type === 'regression') {
      return typeof value === 'number' ? value.toFixed(4) : value;
    }
    
    return String(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading prediction form...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!columns.length || !target) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No schema available for this experiment.</p>
        </CardContent>
      </Card>
    );
  }

  const inputColumns = columns.filter(col => col !== target);

  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="manual">Predict Manually</TabsTrigger>
        <TabsTrigger value="batch">Predict from CSV</TabsTrigger>
      </TabsList>
      
      <TabsContent value="manual">
        <Card>
          <CardHeader>
            <CardTitle>Make a Single Prediction</CardTitle>
            <CardDescription>
              Enter values for each feature to get a prediction for {target}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inputColumns.map(col => (
                  <div key={col} className="space-y-2">
                    <Label htmlFor={`field-${col}`}>{col}</Label>
                    <Input
                      id={`field-${col}`}
                      placeholder={String(example[col] ?? '')}
                      value={manualInputs[col] || ''}
                      onChange={(e) => handleInputChange(col, e.target.value)}
                      disabled={isPredicting}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="field-target" className="text-primary">
                  {prediction?.task_type === 'regression' ? 'Predicted Value' : 'Prediction'}
                </Label>
                <Input
                  id="field-target"
                  value={prediction ? renderPredictionValue(prediction) : ''}
                  placeholder="Prediction will appear here"
                  disabled
                  className="bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
                  readOnly
                />
                {prediction?.class_probabilities && prediction.task_type !== 'regression' && (
                  <div className="mt-2 border rounded-md p-3 bg-muted/30">
                    <ClassProbabilities probabilities={prediction.class_probabilities} />
                  </div>
                )}
              </div>
              <Button
                type="submit"
                className="mt-6 w-full"
                disabled={isPredicting || inputColumns.some(col => manualInputs[col] === '')}
              >
                {isPredicting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Generate Prediction'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="batch">
        <BatchPredictionView experimentId={experimentId} />
      </TabsContent>
    </Tabs>
  );
};

export default DynamicPredictionForm;
