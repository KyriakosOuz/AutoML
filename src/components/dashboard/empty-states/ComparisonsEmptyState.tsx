
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComparisonsEmptyStateProps {
  onRefresh: () => void;
}

const ComparisonsEmptyState: React.FC<ComparisonsEmptyStateProps> = ({ onRefresh }) => {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <BarChart3 className="h-12 w-12 text-muted-foreground" />
        </div>
        <CardTitle>No Comparisons Found</CardTitle>
        <CardDescription>
          You haven't saved any model comparisons yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="text-center text-muted-foreground text-sm">
          Create comparisons by selecting multiple experiments in the Experiments tab.
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-4">
        <Button asChild>
          <Link to="/dashboard?tab=experiments">Go to Experiments</Link>
        </Button>
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ComparisonsEmptyState;
