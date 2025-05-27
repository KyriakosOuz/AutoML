
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DownloadCloud } from 'lucide-react';
import { ExperimentResults } from '@/types/training';
import { downloadFile } from '@/components/training/prediction/utils/downloadUtils';
import NewMLJARCharts from './NewMLJARCharts';

interface MLJARExperimentResultsProps {
  results: ExperimentResults;
}

const MLJARExperimentResults: React.FC<MLJARExperimentResultsProps> = ({ results }) => {
  const { files = [], training_results, metrics = {} } = results;

  const handleFileDownload = async (url: string, filename: string) => {
    try {
      await downloadFile(url, filename);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Filter files for different purposes
  const csvFiles = files.filter(file => 
    file.file_type?.includes('csv') || file.file_url?.includes('.csv')
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">MLJAR AutoML</Badge>
        {results.task_type && (
          <Badge variant="secondary">
            {results.task_type.replace('_', ' ')}
          </Badge>
        )}
        {results.target_column && (
          <Badge variant="secondary">
            Target: {results.target_column}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Experiment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Model</p>
                  <p className="text-sm text-muted-foreground">
                    {results.model_display_name || results.algorithm || 'AutoML'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm text-muted-foreground">{results.status}</p>
                </div>
                {results.training_time && (
                  <div>
                    <p className="text-sm font-medium">Training Time</p>
                    <p className="text-sm text-muted-foreground">{results.training_time}s</p>
                  </div>
                )}
                {results.completed_at && (
                  <div>
                    <p className="text-sm font-medium">Completed</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(results.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {Object.keys(metrics).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(metrics).map(([key, value]) => (
                <Card key={key}>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm capitalize">
                      {key.replace('_', ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {typeof value === 'number' ? 
                        value >= 0 && value <= 1 ? 
                          `${(value * 100).toFixed(2)}%` : 
                          value.toFixed(4) 
                        : value}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-muted-foreground">No metrics available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="charts">
          <NewMLJARCharts files={files} />
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          {files.length > 0 ? (
            <div className="space-y-2">
              {files.map((file, idx) => (
                <Card key={idx}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {file.file_type?.replace('_', ' ') || 'File'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file.file_name || `File ${idx + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(file.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleFileDownload(
                        file.file_url, 
                        file.file_name || `${file.file_type || 'file'}.${file.file_url.split('.').pop()}`
                      )}
                    >
                      <DownloadCloud className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-muted-foreground">No files available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MLJARExperimentResults;
