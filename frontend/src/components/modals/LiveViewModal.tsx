import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine
} from 'recharts';
import { 
  Flame, 
  Zap, 
  Wind, 
  AlertTriangle,
  Activity,
  Settings,
  X,
  Pause,
  BarChart3,
  Maximize2,
  Download,
  RefreshCw,
  Thermometer,
  Gauge,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface LiveViewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LiveViewModal({ isOpen, onClose }: LiveViewModalProps) {
  const [liveData, setLiveData] = useState({
    flameTemp: 1447,
    o2Level: 3.2,
    feedRate: 145,
    draft: -12,
    power: 4.2,
    vibration: 0.8,
    pressure: 1.2
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Generate time series data for charts
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const initialData = Array.from({ length: 60 }, (_, i) => {
        const time = new Date(now.getTime() - (59 - i) * 60000);
        return {
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temperature: 1447 + Math.sin(i / 10) * 15 + Math.random() * 5,
          o2: 3.2 + Math.sin(i / 8) * 0.3 + Math.random() * 0.1,
          feedRate: 145 + Math.sin(i / 12) * 5 + Math.random() * 2,
          draft: -12 + Math.sin(i / 15) * 2 + Math.random() * 0.5
        };
      });
      setChartData(initialData);
    }
  }, [isOpen]);

  // Simulate real-time data updates
  useEffect(() => {
    if (!isPaused && isOpen) {
      const interval = setInterval(() => {
        const newTemp = 1447 + Math.sin(Date.now() / 10000) * 15;
        const newO2 = 3.2 + Math.sin(Date.now() / 8000) * 0.3;
        const newFeedRate = 145 + Math.sin(Date.now() / 12000) * 5;
        const newDraft = -12 + Math.sin(Date.now() / 15000) * 2;

        setLiveData(prev => ({
          ...prev,
          flameTemp: newTemp,
          o2Level: newO2,
          feedRate: newFeedRate,
          draft: newDraft,
          power: 4.2 + Math.sin(Date.now() / 7000) * 0.5,
          vibration: 0.8 + Math.sin(Date.now() / 9000) * 0.2,
          pressure: 1.2 + Math.sin(Date.now() / 11000) * 0.3
        }));

        // Update chart data
        setChartData(prev => {
          const newData = [...prev.slice(1), {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            temperature: newTemp,
            o2: newO2,
            feedRate: newFeedRate,
            draft: newDraft
          }];
          return newData;
        });
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isPaused, isOpen]);

  const alerts = [
    { time: '14:23:15', message: 'Temperature spike detected', severity: 'warning', resolved: false },
    { time: '14:18:42', message: 'O2 level optimized automatically', severity: 'success', resolved: true },
    { time: '14:15:30', message: 'Feed rate adjustment completed', severity: 'info', resolved: true }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] p-0">
        <DialogHeader className="p-6 pb-0 border-b">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Activity className="h-6 w-6 text-destructive animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">🔴 LIVE OPERATIONS CENTER</h2>
                <p className="text-sm text-muted-foreground">Real-time plant monitoring with 5-second intervals</p>
              </div>
              <Badge variant="destructive" className="animate-pulse ml-4">
                LIVE
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {isPaused ? 'PAUSED' : 'UPDATING'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
            <TabsList className="mx-6 mt-4 w-fit">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="kiln">Kiln Monitoring</TabsTrigger>
              <TabsTrigger value="parameters">Live Parameters</TabsTrigger>
              <TabsTrigger value="alerts">Alert Center</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 p-6 pt-4 space-y-6 overflow-y-auto">
              {/* Key Metrics Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 border-l-4 border-l-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Thermometer className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Flame Temp</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-500">
                        {liveData.flameTemp.toFixed(0)}°C
                      </div>
                      <div className="text-xs text-muted-foreground">Target: 1,450°C</div>
                    </div>
                    <div className="text-right">
                      <Progress value={96} className="w-16 mb-1" />
                      <span className="text-xs">96%</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Wind className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">O2 Level</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-500">
                        {liveData.o2Level.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Range: 2.8-3.5%</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs ${liveData.o2Level >= 2.8 && liveData.o2Level <= 3.5 ? 'text-success' : 'text-warning'}`}>
                        {liveData.o2Level >= 2.8 && liveData.o2Level <= 3.5 ? '✅ OPTIMAL' : '⚠️ WATCH'}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Gauge className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Feed Rate</span>
                      </div>
                      <div className="text-2xl font-bold text-green-500">
                        {liveData.feedRate.toFixed(0)} t/h
                      </div>
                      <div className="text-xs text-muted-foreground">Target: 140-150 t/h</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-success">✅ ON TARGET</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">Power</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-500">
                        {liveData.power.toFixed(1)} MW
                      </div>
                      <div className="text-xs text-muted-foreground">Normal: 3.8-4.5 MW</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-success">✅ NORMAL</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Real-time Chart */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Live Temperature Trend (Last 60 minutes)
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="animate-pulse">
                      Live Data - 5s intervals
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <ReferenceLine y={1450} stroke="red" strokeDasharray="5 5" label="Target" />
                      <Line 
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="kiln" className="flex-1 p-6 pt-4 space-y-6 overflow-y-auto">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Flame className="h-6 w-6 text-orange-500" />
                  🔥 Rotary Kiln Operations
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">🌡️ TEMPERATURE PROFILE:</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span>Inlet Temperature:</span>
                        <span className="font-bold">1,050°C</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span>Flame Temperature:</span>
                        <span className="font-bold text-orange-500">{liveData.flameTemp.toFixed(0)}°C</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span>Outlet Temperature:</span>
                        <span className="font-bold">1,350°C</span>
                      </div>
                    </div>
                    
                    <div className="h-48 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="temperature" 
                            stroke="#f59e0b" 
                            strokeWidth={3}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">⚡ LIVE PARAMETERS:</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span>Fuel Rate:</span>
                          <span className="font-bold">45.2 kg/h</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">▲</Button>
                          <Button variant="outline" size="sm">▼</Button>
                          <span className="text-xs text-muted-foreground ml-2">Adjust</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span>Air Flow:</span>
                          <span className="font-bold">125 m³/min</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">▲</Button>
                          <Button variant="outline" size="sm">▼</Button>
                          <span className="text-xs text-muted-foreground ml-2">Adjust</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span>RPM:</span>
                          <span className="font-bold">2.5 rpm</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">▲</Button>
                          <Button variant="outline" size="sm">▼</Button>
                          <span className="text-xs text-muted-foreground ml-2">Adjust</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                      <h5 className="font-semibold mb-2">🎯 QUICK ACTIONS:</h5>
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3 mr-1" />
                          Manual Control
                        </Button>
                        <Button size="sm" variant="outline">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Auto Optimize
                        </Button>
                        <Button size="sm" variant="outline">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          View Trends
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Export Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="parameters" className="flex-1 p-6 pt-4 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Primary Parameters</h3>
                  <div className="space-y-4">
                    {[
                      { name: 'O2 Level', value: liveData.o2Level.toFixed(1), unit: '%', target: '2.8-3.5%', status: 'success' },
                      { name: 'Feed Rate', value: liveData.feedRate.toFixed(0), unit: 't/h', target: '140-150 t/h', status: 'success' },
                      { name: 'Draft', value: liveData.draft.toFixed(1), unit: 'mbar', target: '-10 to -15', status: 'success' },
                      { name: 'Power Consumption', value: liveData.power.toFixed(1), unit: 'MW', target: '3.8-4.5 MW', status: 'success' }
                    ].map((param, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <span className="font-medium">{param.name}</span>
                          <div className="text-xs text-muted-foreground">Target: {param.target}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">{param.value} {param.unit}</div>
                          <div className="text-xs text-success">✅ Normal</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Multi-Parameter Chart</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="o2" stroke="#3b82f6" strokeWidth={2} dot={false} name="O2 Level (%)" />
                        <Line type="monotone" dataKey="feedRate" stroke="#10b981" strokeWidth={2} dot={false} name="Feed Rate (t/h)" />
                        <Line type="monotone" dataKey="draft" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Draft (mbar)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="flex-1 p-6 pt-4 space-y-6 overflow-y-auto">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  🚨 Live Alert Center
                </h3>
                
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <div key={index} className={`p-3 rounded-lg border-l-4 ${
                      alert.severity === 'warning' ? 'border-l-warning bg-warning/10' :
                      alert.severity === 'success' ? 'border-l-success bg-success/10' :
                      'border-l-info bg-info/10'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {alert.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-warning" />}
                          {alert.severity === 'success' && <TrendingUp className="h-4 w-4 text-success" />}
                          {alert.severity === 'info' && <Activity className="h-4 w-4 text-info" />}
                          <span className="font-medium">{alert.message}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{alert.time}</Badge>
                          {alert.resolved && <Badge variant="outline" className="text-success">Resolved</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Controls */}
        <div className="p-6 border-t bg-muted/20">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant={isPaused ? "default" : "outline"}
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <RefreshCw className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                {isPaused ? 'Resume Updates' : 'Pause Updates'}
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configure Alerts
              </Button>
            </div>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close Live View
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}