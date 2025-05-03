
import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { HyperParameters } from '@/types/training';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, RotateCcw, HelpCircle } from 'lucide-react';

interface HyperParameterEditorProps {
  algorithm: string;
  hyperparameters: HyperParameters;
  onChange: (params: HyperParameters) => void;
  useDefault: boolean;
  onToggleDefault: () => void;
  defaultHyperparameters?: HyperParameters;
}

const HyperParameterEditor: React.FC<HyperParameterEditorProps> = ({
  algorithm,
  hyperparameters,
  onChange,
  useDefault,
  onToggleDefault,
  defaultHyperparameters = {},
}) => {
  const [localParams, setLocalParams] = useState<HyperParameters>(hyperparameters);
  const [prevAlgorithm, setPrevAlgorithm] = useState<string>(algorithm);

  // Track algorithm changes and toggle to defaults when changed
  useEffect(() => {
    if (prevAlgorithm !== algorithm) {
      setPrevAlgorithm(algorithm);
      
      // Toggle to default hyperparameters when algorithm changes
      if (!useDefault) {
        onToggleDefault();
      }
    }
  }, [algorithm, prevAlgorithm, useDefault, onToggleDefault]);

  useEffect(() => {
    setLocalParams(hyperparameters);
  }, [hyperparameters]);

  const handleParamChange = (key: string, value: string) => {
    if (useDefault) return;

    const updatedParams = { ...localParams };
    const originalValue = hyperparameters[key];
    let convertedValue: any;

    if (typeof originalValue === 'boolean') {
      convertedValue = value === 'true';
    } else if (typeof originalValue === 'number') {
      convertedValue = Number(value);
    } else if (Array.isArray(originalValue)) {
      try {
        convertedValue = JSON.parse(value);
      } catch {
        convertedValue = [];
      }
    } else {
      convertedValue = value;
    }

    updatedParams[key] = convertedValue;
    setLocalParams(updatedParams);
    onChange(updatedParams);
  };

  const resetAllParameters = () => {
    if (useDefault || !defaultHyperparameters) return;
    onChange({ ...defaultHyperparameters });
  };

  const resetParameter = (key: string) => {
    if (useDefault || !defaultHyperparameters || !(key in defaultHyperparameters)) return;
    
    const updatedParams = { ...localParams };
    updatedParams[key] = defaultHyperparameters[key];
    setLocalParams(updatedParams);
    onChange(updatedParams);
  };

  const renderInput = (key: string, value: any) => {
    if (typeof value === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={value}
            onCheckedChange={(checked) => handleParamChange(key, String(checked))}
            disabled={useDefault}
          />
          <span className="text-sm text-muted-foreground">
            {value ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <Input
          className="font-mono text-sm"
          value={JSON.stringify(value)}
          onChange={(e) => handleParamChange(key, e.target.value)}
          placeholder="[value1, value2, ...]"
          disabled={useDefault}
        />
      );
    }

    return (
      <Input
        type={typeof value === 'number' ? 'number' : 'text'}
        value={String(value)}
        onChange={(e) => handleParamChange(key, e.target.value)}
        className={typeof value === 'number' ? 'font-mono' : ''}
        disabled={useDefault}
      />
    );
  };

  const formatParamName = (name: string) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card className="shadow-sm border-muted">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">{algorithm} Parameters</h3>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="use-default" className="text-sm cursor-pointer">
              Use defaults
            </Label>
            <Switch
              id="use-default"
              checked={useDefault}
              onCheckedChange={onToggleDefault}
            />
          </div>
        </div>

        {useDefault ? (
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Using default hyperparameters for {algorithm}
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={resetAllParameters}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset all parameters to default values</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <ScrollArea className="max-h-[500px] pr-3">
              <div className="space-y-4">
                {Object.entries(localParams).length > 0 ? (
                  Object.entries(localParams).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-[1fr,2fr] gap-4 items-center bg-card p-3 rounded-lg border border-border/60">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="font-normal py-1 px-2">
                          {formatParamName(key)}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-xs">
                                {typeof value === 'number' ? 'Numeric parameter' : 
                                 typeof value === 'boolean' ? 'Boolean toggle' : 
                                 Array.isArray(value) ? 'Array of values' : 'Text parameter'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderInput(key, value)}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => resetParameter(key)}
                              >
                                <RotateCcw className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reset to default</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    <p>Loading hyperparameters...</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HyperParameterEditor;
