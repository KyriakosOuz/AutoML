
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ExperimentsTab: React.FC = () => {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <BarChart2 className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Experiments Tab</h3>
        <p className="text-center text-gray-500 mb-4 max-w-md">
          This tab will display all your machine learning experiments, allowing you to view details, compare results, and manage your models.
        </p>
        <Button asChild>
          <Link to="/training">Start New Training</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExperimentsTab;
