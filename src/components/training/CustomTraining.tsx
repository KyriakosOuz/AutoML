import React from 'react';
import { Card } from '@/components/ui/card';
import { useTraining } from '@/contexts/TrainingContext';

const CustomTraining: React.FC = () => {
  const { isTraining } = useTraining();
  
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Custom Model Training</h2>
        {/* Add your custom training form here */}
        <p className="text-muted-foreground">
          Configure and train your custom model
        </p>
      </div>
    </Card>
  );
};

export default CustomTraining;
