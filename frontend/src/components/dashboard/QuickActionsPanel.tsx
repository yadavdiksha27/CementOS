import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  BarChart3, 
  TestTube, 
  MessageSquare, 
  Zap, 
  Target, 
  Leaf, 
  Download,
  Play,
  Pause,
  Square,
  RefreshCw,
  Bot,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Flame
} from 'lucide-react';

interface QuickActionsPanelProps {
  onStartOptimization?: (type: string) => void;
  onGenerateReport?: (type: string) => void;
  onStartSimulation?: (config: any) => void;
}

export function QuickActionsPanel({ 
  onStartOptimization, 
  onGenerateReport, 
  onStartSimulation 
}: QuickActionsPanelProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      type: 'ai',
      message: 'Hello! I can help you optimize plant operations, analyze performance data, or answer questions about cement production. What would you like to know?',
      timestamp: '10:30 AM'
    }
  ]);

  const handleOptimization = async (type: string) => {
    setIsOptimizing(true);
    setOptimizationProgress(0);
    
    // Simulate optimization process
    const interval = setInterval(() => {
      setOptimizationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsOptimizing(false);
          return 100;
        }
        return prev + 5;
      });
    }, 200);

    onStartOptimization?.(type);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    const userMessage = {
      type: 'user',
      message: chatMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        'Based on current data, I recommend increasing alternative fuel usage by 5% to reduce CO2 emissions without affecting quality.',
        'Your energy efficiency is currently at 87.5%. I can help you implement thermal optimization to reach 90%.',
        'Quality score is excellent at 94.2%. The recent C3S content adjustment is working well.',
        'I notice a minor temperature fluctuation in the kiln. Would you like me to suggest corrective actions?',
        'Your plant is performing 3% better than industry average. Great work on the recent optimizations!'
      ];

      const aiMessage = {
        type: 'ai',
        message: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistory(prev => [...prev, aiMessage]);
    }, 1000);

    setChatMessage('');
  };

  const quickActions = [
    {
      id: 'energy-optimization',
      title: 'Energy Optimization',
      description: 'Optimize thermal and electrical energy consumption',
      icon: <Zap className="h-5 w-5 text-energy" />,
      color: 'bg-energy/10',
      estimatedTime: '15-20 minutes',
      expectedSavings: '5-8% energy reduction',
      action: () => handleOptimization('energy')
    },
    {
      id: 'quality-enhancement',
      title: 'Quality Enhancement',
      description: 'Optimize quality parameters while maintaining efficiency',
      icon: <Target className="h-5 w-5 text-primary" />,
      color: 'bg-primary/10',
      estimatedTime: '25-30 minutes',
      expectedSavings: '2-3% quality improvement',
      action: () => handleOptimization('quality')
    },
    {
      id: 'emissions-reduction',
      title: 'Emissions Reduction',
      description: 'Maximize alternative fuel usage to reduce CO2',
      icon: <Leaf className="h-5 w-5 text-success" />,
      color: 'bg-success/10',
      estimatedTime: '30-45 minutes',
      expectedSavings: '10-15% CO2 reduction',
      action: () => handleOptimization('emissions')
    }
  ];

  const reportTypes = [
    {
      id: 'daily-summary',
      title: 'Daily Operations Summary',
      description: 'Comprehensive daily performance report',
      duration: '2-3 minutes',
      includes: ['Production metrics', 'Energy consumption', 'Quality data', 'Agent performance']
    },
    {
      id: 'efficiency-analysis',
      title: 'Efficiency Analysis Report',
      description: 'Deep dive into energy and operational efficiency',
      duration: '5-7 minutes',
      includes: ['Energy trends', 'Efficiency benchmarks', 'Optimization opportunities', 'Cost analysis']
    },
    {
      id: 'sustainability-report',
      title: 'Sustainability Report',
      description: 'Environmental impact and sustainability metrics',
      duration: '3-5 minutes',
      includes: ['CO2 emissions', 'Alternative fuel usage', 'Waste reduction', 'Compliance status']
    }
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Settings className="h-5 w-5" />
        Quick Actions
      </h3>
      
      <div className="space-y-3">
        {/* Run Optimization */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full justify-start" variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              Run Optimization
              {isOptimizing && <Badge className="ml-auto animate-pulse">Running</Badge>}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Plant Optimization Center</DialogTitle>
            </DialogHeader>
            
            {isOptimizing ? (
              <div className="space-y-4">
                <Alert>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Optimization in progress... Analyzing current parameters and calculating optimal settings.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{optimizationProgress}%</span>
                  </div>
                  <Progress value={optimizationProgress} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>Data Collection Complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Calculating Optimizations</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Select an optimization strategy to improve plant performance automatically.
                </p>
                
                <div className="grid gap-4">
                  {quickActions.map((action) => (
                    <Card key={action.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={action.action}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${action.color}`}>
                          {action.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{action.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{action.description}</p>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {action.estimatedTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {action.expectedSavings}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Generate Report */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Report Generation Center</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Generate comprehensive reports for performance analysis and compliance.
              </p>
              
              <div className="space-y-3">
                {reportTypes.map((report) => (
                  <Card key={report.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{report.title}</h4>
                      <Badge variant="outline">{report.duration}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                    <div className="mb-3">
                      <Label className="text-xs font-medium">Includes:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {report.includes.map((item, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => onGenerateReport?.(report.id)}
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Generate & Download
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Start Simulation */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full justify-start" variant="outline">
              <TestTube className="h-4 w-4 mr-2" />
              Start Simulation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quick Simulation Setup</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sim-objective">Objective</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select objective" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quality">Quality Optimization</SelectItem>
                      <SelectItem value="efficiency">Energy Efficiency</SelectItem>
                      <SelectItem value="emissions">CO2 Reduction</SelectItem>
                      <SelectItem value="production">Production Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="sim-duration">Duration</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="sim-speed">Simulation Speed</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select speed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1x">1x Real-time</SelectItem>
                    <SelectItem value="5x">5x Speed</SelectItem>
                    <SelectItem value="10x">10x Speed</SelectItem>
                    <SelectItem value="20x">20x Speed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Alert>
                <TestTube className="h-4 w-4" />
                <AlertDescription>
                  This will start a new simulation with default parameters. For advanced configuration, use the Testing Lab.
                </AlertDescription>
              </Alert>
              
              <Button className="w-full" onClick={() => onStartSimulation?.({})}>
                <Play className="h-4 w-4 mr-2" />
                Start Simulation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Chat with AI */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full justify-start" variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat with AI
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Plant Assistant
                <Badge variant="outline" className="ml-auto">
                  <div className="w-2 h-2 bg-success rounded-full mr-1"></div>
                  Online
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col h-96">
              <div className="flex-1 overflow-y-auto space-y-3 p-2 border rounded-lg bg-muted/20">
                {chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 mt-4">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask about plant operations, optimization, or performance..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setChatMessage('How can I improve energy efficiency?')}>
                  Energy Tips
                </Button>
                <Button variant="outline" size="sm" onClick={() => setChatMessage('Show me current plant status')}>
                  Plant Status
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
