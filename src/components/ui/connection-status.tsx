
import React from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected';
  message?: string;
  className?: string;
}

export function ConnectionStatus({ status, message, className }: ConnectionStatusProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 text-sm rounded-full",
      status === 'connected' && "bg-green-500/10 text-green-600",
      status === 'connecting' && "bg-yellow-500/10 text-yellow-600",
      status === 'disconnected' && "bg-red-500/10 text-red-600",
      className
    )}>
      {status === 'connected' && <Wifi className="h-4 w-4" />}
      {status === 'connecting' && <AlertTriangle className="h-4 w-4" />}
      {status === 'disconnected' && <WifiOff className="h-4 w-4" />}
      <span>
        {message || status}
      </span>
    </div>
  );
}
