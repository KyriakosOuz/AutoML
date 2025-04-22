import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getPredictionSchema, PredictionSchema, submitManualPrediction } from '@/lib/training';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Loader2 } from 'lucide-react';

interface DynamicPredictionFormProps {
  experimentId: string;
}

interface PredictionResult {
  prediction: string | number;
  probability?: number | number[];
}

const DynamicPredictionForm: React.FC<DynamicPredictionFormProps> = ({ experimentId }) => {
  const [schema, setSchema] = useState<PredictionSchema | null>(null);
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
        const schemaData = await getPredictionSchema(experimentId);
        setSchema(schemaData);
        
        // Initialize input values with empty strings
        const initialInputs: Record<string, string> = {};
        schemaData.features.forEach(feature => {
          initialInputs[feature] = '';
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

  const handleInputChange = (feature: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [feature]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!schema) return;
    
    setIsPredicting(true);
    setPredictionResult(null);
    
    try {
      // Format input values (convert to numbers where appropriate)
      const formattedInputs: Record<string, any> = {};
      
      Object.entries(inputValues).forEach(([key, value]) => {
        // Try to convert to number if possible, otherwise keep as string
        const numValue = Number(value);
        formattedInputs[key] = isNaN(numValue) ? value : numValue;
      });
      
      const result = await submitManualPrediction(experimentId, formattedInputs);
      
      if (result.prediction !== undefined) {
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
        <CardTitle>Make a Prediction</CardTitle>
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
                  <p className="text-sm text-muted-foreground">Predicted {schema.target_column}:</p>
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
            {schema.features.map((feature) => (
              <div key={feature} className="space-y-2">
                <Label htmlFor={`input-${feature}`}>{feature}</Label>
                <Input 
                  id={`input-${feature}`}
                  value={inputValues[feature] || ''}
                  onChange={(e) => handleInputChange(feature, e.target.value)}
                  placeholder={schema.sample_row[feature]?.toString() || ''}
                />
              </div>
            ))}
          </div>
          
          <div className="mt-4 space-y-2">
            <Label htmlFor="target-column" className="text-primary">
              {schema.target_column} (Target)
            </Label>
            <Input 
              id="target-column"
              value={predictionResult?.prediction?.toString() || ''}
              className="bg-primary/5 border-primary/20"
              readOnly
              placeholder="Prediction will appear here"
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
