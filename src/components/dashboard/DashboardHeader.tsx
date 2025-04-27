
import React from 'react';
import { LayoutDashboard } from 'lucide-react';

const DashboardHeader: React.FC = () => {
  return (
    <div className="flex flex-col space-y-2">
      <h1 className="text-3xl font-bold flex items-center">
        <LayoutDashboard className="h-8 w-8 mr-2" />
        Dashboard
      </h1>
      <p className="text-muted-foreground">
        Manage your datasets, experiments, and comparisons
      </p>
    </div>
  );
};

export default DashboardHeader;
