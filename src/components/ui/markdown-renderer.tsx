
import React from 'react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Simple markdown renderer that handles basic markdown syntax
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  // Convert markdown to HTML (basic implementation)
  const renderMarkdown = (markdown: string) => {
    if (!markdown) return '';
    
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-5 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-7 mb-4">$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gm, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/gm, '<em>$1</em>');
    
    // Lists
    html = html.replace(/^\* (.*$)/gm, '<li class="ml-6">$1</li>');
    html = html.replace(/^- (.*$)/gm, '<li class="ml-6">$1</li>');
    html = html.replace(/^(\d+)\. (.*$)/gm, '<li class="ml-6">$2</li>');
    html = html.replace(/<\/li>\n<li class="ml-6">/g, '</li>\n<li class="ml-6">');
    html = html.replace(/<li class="ml-6">(.+?)(?=\n<li class="ml-6">|\n|$)/gm, '<li class="ml-6">$1</li>');
    html = html.replace(/(^<li class="ml-6">.*?<\/li>\n)+/gm, '<ul class="list-disc mb-4">$&</ul>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gm, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>');
    
    // Code blocks
    html = html.replace(/```([^`]+)```/gm, '<pre class="bg-muted p-3 rounded-md overflow-x-auto my-4"><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/gm, '<code class="bg-muted px-1 py-0.5 rounded">$1</code>');
    
    // Blockquotes
    html = html.replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-muted-foreground/30 pl-4 italic my-4">$1</blockquote>');
    
    // Paragraphs
    html = html.replace(/^\s*(\n)?(.+)/gm, function(m) {
      return /\<(\/)?(h1|h2|h3|h4|h5|h6|ul|ol|li|blockquote|pre|code)/gm.test(m) ? m : '<p class="mb-4">' + m + '</p>';
    });
    
    // Clean up
    html = html.replace(/[\n\r]/g, '');
    html = html.replace(/<\/p><p class="mb-4">/g, '</p>\n<p class="mb-4">');
    html = html.replace(/<p class="mb-4"><\/p>/g, '');
    
    return html;
  };

  return (
    <div 
      className={cn("prose prose-slate dark:prose-invert max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} 
    />
  );
};

export default MarkdownRenderer;
