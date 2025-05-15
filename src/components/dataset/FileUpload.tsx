import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi, Dataset } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UploadCloud, X, AlertCircle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customMissingSymbol, setCustomMissingSymbol] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { toast } = useToast();
  
  const { 
    updateState, 
    setIsLoading, 
    setError,
    resetState,
    isLoading, 
    error,
    setProcessingButtonClicked
  } = useDataset();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    toast({
      title: "File selected",
      description: `Selected file: ${file.name}`,
    });
  };

  const handleUploadClick = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      setIsLoading(true);
      setUploadProgress(10);
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      console.log('Uploading file:', selectedFile.name);
      
      // Create FormData and append the file and optional missing symbol
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (customMissingSymbol) {
        formData.append('missing_symbol', customMissingSymbol);
      }
      
      const response = await datasetApi.uploadDataset(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      console.log('Upload response:', response);
      
      // Extract the dataset data from the response, handling both formats
      let datasetData: any;
      let overviewData: any = {};
      
      // If response has a data property with dataset_id, it's the ApiResponse format
      if (response && response.data && typeof response.data === 'object' && 'dataset_id' in response.data) {
        console.log('Processing ApiResponse format');
        datasetData = response.data as any;
        overviewData = datasetData.overview || {};
      } 
      // If response has dataset_id directly, it's the Dataset format
      else if (response && 'dataset_id' in response) {
        console.log('Processing direct Dataset format');
        datasetData = response as any;
        overviewData = datasetData.overview || {};
      } else {
        throw new Error('Invalid response format from server');
      }
      
      // Debug log the missing values information
      console.log('Extracted missing values:', {
        totalMissing: overviewData.total_missing_values,
        missingByColumn: overviewData.missing_values_count,
      });
      
      const numericalFeatures = overviewData.numerical_features || [];
      const categoricalFeatures = overviewData.categorical_features || [];
      
      // Create a properly structured overview object
      const datasetOverview = {
        num_rows: overviewData.num_rows || 0,
        num_columns: overviewData.num_columns || 0,
        missing_values: overviewData.missing_values || {}, 
        numerical_features: numericalFeatures,
        categorical_features: categoricalFeatures,
        total_missing_values: overviewData.total_missing_values || 0,
        missing_values_count: overviewData.missing_values_count || {},
        column_names: overviewData.column_names || [],
        unique_values_count: overviewData.unique_values_count || {},
        data_types: overviewData.data_types || {},
        feature_classification: overviewData.feature_classification || {}
      };
      
      console.log('Updating state with overview:', datasetOverview);
      
      // Reset processingButtonClicked when uploading a new dataset
      setProcessingButtonClicked(false);
      
      // Update the dataset context with the new information
      updateState({
        datasetId: datasetData.dataset_id,
        fileUrl: datasetData.file_url,
        overview: datasetOverview,
        previewColumns: [...numericalFeatures, ...categoricalFeatures],
        processingStage: 'raw',
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Upload successful",
        description: "Your dataset has been uploaded successfully",
      });
      
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload dataset');
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to upload dataset',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartOver = () => {
    resetState();
    setProcessingButtonClicked(false);
    toast({
      title: "Dataset Reset",
      description: "All dataset processing has been reset. You can now start over.",
      duration: 3000,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Dataset Upload</CardTitle>
        <CardDescription>
          Upload a CSV file to start analyzing and processing your dataset
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer mb-4 transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
            ${isLoading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            className="hidden"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            disabled={isLoading}
          />
          
          <UploadCloud className="h-12 w-12 mx-auto mb-2 text-primary/60" />
          
          {selectedFile ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelectedFile();
                }}
                className="rounded-full bg-gray-200 p-1 hover:bg-gray-300"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Drag and drop your CSV file here
              </p>
              <p className="text-xs text-gray-500">
                or click to browse your files
              </p>
            </div>
          )}
        </div>
        
        {uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
        
        <div className="mb-4">
          <Label htmlFor="missing-symbol" className="text-sm font-medium">
            Custom Missing Value Symbol (Optional)
          </Label>
          <Input
            id="missing-symbol"
            type="text"
            placeholder="e.g., NA, ?, -"
            value={customMissingSymbol}
            onChange={(e) => setCustomMissingSymbol(e.target.value)}
            className="mt-1"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            If your dataset uses specific symbols to represent missing values, enter them here
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button 
          onClick={handleStartOver} 
          variant="outline"
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Start Over
        </Button>
        <Button 
          onClick={handleUploadClick} 
          disabled={!selectedFile || isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? 'Uploading...' : 'Upload Dataset'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FileUpload;
