
import React from 'react';
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
} from '@/components/ui/dialog';
import { MessageSquare, X } from 'lucide-react';
import ChatPanel from './ChatPanel';

const FloatingChatButton: React.FC = () => {
  const { isChatOpen, openChat, closeChat } = useAIAssistant();
  
  // Handle dialog state changes
  const handleOpenChange = (open: boolean) => {
    if (open) {
      openChat();
    } else {
      closeChat();
    }
  };
  
  return (
    <Dialog open={isChatOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          size="icon" 
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg"
        >
          {isChatOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <MessageSquare className="h-5 w-5" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] h-[600px] p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>ieeAutoML Assistant</DialogTitle>
        </DialogHeader>
        <ChatPanel />
      </DialogContent>
    </Dialog>
  );
};

export default FloatingChatButton;
