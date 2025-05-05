
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from 'lucide-react';

interface JsonRendererProps {
  fileUrl: string;
  title?: string;
}

const JsonRenderer: React.FC<JsonRendererProps> = ({ fileUrl, title }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJson = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch JSON: ${response.status}`);
        }
        
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching JSON:", err);
        setError(err instanceof Error ? err.message : "Failed to load JSON");
      } finally {
        setIsLoading(false);
      }
    };

    if (fileUrl) {
      fetchJson();
    }
  }, [fileUrl]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || "JSON Data"}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || "JSON Data"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            Failed to load JSON: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "JSON Data"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-4 rounded-md overflow-x-auto">
          <pre className="text-xs font-mono whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default JsonRenderer;
