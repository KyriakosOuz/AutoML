
import React from 'react';
import { Steps, Step } from '@/components/ui/steps';

const TrainingSteps: React.FC = () => {
  return (
    <div className="mb-6 p-4 border rounded-lg bg-background">
      <h3 className="text-lg font-medium mb-4">Training Progress</h3>
      <Steps active={1} className="max-w-3xl mx-auto">
        <Step title="Preparation" description="Data preparation" />
        <Step title="Training" description="Model training in progress" />
        <Step title="Evaluation" description="Performance evaluation" />
        <Step title="Completion" description="Training completed" />
      </Steps>
    </div>
  );
};

export default TrainingSteps;
