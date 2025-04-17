
import React, { useState, useRef } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Upload, File, X } from 'lucide-react';

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const { 
    setDatasetId, 
    setFileUrl, 
    setOverview,
    setPreviewData,
    setPreviewColumns,
    setIsLoading,
    setError,
    setProcessingStage
  } = useDataset();
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check for CSV files
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        setUploadError('Only CSV files are supported.');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError('Please select a file to upload.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setIsLoading(true);
      
      // Upload the file
      const response = await datasetApi.uploadDataset(file);
      console.log('Upload response:', response);
      
      // Extract data from response
      if (response && response.data) {
        // Update context with response data
        setDatasetId(response.data.dataset_id);
        setFileUrl(response.data.file_url);
        setOverview(response.data.overview);
        setProcessingStage('raw');
        
        // Get preview data
        const previewResponse = await datasetApi.previewDataset(response.data.dataset_id);
        
        if (previewResponse && previewResponse.data) {
          setPreviewData(previewResponse.data.preview);
          setPreviewColumns(previewResponse.data.columns);
        }
        
        setUploadSuccess(true);
        toast({
          title: "Upload Successful",
          description: "Your dataset has been uploaded successfully.",
          duration: 3000,
        });
        
        // Call onUploadSuccess callback if provided
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setIsLoading(false);
    }
  };

  const resetFileInput = () => {
    setFile(null);
    setUploadSuccess(false);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Upload Dataset</CardTitle>
        <CardDescription>
          Upload your CSV file to start the data analysis process
        </CardDescription>
      </CardHeader>
      <CardContent>
        {uploadError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="dataset-file">Dataset File (CSV)</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                id="dataset-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
                disabled={uploading}
              />
              {file && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={resetFileInput}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {file && (
            <div className="flex items-center space-x-2 text-sm">
              <File className="h-4 w-4 text-primary" />
              <span>{file.name}</span>
              <span className="text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? (
            <>Uploading...</>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Dataset
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FileUpload;
