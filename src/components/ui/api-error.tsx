
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConnectionStatus } from '@/components/ui/connection-status';

interface ApiErrorProps {
  title?: string;
  error: Error | string;
  onRetry?: () => void;
  showConnectionStatus?: boolean;
}

export function ApiError({ 
  title = 'Error', 
  error, 
  onRetry,
  showConnectionStatus = true
}: ApiErrorProps) {
  const errorMessage = error instanceof Error ? error.message : error;
  const isConnectionError = errorMessage.toLowerCase().includes('connection') ||
                          errorMessage.toLowerCase().includes('network') ||
                          errorMessage.toLowerCase().includes('server');
  
  return (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {title}
        {showConnectionStatus && isConnectionError && (
          <ConnectionStatus 
            status="disconnected"
            message="Connection Lost"
            className="ml-2"
          />
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">{errorMessage}</p>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
