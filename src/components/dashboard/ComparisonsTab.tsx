
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, BarChart4, FileText, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ComparisonExperiment {
  experiment_id: string;
  experiment_name: string;
  created_at: string;
  task_type: string;
  algorithm: string;
  engine: string;
  metrics: Record<string, number>;
  dataset_name: string;
}

const ComparisonsTab: React.FC = () => {
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<ComparisonExperiment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // This function would be called when redirected from the Experiments tab with selected experiments
  const fetchComparison = async (experimentIds: string[]) => {
    if (experimentIds.length < 2) {
      setError("You must select at least 2 experiments to compare");
      return;
    }

    setIsComparing(true);
    setError(null);

    try {
      const formData = new FormData();
      experimentIds.forEach(id => {
        formData.append('experiment_ids', id);
      });

      const response = await fetch('/comparisons/compare/', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to compare experiments');
      }

      setComparisonResults(data.comparison || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during comparison');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to compare experiments',
        variant: "destructive",
      });
    } finally {
      setIsComparing(false);
    }
  };

  const formatMetric = (value: number) => {
    return (value >= 0 && value <= 1) ? `${(value * 100).toFixed(2)}%` : value.toFixed(4);
  };

  if (comparisonResults.length > 0) {
    // Get all unique metrics across all experiments
    const allMetricKeys = new Set<string>();
    comparisonResults.forEach(exp => {
      Object.keys(exp.metrics).forEach(key => allMetricKeys.add(key));
    });
    const metricKeys = Array.from(allMetricKeys);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart4 className="h-5 w-5 mr-2" />
            Experiment Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Experiment Name</TableHead>
                        <TableHead>Dataset</TableHead>
                        <TableHead>Algorithm</TableHead>
                        <TableHead>Engine</TableHead>
                        <TableHead>Task Type</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonResults.map((exp) => (
                        <TableRow key={exp.experiment_id}>
                          <TableCell className="font-medium">{exp.experiment_name}</TableCell>
                          <TableCell>{exp.dataset_name}</TableCell>
                          <TableCell>{exp.algorithm}</TableCell>
                          <TableCell>{exp.engine}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {exp.task_type.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(exp.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Metrics Comparison</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        {comparisonResults.map((exp) => (
                          <TableHead key={exp.experiment_id}>{exp.experiment_name}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metricKeys.map((metric) => (
                        <TableRow key={metric}>
                          <TableCell className="font-medium capitalize">
                            {metric.replace(/_/g, ' ')}
                          </TableCell>
                          {comparisonResults.map((exp) => (
                            <TableCell key={exp.experiment_id} className="font-mono">
                              {exp.metrics[metric] !== undefined 
                                ? formatMetric(exp.metrics[metric])
                                : 'N/A'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <p className="text-center text-gray-500 mb-4">
            Please select experiments to compare from the Experiments tab.
          </p>
          <Button asChild>
            <Link to="/dashboard?tab=experiments">Go to Experiments</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <LineChart className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Experiments Selected for Comparison</h3>
        <p className="text-center text-gray-500 mb-4 max-w-md">
          Select experiments from the Experiments tab and click "Compare" to view a side-by-side comparison of their performance.
        </p>
        <Button asChild>
          <Link to="/dashboard?tab=experiments">Go to Experiments</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ComparisonsTab;
