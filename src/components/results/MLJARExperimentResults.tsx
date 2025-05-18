import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DownloadCloud, FileText, RefreshCw } from 'lucide-react';
import { downloadFile } from '@/components/training/prediction/utils/downloadUtils';
import { ExperimentResults } from '@/types/training';
import { useToast } from '@/hooks/use-toast';
import ModelInterpretabilityPlots from './ModelInterpretabilityPlots';

interface MLJARExperimentResultsProps {
  experimentId: string | null;
  status: string;
  experimentResults: ExperimentResults | null;
  isLoading: boolean;
  error: string | null;
  onReset: () => void;
  onRefresh: () => void;
}

const MLJARExperimentResults: React.FC<MLJARExperimentResultsProps> = ({
  experimentId,
  status,
  experimentResults,
  isLoading,
  error,
  onReset,
  onRefresh,
}) => {
  const { toast } = useToast();

  const handleDownloadModel = async (url: string, filename: string) => {
    try {
      await downloadFile(url, filename);
    } catch (err) {
      console.error("Download failed:", err);
      toast({
        title: "Download Error",
        description: "Failed to download the model file.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Results</CardTitle>
          <CardDescription>Fetching experiment results...</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load experiment results.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!experimentResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Results</CardTitle>
          <CardDescription>Experiment results not available.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>No data to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="metrics" className="w-full">
      <TabsList>
        <TabsTrigger value="metrics">Metrics</TabsTrigger>
        {experimentResults?.files?.some(file => file.file_type?.includes('pdp_') || file.file_type?.includes('ice_') || 
                           experimentResults?.pdp_ice_metadata?.length > 0) && (
          <TabsTrigger value="interpretability">Interpretability</TabsTrigger>
        )}
        {experimentResults.files && experimentResults.files.length > 0 && (
          <TabsTrigger value="files">Files</TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="metrics">
        <Card>
          <CardHeader>
            <CardTitle>Metrics</CardTitle>
            <CardDescription>Model performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {experimentResults.training_results && experimentResults.training_results.metrics ? (
              <ul>
                {Object.entries(experimentResults.training_results.metrics).map(([key, value]) => (
                  <li key={key}>
                    {key}: {value}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No metrics available.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {experimentResults?.files?.some(file => file.file_type?.includes('pdp_') || file.file_type?.includes('ice_') || 
                           experimentResults?.pdp_ice_metadata?.length > 0) && (
        <TabsContent value="interpretability" key="interpretability">
          <ModelInterpretabilityPlots experiment={experimentResults} />
        </TabsContent>
      )}

      <TabsContent value="files">
        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
            <CardDescription>Download experiment-related files</CardDescription>
          </CardHeader>
          <CardContent>
            {experimentResults.files && experimentResults.files.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {experimentResults.files.map((file) => (
                  <Card key={file.file_url}>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">{file.file_type}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-center"
                        onClick={() => handleDownloadModel(file.file_url, file.file_type)}
                      >
                        <DownloadCloud className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <FileText className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No files available.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default MLJARExperimentResults;
