
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart } from 'lucide-react';
import { Link } from 'react-router-dom';

const ComparisonsTab: React.FC = () => {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <LineChart className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Comparisons Tab</h3>
        <p className="text-center text-gray-500 mb-4 max-w-md">
          This tab will allow you to compare multiple experiments side by side to evaluate performance differences between models.
        </p>
        <Button asChild>
          <Link to="/training">Start New Training</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ComparisonsTab;
