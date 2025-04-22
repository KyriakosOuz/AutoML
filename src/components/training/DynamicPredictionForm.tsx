
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface SchemaData {
  columns: string[];
  target: string;
  example: Record<string, any>;
}

interface DynamicPredictionFormProps {
  experimentId: string;
}

interface PredictionResult {
  prediction: string | number;
  probability?: number | number[];
}

const DynamicPredictionForm: React.FC<DynamicPredictionFormProps> = ({ experimentId }) => {
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const { toast } = useToast();

  // Fetch the prediction schema when component mounts
  useEffect(() => {
    const fetchSchema = async () => {
      if (!experimentId) return;

      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('sb-access-token') || ''; // fallback, depends on your supabase client
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const response = await fetch(`${API_BASE_URL}/prediction/schema/${experimentId}`, { headers });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text.substring(0, 300) || 'Failed to fetch prediction schema');
        }
        const data: SchemaData = await response.json();
        setSchema(data);

        const initialInputs: Record<string, any> = {};
        data.columns.forEach(col => {
          if (col !== data.target) {
            initialInputs[col] = '';
          }
        });
        setInputValues(initialInputs);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load prediction schema';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchema();
  }, [experimentId, toast]);

  const handleInputChange = (column: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!schema) return;

    setIsPredicting(true);
    setPredictionResult(null);

    try {
      const form = new FormData();
      form.append('experiment_id', experimentId);

      // Format input values as needed (try numeric conversion)
      const formattedInputs: Record<string, any> = {};
      Object.entries(inputValues).forEach(([key, value]) => {
        const numValue = Number(value);
        formattedInputs[key] = isNaN(numValue) ? value : numValue;
      });

      form.append('input_values', JSON.stringify(formattedInputs));
      const token = localStorage.getItem('sb-access-token') || '';
      const fetchOptions: RequestInit = {
        method: 'POST',
        body: form,
      };
      if (token) {
        (fetchOptions.headers as Record<string, string>) = { Authorization: `Bearer ${token}` };
      }

      const res = await fetch(`${API_BASE_URL}/prediction/predict-manual/`, fetchOptions);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.substring(0, 300) || 'Failed to generate prediction');
      }

      const data = await res.json();
      if (data && (data.prediction !== undefined || (data.data && data.data.prediction !== undefined))) {
        const result = data.data || data;
        setPredictionResult({
          prediction: result.prediction,
          probability: result.probability,
        });

        toast({
          title: "Prediction Complete",
          description: "Successfully generated prediction",
        });
      } else {
        throw new Error("Invalid prediction response format");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate prediction';
      setError(errorMessage);
      toast({
        title: "Prediction Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPredicting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading prediction form...</p>
          </div>
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

  if (!schema) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No schema available for this experiment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Make a Single Prediction</CardTitle>
        <CardDescription>
          Enter values for each feature to get a prediction
        </CardDescription>
      </CardHeader>
      <CardContent>
        {predictionResult && (
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <BrainCircuit className="h-4 w-4 mr-2 text-primary" />
                Prediction Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Predicted {schema.target}:
                  </p>
                  <p className="text-2xl font-bold">
                    {predictionResult.prediction}
                  </p>
                </div>
                {predictionResult.probability !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence:</p>
                    <p className="text-2xl font-bold">
                      {typeof predictionResult.probability === 'number'
                        ? `${(predictionResult.probability * 100).toFixed(2)}%`
                        : Array.isArray(predictionResult.probability)
                        ? `${(Math.max(...predictionResult.probability) * 100).toFixed(2)}%`
                        : 'N/A'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {schema.columns
              .filter(col => col !== schema.target)
              .map((col) => (
                <div key={col} className="space-y-2">
                  <Label htmlFor={`input-${col}`}>{col}</Label>
                  <Input
                    id={`input-${col}`}
                    value={inputValues[col] || ''}
                    onChange={(e) => handleInputChange(col, e.target.value)}
                    placeholder={
                      schema.example && schema.example[col] !== undefined
                        ? schema.example[col]?.toString()
                        : ''
                    }
                  />
                </div>
              ))}
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="target-column" className="text-primary">
              {schema.target} (Target)
            </Label>
            <Input
              id="target-column"
              value={predictionResult?.prediction?.toString() || ''}
              className="bg-primary/5 border-primary/20"
              readOnly
              disabled
              placeholder={
                schema.example && schema.example[schema.target] !== undefined
                  ? schema.example[schema.target]?.toString()
                  : "Prediction will appear here"
              }
            />
          </div>
          <Button
            type="submit"
            className="mt-6 w-full"
            disabled={isPredicting || Object.values(inputValues).some(val => !val)}
          >
            {isPredicting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <BrainCircuit className="h-4 w-4 mr-2" />
                Generate Prediction
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DynamicPredictionForm;
