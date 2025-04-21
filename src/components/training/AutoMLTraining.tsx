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
import { AlertCircle, Rocket, HelpCircle, Play, Settings, Loader } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateExperimentName } from '@/lib/constants';
import { TrainingEngine } from '@/types/training';
import TrainingResults from './TrainingResults';
import { useAuth } from '@/contexts/AuthContext';

const AutoMLTraining: React.FC = () => {
  const { datasetId, taskType } = useDataset();
  const {
    isTraining,
    setIsTraining,
    automlEngine,
    setAutomlEngine,
    testSize,
    setTestSize,
    stratify,
    setStratify,
    randomSeed,
    setRandomSeed,
    setAutomlResult,
    setLastTrainingType,
    setError
  } = useTraining();
  const { user } = useAuth();
  const { toast } = useToast();
  const [experimentName, setExperimentName] = useState('');
  const [experimentId, setExperimentId] = useState<string | null>(null);

  useEffect(() => {
    if (taskType && automlEngine) {
      const newName = generateExperimentName('AutoML', automlEngine.toUpperCase());
      setExperimentName(newName);
    }
  }, [taskType, automlEngine]);

  const handleTrainModel = async () => {
    if (!datasetId || !taskType || !automlEngine) {
      toast({
        title: "Missing Required Fields",
        description: "Dataset ID, task type, and AutoML engine are required",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start training",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsTraining(true);
      setError(null);
      setLastTrainingType('automl');

      toast({
        title: "Training Started",
        description: `Starting AutoML training with ${automlEngine}...`,
      });

      const response = await trainingApi.automlTrain(
        datasetId,
        taskType,
        automlEngine,
        testSize,
        stratify,
        randomSeed
      );

      const respExperimentId = response?.data?.experiment_id;

      if (respExperimentId) {
        setExperimentId(respExperimentId);
        toast({
          title: "Training Submitted",
          description: `AutoML training with ${automlEngine} has been submitted. Fetching results...`,
        });
      } else {
        toast({
          title: "Training Initiated",
          description: `AutoML training with ${automlEngine} has started. Results will be available soon.`,
        });
      }
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
      automlEngine &&
      testSize >= 0.1 &&
      testSize <= 0.5
    );
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-primary">
            <Rocket className="h-5 w-5" />
            AutoML Training
          </CardTitle>
          <CardDescription>
            Automatically train models with different algorithms and hyperparameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>AutoML Engine</Label>
              <Select
                value={automlEngine}
                onValueChange={(value) => setAutomlEngine(value as TrainingEngine)}
                disabled={isTraining}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AutoML engine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mljar">MLJAR</SelectItem>
                  <SelectItem value="h2o">H2O</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experiment-name" className="flex items-center gap-2">
                Experiment Name
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Name to identify this training experiment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="experiment-name"
                value={experimentName}
                onChange={(e) => setExperimentName(e.target.value)}
                placeholder="Enter experiment name"
                disabled={isTraining}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Test Set Split</Label>
                <span className="text-sm font-medium">{(testSize * 100).toFixed(0)}%</span>
              </div>
              <Slider
                id="test-size"
                min={0.1}
                max={0.5}
                step={0.05}
                value={[testSize]}
                onValueChange={(values) => setTestSize(values[0])}
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
                checked={stratify}
                onCheckedChange={(checked) => setStratify(checked)}
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
                value={randomSeed}
                onChange={(e) => setRandomSeed(parseInt(e.target.value) || 0)}
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
                  <Loader className="mr-2 h-5 w-5 animate-spin" />
                  Training in Progress...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Train Model with {automlEngine}
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

      {experimentId && (
        <TrainingResults 
          type="automl"
          experimentId={experimentId} 
          onReset={() => setExperimentId(null)}
        />
      )}
    </div>
  );
};

export default AutoMLTraining;
