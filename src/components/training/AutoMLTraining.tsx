
import React, { useState, useEffect } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { useTraining } from '@/contexts/TrainingContext';
import { trainingApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Beaker, HelpCircle, Play, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateExperimentName } from '@/lib/constants';

const AutoMLTraining: React.FC = () => {
  const { datasetId, targetColumn, taskType } = useDataset();
  const { 
    isTraining, 
    setIsTraining,
    automlParameters, 
    setAutomlParameters,
    setAutomlResult,
    setLastTrainingType,
    setError
  } = useTraining();
  const { toast } = useToast();
  const [experimentName, setExperimentName] = useState('');
  
  useEffect(() => {
    if (automlParameters.automlEngine) {
      const newName = generateExperimentName('AutoML', automlParameters.automlEngine.toUpperCase());
      setExperimentName(newName);
    }
  }, [automlParameters.automlEngine]);

  const handleTrainModel = async () => {
    if (!datasetId || !targetColumn || !taskType) {
      toast({
        title: "Missing Required Fields",
        description: "Dataset ID, target column, and task type are required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsTraining(true);
      setError(null);
      setLastTrainingType('automl');
      
      const { automlEngine, testSize, stratify, randomSeed } = automlParameters;
      
      toast({
        title: "Training Started",
        description: `Starting ${automlEngine.toUpperCase()} AutoML training...`,
      });
      
      console.log("Sending AutoML training request with taskType:", taskType);
      
      const response = await trainingApi.automlTrain(
        datasetId,
        taskType,
        automlEngine,
        testSize,
        stratify,
        randomSeed,
        experimentName || undefined,
        true, // enableVisualization
        true  // storeModel
      );
      
      // Format the response to match our context state
      const formattedResult = {
        experimentId: response.experiment_id,
        engine: response.engine,
        taskType: response.task_type,
        target: response.target,
        metrics: response.metrics,
        modelPath: response.model_path,
        completedAt: response.completed_at,
        trainingTimeSec: response.training_time_sec,
        leaderboard: response.leaderboard
      };
      
      setAutomlResult(formattedResult);
      
      toast({
        title: "Training Complete",
        description: `${automlEngine.toUpperCase()} AutoML training completed successfully`,
      });
    } catch (error) {
      console.error('AutoML training error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to train model';
      setError(errorMessage);
      toast({
        title: "Training Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
  };
  
  const isFormValid = () => {
    return !!(
      datasetId &&
      taskType &&
      automlParameters.automlEngine &&
      automlParameters.testSize >= 0.1 &&
      automlParameters.testSize <= 0.5
    );
  };
  
  return (
    <Card className="w-full mt-6 rounded-2xl shadow-lg transition-all hover:shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-primary">
          <Beaker className="h-5 w-5" />
          AutoML Training
        </CardTitle>
        <CardDescription>
          Train models automatically using advanced AutoML engines
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="automl-engine" className="flex items-center gap-2">
              AutoML Engine
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      MLJAR: Fast and optimized for small-medium datasets<br />
                      H2O: Robust choice for larger datasets
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Select
              value={automlParameters.automlEngine}
              onValueChange={(value) => setAutomlParameters({ automlEngine: value as 'mljar' | 'h2o' })}
              disabled={isTraining}
            >
              <SelectTrigger id="automl-engine" className="w-full">
                <SelectValue placeholder="Select AutoML engine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mljar">MLJAR AutoML</SelectItem>
                <SelectItem value="h2o">H2O AutoML</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="experiment-name">Experiment Name</Label>
            <Input
              id="experiment-name"
              value={experimentName}
              onChange={(e) => setExperimentName(e.target.value)}
              disabled={isTraining}
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Test Set Split</Label>
              <span className="text-sm font-medium">
                {(automlParameters.testSize * 100).toFixed(0)}%
              </span>
            </div>
            <Slider
              id="test-size"
              min={0.1}
              max={0.5}
              step={0.05}
              value={[automlParameters.testSize]}
              onValueChange={(values) => setAutomlParameters({ testSize: values[0] })}
              disabled={isTraining}
              aria-label="Test set size"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label htmlFor="stratify" className="flex items-center gap-2">
                Stratify Split
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maintains class distribution in train/test sets. Recommended for classification tasks.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <p className="text-xs text-muted-foreground">Essential for balanced datasets in classification tasks</p>
            </div>
            <Switch
              id="stratify"
              checked={automlParameters.stratify}
              onCheckedChange={(checked) => setAutomlParameters({ stratify: checked })}
              disabled={isTraining}
              aria-label="Stratify split"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="random-seed" className="flex items-center gap-2">
              Random Seed
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Set for reproducible results. Using the same seed ensures consistent train/test splits.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="random-seed"
              type="number"
              min={0}
              value={automlParameters.randomSeed}
              onChange={(e) => setAutomlParameters({ randomSeed: parseInt(e.target.value) || 0 })}
              disabled={isTraining}
              placeholder="Enter random seed (e.g. 42)"
              aria-label="Random seed for reproducibility"
            />
            <p className="text-xs text-muted-foreground">For reproducible results</p>
          </div>
          
          <Button
            onClick={handleTrainModel}
            disabled={isTraining || !isFormValid()}
            className="w-full mt-4"
            size="lg"
          >
            {isTraining ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Training in Progress...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Train Model with {automlParameters.automlEngine.toUpperCase()}
              </>
            )}
          </Button>
          
          <div className="text-sm text-muted-foreground bg-primary-foreground p-3 rounded-md">
            <p className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Training might take several minutes depending on dataset size and complexity.</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoMLTraining;
