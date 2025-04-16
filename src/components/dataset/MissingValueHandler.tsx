
import React, { useState } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Wand2, AlertCircle, Info, CheckCircle2, BadgeAlert } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

type ImputationStrategy = 'mean' | 'median' | 'mode' | 'hot_deck' | 'drop' | 'skip';

const MissingValueHandler: React.FC = () => {
  const [strategy, setStrategy] = useState<ImputationStrategy>('mode');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { 
    datasetId, 
    overview, 
    updateState,
    setProcessingStage
  } = useDataset();

  // Detect if there are missing values
  const hasMissingValues = overview?.total_missing_values ? overview.total_missing_values > 0 : false;
  
  // Show which columns have missing values
  const missingValueColumns = overview?.missing_values_count ? 
    Object.entries(overview.missing_values_count)
      .filter(([_, count]) => count > 0)
      .map(([column, count]) => ({ column, count, percentage: (count / (overview.num_rows || 1)) * 100 }))
      .sort((a, b) => b.count - a.count) : 
    [];

  const totalRows = overview?.num_rows || 0;
  const totalMissingCells = overview?.total_missing_values || 0;
  const totalCells = totalRows * (overview?.num_columns || 0);
  const overallMissingPercentage = totalCells > 0 ? (totalMissingCells / totalCells) * 100 : 0;

  const handleProcessMissingValues = async (e: React.FormEvent) => {
    // Prevent default to avoid any navigation
    e.preventDefault();
    
    if (!datasetId) {
      setError('No dataset selected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await datasetApi.handleMissingValues(
        datasetId, 
        strategy
      );
      
      // Update context with response data and set processing stage to 'cleaned'
      updateState({
        datasetId: response.dataset_id,
        fileUrl: response.file_url,
        overview: response.overview,
        processingStage: 'cleaned'
      });
      
      toast({
        title: "Missing values processed",
        description: `Successfully handled missing values using ${strategy} strategy.`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Error handling missing values:', error);
      setError(error instanceof Error ? error.message : 'Failed to process missing values');
    } finally {
      setIsLoading(false);
    }
  };

  if (!datasetId || !overview) {
    return null;
  }

  return (
    <Card className="w-full mt-6 overflow-hidden border border-gray-100 shadow-md rounded-xl">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="flex items-center gap-2 text-xl text-primary">
          <BadgeAlert className="h-5 w-5" />
          Missing Values Analysis
        </CardTitle>
        <CardDescription>
          {hasMissingValues 
            ? `Your dataset has ${overview.total_missing_values} missing values that need to be handled` 
            : `Your dataset doesn't have missing values or they've been handled`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasMissingValues ? (
          <div className="space-y-4">
            <Alert variant={overallMissingPercentage > 20 ? "destructive" : "warning"} className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Missing Data Summary</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <p>
                  Your dataset has <strong>{totalMissingCells}</strong> missing values out of <strong>{totalCells}</strong> cells ({overallMissingPercentage.toFixed(2)}% of data is missing).
                </p>
                <div className="w-full mt-1">
                  <Progress value={overallMissingPercentage} className="h-2" />
                  <p className="text-xs text-right mt-1">{overallMissingPercentage.toFixed(2)}% missing</p>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
                    <TableHead>Missing Values</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missingValueColumns.map(({ column, count, percentage }) => (
                    <TableRow key={column}>
                      <TableCell className="font-medium">{column}</TableCell>
                      <TableCell>{count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="h-2 w-24" />
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {percentage > 50 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            High
                          </span>
                        ) : percentage > 20 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Medium
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Low
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mt-4">
              <h4 className="text-sm font-medium mb-3">Select a strategy to handle missing values:</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Select
                    value={strategy}
                    onValueChange={(value) => setStrategy(value as ImputationStrategy)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="strategy">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mean">Mean (for numerical values)</SelectItem>
                      <SelectItem value="median">Median (for numerical values)</SelectItem>
                      <SelectItem value="mode">Mode (most frequent value)</SelectItem>
                      <SelectItem value="hot_deck">Hot Deck (random sampling)</SelectItem>
                      <SelectItem value="drop">Drop rows with missing values</SelectItem>
                      <SelectItem value="skip">Skip (keep missing values)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-white p-3 rounded-md border border-gray-200">
                  <h5 className="text-xs font-medium text-gray-700 mb-1">Strategy Description</h5>
                  <p className="text-xs text-gray-600">
                    {strategy === 'mean' && 'Replace missing values with the mean (average) of each column. Only works with numerical data.'}
                    {strategy === 'median' && 'Replace missing values with the median (middle value) of each column. Only works with numerical data.'}
                    {strategy === 'mode' && 'Replace missing values with the most frequent value in each column. Works with both numerical and categorical data.'}
                    {strategy === 'hot_deck' && 'Replace missing values with randomly selected values from the same column. Maintains the natural distribution of data.'}
                    {strategy === 'drop' && 'Remove all rows that contain any missing values. This may significantly reduce your dataset size.'}
                    {strategy === 'skip' && 'Keep missing values as they are. Some machine learning algorithms cannot handle missing values.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Alert variant="success" className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>All Data Is Complete</AlertTitle>
            <AlertDescription>
              Your dataset has no missing values or they have been successfully handled.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 border-t border-gray-100 gap-2 flex justify-end">
        <form onSubmit={handleProcessMissingValues} className="w-full flex justify-end">
          <Button 
            type="submit"
            disabled={isLoading || !hasMissingValues}
            variant="default"
            size="lg"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {isLoading ? 'Processing...' : 'Process Missing Values'}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default MissingValueHandler;
