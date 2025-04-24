import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingApi } from '@/lib/api';
import { ExperimentResults } from '@/types/training';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Award,
  DownloadCloud,
  Loader,
  RefreshCw,
  Check,
  Link,
  Copy,
  AlertTriangle
} from 'lucide-react';

const ExperimentResultsView: React.FC<{ experimentId: string; onReset: () => void }> = ({ 
  experimentId, 
  onReset 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [results, setResults] = useState<ExperimentResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('metrics');
  const [copied, setCopied] = useState(false);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await trainingApi.getExperimentResults(experimentId);
        setResults(data);
        setError(null);
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch experiment results. Please try again.');
        setLoading(false);
        toast({
          title: "Network Error",
          description: "Failed to connect to the server. Please check your connection.",
          variant: "destructive"
        });
      }
    };

    fetchResults();
  }, [experimentId, toast]);

  const copyExperimentId = () => {
    if (experimentId) {
      navigator.clipboard.writeText(experimentId);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Experiment ID copied to clipboard"
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyShareableLink = () => {
    const url = `${window.location.origin}/results/${experimentId}`;
    navigator.clipboard.writeText(url);
    setShareUrlCopied(true);
    toast({
      title: "Copied!",
      description: "Shareable link copied to clipboard"
    });
    setTimeout(() => setShareUrlCopied(false), 2000);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader className="animate-spin h-6 w-6" />
        <span className="ml-2">Loading results...</span>
      </div>
    );
  }

  if (!results) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No results found for this experiment.</AlertDescription>
      </Alert>
    );
  }

  const { training_results, files = [] } = results;
  const metrics = training_results?.metrics || {};
  const modelFile = files.find(file => file.file_type === 'model');
  const visualizationFiles = files.filter(file => file.file_type !== 'model');

  return (
    <div className="space-y-6">
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
          <TabsTrigger value="download">Download</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {Object.entries(metrics).map(([key, value]) => (
              <Card key={key}>
                <CardHeader className="py-4">
                  <CardTitle className="text-sm capitalize">{key.replace('_', ' ')}</CardTitle>
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

          {training_results?.y_true && training_results?.y_pred && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Predictions vs Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-border px-4 py-2">#</th>
                        <th className="border border-border px-4 py-2">Actual</th>
                        <th className="border border-border px-4 py-2">Predicted</th>
                        {training_results.y_probs && (
                          <th className="border border-border px-4 py-2">Confidence</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(training_results.y_true) && 
                       Array.isArray(training_results.y_pred) && 
                       training_results.y_true.slice(0, 10).map((actual, index) => (
                        <tr key={index}>
                          <td className="border border-border px-4 py-2">{index + 1}</td>
                          <td className="border border-border px-4 py-2">{actual}</td>
                          <td className="border border-border px-4 py-2">
                            {training_results.y_pred[index]}
                          </td>
                          {training_results.y_probs && (
                            <td className="border border-border px-4 py-2">
                              {Array.isArray(training_results.y_probs[index]) ? 
                                `${(Math.max(...training_results.y_probs[index]) * 100).toFixed(2)}%` : 
                                'N/A'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {Array.isArray(training_results.y_true) && training_results.y_true.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing 10 of {training_results.y_true.length} predictions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="visualizations">
          {visualizationFiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {visualizationFiles.map((file, idx) => (
                <Dialog key={idx}>
                  <DialogTrigger asChild>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
                          <img 
                            src={file.file_url} 
                            alt={file.file_type} 
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="mt-2">
                          <p className="font-medium text-sm capitalize">
                            {file.file_type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(file.created_at).toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <div className="p-1">
                      <img 
                        src={file.file_url} 
                        alt={file.file_type} 
                        className="w-full rounded-md"
                      />
                      <div className="mt-2 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium capitalize">
                            {file.file_type.replace('_', ' ')}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(file.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                            <DownloadCloud className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-muted-foreground">No visualizations available</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="download">
          <div className="py-6">
            {modelFile ? (
              <Card>
                <CardHeader>
                  <CardTitle>Download Trained Model</CardTitle>
                  <CardDescription>
                    Download the trained model file to use in your applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <Button asChild>
                      <a href={modelFile.file_url} download target="_blank" rel="noopener noreferrer">
                        <DownloadCloud className="h-4 w-4 mr-2" />
                        Download Model
                      </a>
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Created: {new Date(modelFile.created_at).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-muted-foreground">No model file available for download</p>
              </div>
            )}
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Share Experiment</h3>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm">Experiment ID:</p>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{experimentId}</code>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={copyExperimentId}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy Experiment ID</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={copyShareableLink}>
                    {shareUrlCopied ? <Check className="h-4 w-4 mr-2" /> : <Link className="h-4 w-4 mr-2" />}
                    Copy Shareable Link
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExperimentResultsView;
