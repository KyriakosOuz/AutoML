
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface SchemaApiData {
  columns: string[];
  target: string;
  example: Record<string, any>;
}

interface DynamicPredictionFormProps {
  experimentId: string;
}

const DynamicPredictionForm: React.FC<DynamicPredictionFormProps> = ({ experimentId }) => {
  const [columnsToKeep, setColumnsToKeep] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [exampleRow, setExampleRow] = useState<Record<string, any>>({});
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [targetPrediction, setTargetPrediction] = useState<string | number>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // Fetch schema data for prediction
  useEffect(() => {
    if (!experimentId) return;
    setIsLoading(true);
    setError(null);

    const fetchSchema = async () => {
      try {
        const token = localStorage.getItem('sb-access-token') || '';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE_URL}/prediction/schema/${experimentId}`, { headers });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text.substring(0, 300) || 'Failed to fetch prediction schema');
        }
        const data: SchemaApiData = (await res.json()).data || (await res.json()) as SchemaApiData;
        // If wrapped in .data envelope (sometimes), else fallback
        const { columns, target, example } = data;
        setColumnsToKeep(columns.filter(col => col !== target));
        setTargetColumn(target);
        setExampleRow(example);
        // Setup blank inputs
        const blankInputs: Record<string, any> = {};
        columns.filter(col => col !== target).forEach(col => {
          blankInputs[col] = '';
        });
        setInputValues(blankInputs);
        setTargetPrediction('');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load prediction schema';
        setError(msg);
        toast({
          title: "Prediction Form Error",
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
    setInputValues(prev => ({ ...prev, [col]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    setError(null);
    setTargetPrediction('');

    try {
      const form = new FormData();
      form.append('experiment_id', experimentId);

      // Prepare input values with numbers if possible
      const formattedInputs: Record<string, any> = {};
      for (const [key, value] of Object.entries(inputValues)) {
        const numValue = Number(value);
        formattedInputs[key] = isNaN(numValue) ? value : numValue;
      }
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
      const result = data.data || data;
      // Fill target input with prediction value
      setTargetPrediction(result.prediction ?? '');

      toast({
        title: "Prediction Success",
        description: "Prediction generated and filled in the target field.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate prediction';
      setError(msg);
      toast({
        title: "Prediction Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsPredicting(false);
    }
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

  if (!columnsToKeep.length || !targetColumn) {
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
          Enter values for each feature to get a prediction.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {columnsToKeep.map(col => (
              <div key={col} className="space-y-2">
                <Label htmlFor={`input-${col}`}>{col}</Label>
                <Input
                  id={`input-${col}`}
                  value={inputValues[col] || ''}
                  onChange={(e) => handleInputChange(col, e.target.value)}
                  placeholder={exampleRow && exampleRow[col] !== undefined ? exampleRow[col]?.toString() : ''}
                  disabled={isPredicting}
                />
              </div>
            ))}
          </div>
          {/* Target column disabled, styled gray */}
          <div className="mt-4 space-y-2">
            <Label htmlFor="target-col" className="text-primary">{targetColumn} (Target)</Label>
            <Input
              id="target-col"
              value={targetPrediction ? targetPrediction.toString() : ''}
              className="bg-muted/50 border-muted text-gray-600"
              readOnly
              disabled
              placeholder={
                exampleRow && exampleRow[targetColumn] !== undefined
                  ? exampleRow[targetColumn]?.toString()
                  : "Prediction will appear here"
              }
            />
          </div>
          <Button
            type="submit"
            className="mt-6 w-full"
            disabled={
              isPredicting ||
              columnsToKeep.some(col => !inputValues[col] && inputValues[col] !== 0)
            }
          >
            {isPredicting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>Generate Prediction</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DynamicPredictionForm;
