
import React from 'react';

interface DynamicPredictionFormProps {
  experimentId: string;
}

const DynamicPredictionForm: React.FC<DynamicPredictionFormProps> = ({ experimentId }) => {
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Make Predictions</h2>
      <p className="text-muted-foreground mb-4">
        Using experiment ID: {experimentId}
      </p>
      <p>Prediction form implementation goes here.</p>
    </div>
  );
};

export default DynamicPredictionForm;
