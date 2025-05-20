
import React, { useEffect, useRef } from 'react';
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, X, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';

const ChatPanel: React.FC = () => {
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    closeChat, 
    clearMessages,
    suggestedPrompts
  } = useAIAssistant();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b bg-background">
        <h3 className="font-medium">ieeAutoML Assistant</h3>
        <div className="flex items-center space-x-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear conversation history</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all messages in this conversation. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearMessages}>
                  Clear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeChat}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Messages area */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <h3 className="text-lg font-medium mb-2">ieeAutoML Assistant</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ask me about ML metrics, model results, and concepts. I can help interpret your model performance and explain machine learning concepts.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </>
        )}
        
        {/* Loading indicator */}
        {isLoading && !messages.some(m => m.loading) && (
          <div className="flex justify-center my-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </ScrollArea>
      
      {/* Input area */}
      <ChatInput 
        onSendMessage={sendMessage} 
        isLoading={isLoading}
        suggestedPrompts={suggestedPrompts}
      />
    </div>
  );
};

export default ChatPanel;
