
import React from 'react';
import { DatasetProvider } from '@/contexts/DatasetContext';
import DatasetPageContent from '@/components/dataset/DatasetPageContent';
import { useAuth } from '@/contexts/AuthContext';

const DatasetPage: React.FC = () => {
  return (
    <DatasetProvider>
      <DatasetPageContent />
    </DatasetProvider>
  );
};

export default DatasetPage;
