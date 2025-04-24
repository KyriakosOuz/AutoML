
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPredictionSchema, predictManual } from '@/lib/training';

interface DynamicPredictionFormProps {
  experimentId: string;
}

const DynamicPredictionForm: React.FC<DynamicPredictionFormProps> = ({ experimentId }) => {
  const [columns, setColumns] = useState<string[]>([]);
  const [target, setTarget] = useState<string>('');
  const [example, setExample] = useState<Record<string, any>>({});
  const [manualInputs, setManualInputs] = useState<Record<string, any>>({});
  const [prediction, setPrediction] = useState<string | number | undefined>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch prediction schema on mount/experiment change
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setColumns([]);
    setTarget('');
    setExample({});
    setManualInputs({});
    setPrediction('');
    if (!experimentId) return;
    const fetchSchema = async () => {
      try {
        // Fetch schema using helper (includes auth header)
        const schema = await getPredictionSchema(experimentId);
        // Backend schema normalization
        setColumns(Array.isArray(schema.columns) ? schema.columns : []);
        setTarget(schema.target ?? '');
        setExample(schema.example ?? {});
        const newInputs: Record<string, any> = {};
        (schema.columns ?? []).forEach(col => {
          if (col !== schema.target) newInputs[col] = '';
        });
        setManualInputs(newInputs);
        setPrediction('');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch prediction schema';
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
    setManualInputs(prev => ({ ...prev, [col]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    setError(null);
    setPrediction('');
    try {
      const processedInputs: Record<string, any> = {};
      for (const [key, value] of Object.entries(manualInputs)) {
        const numValue = Number(value);
        processedInputs[key] = isNaN(numValue) ? value : numValue;
      }
      
      // Use our updated predictManual function
      const result = await predictManual(experimentId, processedInputs);
      
      // The function now returns the unwrapped data object
      const newPrediction = result?.prediction ?? '';
      console.log('Prediction response:', result);
      setPrediction(newPrediction);
      toast({
        title: "Prediction Success",
        description: "Prediction generated.",
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
            {inputColumns.map(col => (
              <div key={col} className="space-y-2">
                <Label htmlFor={`field-${col}`}>{col}</Label>
                <Input
                  key={col}
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
            <Label htmlFor="field-target" className="text-primary">{target} (Target)</Label>
            <Input
              id="field-target"
              value={
                prediction !== undefined && prediction !== ''
                  ? String(prediction)
                  : (typeof example[target] !== 'undefined' ? String(example[target]) : '')
              }
              placeholder={String(example[target] ?? '')}
              disabled
              className="bg-gray-100 text-gray-500 cursor-not-allowed"
              readOnly
            />
          </div>
          <Button
            type="submit"
            className="mt-6 w-full"
            disabled={
              isPredicting ||
              inputColumns.some(col => manualInputs[col] === '' || manualInputs[col] === undefined)
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
