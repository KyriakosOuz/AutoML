
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { comparisonsApi, Comparison, ComparisonResult } from '@/lib/dashboardApi';
import { Eye, Trash2, Loader } from 'lucide-react';

const ComparisonsTab = () => {
  const { toast } = useToast();
  const [selectedComparison, setSelectedComparison] = useState<Comparison | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  
  const { 
    data: comparisons = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['comparisons'],
    queryFn: () => comparisonsApi.listComparisons(),
  });

  const handleViewComparison = async (comparison: Comparison) => {
    setSelectedComparison(comparison);
    setIsComparing(true);
    
    try {
      const result = await comparisonsApi.compareExperiments(comparison.experiment_ids);
      setComparisonResult(result);
    } catch (error) {
      toast({
        title: "Comparison Error",
        description: error instanceof Error ? error.message : "Failed to compare experiments",
        variant: "destructive",
      });
    } finally {
      setIsComparing(false);
    }
  };

  const handleDeleteComparison = async (comparisonId: string) => {
    try {
      await comparisonsApi.deleteComparison(comparisonId);
      toast({
        title: "Success",
        description: "Comparison deleted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Delete Error",
        description: error instanceof Error ? error.message : "Failed to delete comparison",
        variant: "destructive",
      });
    }
  };

  const formatMetricValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toFixed(4);
    }
    return String(value);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading comparisons...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>
          {error instanceof Error ? error.message : "An error occurred while fetching comparisons"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Your Comparisons</h2>
        <Button onClick={() => refetch()}>Refresh</Button>
      </div>

      {/* Comparison Results Dialog */}
      <Dialog>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedComparison?.name || 'Experiment Comparison'}
            </DialogTitle>
          </DialogHeader>
          {isComparing ? (
            <div className="flex justify-center items-center p-8">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Comparing experiments...</span>
            </div>
          ) : comparisonResult ? (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Metrics Comparison</h3>
              
              {comparisonResult.task_type === 'regression' ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      {comparisonResult.experiments.map(exp => (
                        <TableHead key={exp.experiment_id}>{exp.experiment_name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonResult.metrics_comparison.map((metric, i) => (
                      <TableRow key={i}>
                        {Object.entries(metric).map(([key, value], j) => (
                          <TableCell key={j}>{formatMetricValue(value)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Tabs defaultValue="metrics" className="w-full">
                  <TabsList>
                    <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
                    <TabsTrigger value="confusion">Confusion Matrices</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="metrics">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          {comparisonResult.experiments.map(exp => (
                            <TableHead key={exp.experiment_id}>{exp.experiment_name}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {['accuracy', 'precision', 'recall', 'f1_score'].map(metric => (
                          <TableRow key={metric}>
                            <TableCell className="font-medium capitalize">{metric.replace('_', ' ')}</TableCell>
                            {comparisonResult.experiments.map(exp => (
                              <TableCell key={exp.experiment_id}>
                                {formatMetricValue(exp.metrics?.[metric] || 'N/A')}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  
                  <TabsContent value="confusion">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {comparisonResult.experiments.map(exp => (
                        <Card key={exp.experiment_id}>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-2">{exp.experiment_name}</h4>
                            {exp.metrics?.confusion_matrix ? (
                              <div className="relative overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Actual / Predicted</TableHead>
                                      <TableHead>Class 0</TableHead>
                                      <TableHead>Class 1</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    <TableRow>
                                      <TableCell className="font-medium">Class 0</TableCell>
                                      <TableCell>{exp.metrics.confusion_matrix[0][0]}</TableCell>
                                      <TableCell>{exp.metrics.confusion_matrix[0][1]}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">Class 1</TableCell>
                                      <TableCell>{exp.metrics.confusion_matrix[1][0]}</TableCell>
                                      <TableCell>{exp.metrics.confusion_matrix[1][1]}</TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No confusion matrix available</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No comparison data available</p>
          )}
        </DialogContent>
      </Dialog>

      {comparisons.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-muted-foreground mb-4">No saved comparisons found.</p>
            <p className="text-sm text-muted-foreground">
              Go to the Experiments tab to select and save experiments for comparison.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Experiments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisons.map((comparison) => (
                <TableRow key={comparison.comparison_id}>
                  <TableCell className="font-medium">{comparison.name}</TableCell>
                  <TableCell>{new Date(comparison.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{comparison.experiment_ids?.length || 0} experiments</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* View Comparison Button */}
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleViewComparison(comparison)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>

                      {/* Delete Comparison Dialog */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Comparison</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this comparison? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteComparison(comparison.comparison_id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ComparisonsTab;
