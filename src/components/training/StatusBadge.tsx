
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

// Update the Status type to include all statuses used in the application
export type Status = 'processing' | 'running' | 'completed' | 'failed' | 'success' | 'idle' | 'error';

interface StatusBadgeProps {
  status: Status;
  className?: string; // Add className prop to allow customization
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'running':
      case 'processing':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'idle':
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <Badge variant="outline" className={`${getStatusColor(status)} flex items-center gap-1 ${className || ''}`}>
      {(status === 'running' || status === 'processing') && <Loader2 className="h-3 w-3 animate-spin" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default StatusBadge;
