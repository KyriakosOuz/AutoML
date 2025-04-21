
import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { HyperParameters } from '@/types/training';

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

    // Convert the value based on the original type
    const originalValue = hyperparameters[key];
    let convertedValue: string | number | boolean | number[];

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

  const renderInput = (key: string, value: string | number | boolean | number[]) => {
    if (typeof value === 'boolean') {
      return (
        <Switch
          checked={value}
          onCheckedChange={(checked) => handleParamChange(key, String(checked))}
        />
      );
    }

    if (Array.isArray(value)) {
      return (
        <Input
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
      />
    );
  };

  return (
    <div className="grid gap-4">
      {Object.entries(localParams).map(([key, value]) => (
        <div key={key} className="grid gap-2">
          <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
          {renderInput(key, value)}
        </div>
      ))}
    </div>
  );
};

export default HyperParameterEditor;
