import React from 'react';
import { cn } from '@/lib/utils';

type ChatMessageProps = {
  message: string;
  type: 'user' | 'bot';
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, type }) => {
  return (
    <div 
      className={cn(
        "p-3 rounded-lg max-w-[80%]",
        type === 'user' 
          ? "bg-primary text-primary-foreground ml-auto" 
          : "bg-muted text-muted-foreground"
      )}
    >
      {message}
    </div>
  );
};

export default ChatMessage;
