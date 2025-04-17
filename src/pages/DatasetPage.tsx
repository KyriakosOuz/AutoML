
import React from 'react';
import { DatasetProvider } from '@/contexts/DatasetContext';
import DatasetPageContent from '@/components/dataset/DatasetPageContent';

// Helper function to format task type to a more readable format
const formatTaskType = (type: string | null): string => {
  if (!type) return "Unknown";
  
  // Split by underscore and capitalize each word
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const DatasetPage: React.FC = () => {
  return (
    <DatasetProvider>
      <DatasetPageContent formatTaskType={formatTaskType} />
    </DatasetProvider>
  );
};

export default DatasetPage;
