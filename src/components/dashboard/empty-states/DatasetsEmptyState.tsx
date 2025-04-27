
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DatasetsEmptyStateProps {
  onRefresh: () => void;
}

const DatasetsEmptyState: React.FC<DatasetsEmptyStateProps> = ({ onRefresh }) => {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Database className="h-12 w-12 text-muted-foreground" />
        </div>
        <CardTitle>No Datasets Found</CardTitle>
        <CardDescription>
          You haven't uploaded any datasets yet. Upload your first dataset to get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="text-center text-muted-foreground text-sm">
          Upload a CSV file to prepare your data for training machine learning models.
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-4">
        <Button asChild>
          <Link to="/dataset">Upload Dataset</Link>
        </Button>
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DatasetsEmptyState;
