
import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { HyperParameter, HyperParameters } from '@/types/training';
import { Card, CardContent } from '@/components/ui/card';

interface HyperParameterEditorProps {
  hyperparameters: HyperParameters;
  onChange: (params: HyperParameters) => void;
}

const HyperParameterEditor: React.FC<HyperParameterEditorProps> = ({
  hyperparameters,
  onChange,
}) => {
  const [localParams, setLocalParams] = useState<HyperParameters>(hyperparameters);

  useEffect(() => {
    setLocalParams(hyperparameters);
  }, [hyperparameters]);

  const handleParamChange = (key: string, value: string) => {
    const updatedParams = { ...localParams };
    const originalValue = hyperparameters[key];
    let convertedValue: HyperParameter;

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

  const renderInput = (key: string, value: HyperParameter) => {
    if (typeof value === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={value}
            onCheckedChange={(checked) => handleParamChange(key, String(checked))}
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
        />
      );
    }

    return (
      <Input
        type={typeof value === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => handleParamChange(key, e.target.value)}
        className={typeof value === 'number' ? 'font-mono' : ''}
      />
    );
  };

  return (
    <div className="grid gap-6">
      {Object.entries(localParams).map(([key, value]) => (
        <Card key={key} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium capitalize">
                {key.split('_').join(' ')}
              </Label>
              {renderInput(key, value)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default HyperParameterEditor;
