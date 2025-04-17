
import React from 'react';
import { DatasetProvider } from '@/contexts/DatasetContext';
import DatasetPageContent from '@/components/dataset/DatasetPageContent';

const DatasetPage: React.FC = () => {
  return (
    <DatasetProvider>
      <DatasetPageContent />
    </DatasetProvider>
  );
};

export default DatasetPage;
