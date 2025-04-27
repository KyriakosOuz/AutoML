
import React from 'react';
import { Link } from 'react-router-dom';
import { Database, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardHeaderProps {
  user: any;
  signOut: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  signOut,
}) => {
  return (
    <header className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
          <Database className="h-5 w-5" />
          AutoML Web App
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 hidden md:block">
            {user?.email}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={signOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">ML Experiments Dashboard</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          View, manage, and analyze your machine learning experiments. Track performance metrics, 
          download models, and compare different training runs.
        </p>
      </div>
    </header>
  );
};

export default DashboardHeader;
