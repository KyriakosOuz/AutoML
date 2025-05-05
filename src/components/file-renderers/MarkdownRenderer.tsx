
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from 'lucide-react';

interface MarkdownRendererProps {
  fileUrl: string;
  title?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ fileUrl, title }) => {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch markdown: ${response.status}`);
        }
        
        const text = await response.text();
        setContent(text);
      } catch (err) {
        console.error("Error fetching markdown:", err);
        setError(err instanceof Error ? err.message : "Failed to load markdown");
      } finally {
        setIsLoading(false);
      }
    };

    if (fileUrl) {
      fetchMarkdown();
    }
  }, [fileUrl]);

  const renderMarkdown = (markdown: string) => {
    // Simple markdown renderer - for a production app, use a library like react-markdown
    return markdown.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-bold mt-3 mb-2">{line.substring(4)}</h3>;
      }
      
      // Lists
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-4">{line.substring(2)}</li>;
      }
      if (line.match(/^\d+\. /)) {
        const numMatch = line.match(/^(\d+)\. /);
        if (numMatch) {
          return <li key={i} className="ml-4">{line.substring(numMatch[0].length)}</li>;
        }
      }
      
      // Code blocks
      if (line.startsWith('```')) {
        return <pre key={i} className="bg-muted p-2 rounded my-2 overflow-x-auto"><code>{line.substring(3)}</code></pre>;
      }
      
      // Bold and italic
      let processed = line;
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Empty line is paragraph break
      if (line.trim() === '') {
        return <br key={i} />;
      }
      
      // Default paragraph
      return <p key={i} className="my-2" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || "Markdown"}</CardTitle>
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
          <CardTitle>{title || "Markdown"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            Failed to load markdown: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Markdown"}</CardTitle>
      </CardHeader>
      <CardContent className="prose max-w-none">
        {content && renderMarkdown(content)}
      </CardContent>
    </Card>
  );
};

export default MarkdownRenderer;
