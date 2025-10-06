import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cementOSAPI } from '@/services/api';
import { CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export function APIStatusIndicator() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>('');

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      await cementOSAPI.healthCheck();
      setIsConnected(true);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (error) {
      setIsConnected(false);
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={
          isConnected === null ? "outline" :
          isConnected ? "default" : "destructive"
        }
        className="flex items-center gap-1"
      >
        {isChecking ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isConnected === null ? (
          <AlertCircle className="h-3 w-3" />
        ) : isConnected ? (
          <CheckCircle className="h-3 w-3" />
        ) : (
          <AlertCircle className="h-3 w-3" />
        )}
        
        {isConnected === null ? 'Checking...' :
         isConnected ? 'CementOS API Connected' : 'API Offline'}
      </Badge>
      
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={checkConnection}
        disabled={isChecking}
        className="h-6 w-6 p-0"
      >
        <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
      </Button>
      
      {lastChecked && (
        <span className="text-xs text-muted-foreground">
          Last: {lastChecked}
        </span>
      )}
    </div>
  );
}
