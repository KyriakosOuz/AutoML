
import React from 'react';
import { DashboardProvider } from '@/contexts/DashboardContext';
import DashboardContent from '@/components/dashboard/DashboardContent';

const DashboardPage: React.FC = () => {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
};

export default DashboardPage;
