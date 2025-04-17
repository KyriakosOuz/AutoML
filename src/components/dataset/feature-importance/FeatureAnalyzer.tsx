
import React from 'react';
import { useDataset } from '@/contexts/DatasetContext';

interface FeatureAnalyzerProps {
  selectedFeatures: string[];
}

const FeatureAnalyzer: React.FC<FeatureAnalyzerProps> = ({
  selectedFeatures
}) => {
  const { targetColumn } = useDataset();
  
  return (
    <div className="mb-6">
      <div className="mt-4 text-center text-sm text-gray-500">
        This will calculate the importance of each selected feature in predicting the target variable
      </div>
    </div>
  );
};

export default FeatureAnalyzer;
