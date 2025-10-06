import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { cementOSAPI } from '@/services/api';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Minimize2,
  Maximize2,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface ChatMessage {
  type: 'user' | 'bot';
  message: string;
  timestamp: string;
  processingTime?: number;
  isError?: boolean;
}

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      type: 'bot',
      message: 'Hello! I\'m CementOS AI Assistant. I can help you with plant operations, optimization, troubleshooting, and performance analysis. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  // Check API connection on mount
  useEffect(() => {
    checkAPIConnection();
  }, []);

  const checkAPIConnection = async () => {
    try {
      await cementOSAPI.healthCheck();
      setIsConnected(true);
      console.log('CementOS API connected successfully');
    } catch (error) {
      setIsConnected(false);
      console.error('Failed to connect to CementOS API:', error);
      toast({
        title: "API Connection Issue",
        description: "Using offline mode. Some features may be limited.",
        variant: "destructive",
      });
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      type: 'user' as const,
      message: message,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);
    const currentMessage = message;
    setMessage('');

    try {
      if (isConnected) {
        // Use real API
        const response = await cementOSAPI.sendMessage(currentMessage);
        
        if (response.success) {
          const aiMessage: ChatMessage = {
            type: 'bot' as const,
            message: response.response,
            timestamp: new Date(response.timestamp).toLocaleTimeString(),
            processingTime: response.processing_time_ms
          };
          setChatHistory(prev => [...prev, aiMessage]);
        } else {
          throw new Error('API returned unsuccessful response');
        }
      } else {
        // Fallback to simulated responses
        await new Promise(resolve => setTimeout(resolve, 1000));
        const responses = [
          'Based on current data, I recommend increasing alternative fuel usage by 5% to reduce CO2 emissions.',
          'Your energy efficiency is at 87.5%. I can help optimize thermal settings to reach 90%.',
          'I notice temperature fluctuations in the kiln. Would you like me to analyze the thermal patterns?',
          'Quality parameters look good. The recent C3S content adjustment is showing positive results.',
          'I can run a full plant optimization if you\'d like. This typically improves efficiency by 3-5%.',
          'Your NOx emissions are within limits. Alternative fuel ratio is performing well at current levels.',
          'I\'ve detected an opportunity to reduce energy consumption by optimizing mill operations. Shall I proceed?'
        ];

        const aiMessage: ChatMessage = {
          type: 'bot' as const,
          message: `[OFFLINE MODE] ${responses[Math.floor(Math.random() * responses.length)]}`,
          timestamp: new Date().toLocaleTimeString()
        };
        setChatHistory(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        type: 'bot' as const,
        message: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment, or contact support if the issue persists.',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setChatHistory(prev => [...prev, errorMessage]);
      
      toast({
        title: "Chat Error",
        description: "Failed to get response from AI assistant",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    '🔍 Check plant status',
    '⚡ Optimize energy usage',
    '🎯 Review quality metrics',
    '🌱 Analyze emissions',
    '📊 Generate report',
    '🚨 View alerts'
  ];

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
          size="sm"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
        <Badge className="absolute -top-2 -right-2 bg-destructive animate-pulse">
          AI
        </Badge>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      <Card className="w-[calc(100vw-1rem)] sm:w-96 h-[70vh] sm:h-[500px] flex flex-col shadow-2xl border rounded-lg sm:rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                CementOS AI
                {isConnected ? (
                  <CheckCircle className="h-3 w-3 text-green-300" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-yellow-300" />
                )}
              </h3>
              <p className="text-xs opacity-90 hidden sm:block">
                {isConnected ? 'Connected • Live AI' : 'Offline Mode • Limited Features'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={checkAPIConnection}
              className="text-primary-foreground hover:bg-primary-foreground/20 p-1 sm:p-2"
              title="Retry connection"
            >
              <Loader2 className={`h-3 w-3 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20 p-1 sm:p-2"
            >
              <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4 h-80">
              <div className="space-y-4">
                {chatHistory.map((chat, index) => (
                  <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      chat.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : chat.isError
                        ? 'bg-destructive/10 border border-destructive/20'
                        : 'bg-muted'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {chat.type === 'user' ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <Bot className={`h-3 w-3 ${chat.isError ? 'text-destructive' : ''}`} />
                        )}
                        <span className="text-xs opacity-75">
                          {chat.type === 'user' ? 'You' : 'CementOS AI'}
                        </span>
                        <span className="text-xs opacity-50 ml-auto">{chat.timestamp}</span>
                      </div>
                      <div className="text-sm">{chat.message}</div>
                      {chat.processingTime && (
                        <div className="text-xs opacity-60 mt-1">
                          ⚡ Processed in {Math.round(chat.processingTime)}ms
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="h-3 w-3" />
                        <span className="text-xs opacity-75">CementOS AI</span>
                        <Loader2 className="h-3 w-3 animate-spin ml-auto" />
                      </div>
                      <div className="text-sm opacity-70">
                        {isConnected ? 'Processing your request...' : 'Thinking offline...'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            <div className="p-2 border-t">
              <div className="flex flex-wrap gap-1 mb-2">
                {quickActions.slice(0, 3).map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => setMessage(action.substring(2))}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isConnected ? "Ask CementOS AI anything..." : "Ask questions (offline mode)..."}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                  className="flex-1 h-9"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSend} 
                  size="sm" 
                  className="h-9 w-9 p-0"
                  disabled={isLoading || !message.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
                {isConnected ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Connected to CementOS API
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                    Offline Mode - Limited Features
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
