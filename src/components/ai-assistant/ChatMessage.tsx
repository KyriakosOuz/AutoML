
import React from 'react';
import { cn } from '@/lib/utils';
import { AIMessage } from '@/contexts/AIAssistantContext';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: AIMessage;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Format the timestamp
  const formattedTime = message.timestamp 
    ? format(new Date(message.timestamp), 'h:mm a')
    : '';
  
  return (
    <div 
      className={cn(
        "flex w-full mb-4 animate-in fade-in-0",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div 
        className={cn(
          "flex items-start max-w-[80%] group",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar */}
        <div className={cn("flex-shrink-0", isUser ? "ml-2" : "mr-2")}>
          <Avatar className="h-8 w-8">
            {isUser ? (
              <>
                <AvatarFallback className="bg-primary text-white">U</AvatarFallback>
                <AvatarImage src="/placeholder.svg" />
              </>
            ) : (
              <>
                <AvatarFallback className="bg-purple-600 text-white">AI</AvatarFallback>
                <AvatarImage src="/placeholder.svg" />
              </>
            )}
          </Avatar>
        </div>
        
        {/* Message bubble */}
        <div 
          className={cn(
            "py-2 px-3 rounded-lg",
            isUser 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted"
          )}
        >
          {message.loading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          ) : (
            <>
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              <div className={cn(
                "text-xs mt-1 opacity-70",
                isUser ? "text-right" : "text-left"
              )}>
                {formattedTime}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
