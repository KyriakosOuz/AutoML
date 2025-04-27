
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Beaker, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ExperimentsEmptyStateProps {
  onRefresh: () => void;
}

const ExperimentsEmptyState: React.FC<ExperimentsEmptyStateProps> = ({ onRefresh }) => {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Beaker className="h-12 w-12 text-muted-foreground" />
        </div>
        <CardTitle>No Experiments Found</CardTitle>
        <CardDescription>
          You haven't trained any models yet. Start training to see your experiments here.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="text-center text-muted-foreground text-sm">
          Train a model to make predictions and analyze your data.
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-4">
        <Button asChild>
          <Link to="/training">Start Training</Link>
        </Button>
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExperimentsEmptyState;
