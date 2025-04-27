import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const TrainingHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dataset')}
          className="hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Model Training</h1>
          <p className="text-sm text-muted-foreground">
            Train and evaluate machine learning models
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrainingHeader;
