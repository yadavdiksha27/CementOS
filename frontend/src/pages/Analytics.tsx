import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart,
  Bar,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Zap,
  Target,
  Leaf,
  Calendar,
  Download,
  Mail,
  RefreshCw,
  Clock,
  Maximize2,
  Filter,
  Settings
} from 'lucide-react';

const timePeridods = ['Last Hour', 'Last Day', 'Last Week', 'Last Month', 'Last Quarter'];

// Detailed time-series data for line charts
const energyTrendsData = [
  { time: '00:00', efficiency: 85.2, consumption: 3.4, target: 85 },
  { time: '04:00', efficiency: 86.1, consumption: 3.3, target: 85 },
  { time: '08:00', efficiency: 87.5, consumption: 3.2, target: 85 },
  { time: '12:00', efficiency: 88.2, consumption: 3.1, target: 85 },
  { time: '16:00', efficiency: 87.8, consumption: 3.2, target: 85 },
  { time: '20:00', efficiency: 86.9, consumption: 3.3, target: 85 },
  { time: '24:00', efficiency: 87.5, consumption: 3.2, target: 85 }
];

const qualityTrendsData = [
  { time: '00:00', quality: 92.8, c3s: 56.2, fCao: 1.4, target: 90 },
  { time: '04:00', quality: 93.2, c3s: 56.8, fCao: 1.3, target: 90 },
  { time: '08:00', quality: 94.1, c3s: 57.1, fCao: 1.2, target: 90 },
  { time: '12:00', quality: 94.8, c3s: 57.5, fCao: 1.1, target: 90 },
  { time: '16:00', quality: 94.2, c3s: 57.2, fCao: 1.2, target: 90 },
  { time: '20:00', quality: 93.9, c3s: 56.9, fCao: 1.3, target: 90 },
  { time: '24:00', quality: 94.2, c3s: 57.0, fCao: 1.2, target: 90 }
];

const emissionsTrendsData = [
  { time: '00:00', co2: 125, nox: 280, pm: 15, target: 125 },
  { time: '04:00', co2: 123, nox: 275, pm: 14, target: 125 },
  { time: '08:00', co2: 120, nox: 265, pm: 13, target: 125 },
  { time: '12:00', co2: 117, nox: 250, pm: 12, target: 125 },
  { time: '16:00', co2: 118, nox: 255, pm: 12, target: 125 },
  { time: '20:00', co2: 120, nox: 260, pm: 13, target: 125 },
  { time: '24:00', co2: 118, nox: 245, pm: 12, target: 125 }
];

const performanceData = {
  energy: { current: 87.5, trend: 2.3, target: 85 },
  quality: { current: 94.2, trend: 1.1, target: 90 },
  emissions: { current: 118, trend: -5.2, target: 125 }
};

const plantComparison = [
  { name: 'Delhi Plant', efficiency: 87.5, quality: 94.2, cost: 42, environmental: 91 },
  { name: 'Mumbai Plant', efficiency: 84.2, quality: 91.8, cost: 48, environmental: 88 },
  { name: 'Bangalore Plant', efficiency: 82.1, quality: 89.5, cost: 52, environmental: 85 },
  { name: 'Chennai Plant', efficiency: 85.8, quality: 92.1, cost: 45, environmental: 89 }
];

const agentPerformance = [
  { name: 'Orchestrator', successRate: 99.8, responseTime: 0.3, accuracy: 97.2 },
  { name: 'TSR Agent', successRate: 98.2, responseTime: 0.8, accuracy: 96.8 },
  { name: 'Quality Agent', successRate: 99.5, responseTime: 0.2, accuracy: 98.7 },
  { name: 'Clinker Agent', successRate: 99.1, responseTime: 0.5, accuracy: 97.9 }
];

const reports = [
  { name: 'Daily Operations Summary', schedule: 'Auto-generated at 6 AM', enabled: true },
  { name: 'Weekly Sustainability Report', schedule: 'Mondays', enabled: true },
  { name: 'Monthly Executive Dashboard', schedule: '1st of each month', enabled: true },
  { name: 'Quarterly Compliance Report', schedule: 'End of quarter', enabled: false }
];

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('Last Week');
  const [selectedView, setSelectedView] = useState('overview');

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Comprehensive performance insights and trends</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Enhanced Time Period Selector */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <span className="font-medium text-sm sm:text-base">Time Period:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {timePeridods.map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className="text-xs px-2 sm:px-3"
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Configure</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Comprehensive Charts Section */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="energy">Energy Trends</TabsTrigger>
          <TabsTrigger value="quality">Quality Analysis</TabsTrigger>
          <TabsTrigger value="emissions">Emissions Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Overview Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-energy" />
                  <span className="font-semibold">Energy Efficiency</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-energy mb-1">
                  {performanceData.energy.current}%
                </div>
                <div className="flex items-center justify-center gap-1 text-sm text-success">
                  <TrendingUp className="h-4 w-4" />
                  +{performanceData.energy.trend}%
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={energyTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="5 5" />
                    <Area 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="#f59e0b" 
                      fill="#f59e0b" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Quality Score</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-primary mb-1">
                  {performanceData.quality.current}%
                </div>
                <div className="flex items-center justify-center gap-1 text-sm text-success">
                  <TrendingUp className="h-4 w-4" />
                  +{performanceData.quality.trend}%
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={qualityTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="5 5" />
                    <Line 
                      type="monotone" 
                      dataKey="quality" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-success" />
                  <span className="font-semibold">CO2 Emissions</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-success mb-1">
                  {performanceData.emissions.current} kg/t
                </div>
                <div className="flex items-center justify-center gap-1 text-sm text-success">
                  <TrendingDown className="h-4 w-4" />
                  {performanceData.emissions.trend}%
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={emissionsTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <ReferenceLine y={125} stroke="#ef4444" strokeDasharray="5 5" />
                    <Area 
                      type="monotone" 
                      dataKey="co2" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="energy" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Zap className="h-6 w-6 text-energy" />
              Energy Consumption Analysis
            </h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={energyTrendsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                      backdropFilter: 'blur(8px)'
                    }}
                  />
                  <Legend />
                  <ReferenceLine yAxisId="left" y={85} stroke="#ef4444" strokeDasharray="5 5" label="Target" />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="efficiency" 
                    stroke="#f59e0b" 
                    fill="url(#colorEfficiency)"
                    fillOpacity={0.8}
                    name="Efficiency (%)"
                    animationDuration={2000}
                    animationBegin={0}
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="consumption" 
                    fill="url(#colorConsumption)"
                    name="Consumption (GJ/ton)"
                    animationDuration={2500}
                    animationBegin={300}
                    radius={[2, 2, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Quality Metrics Deep Dive
            </h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={qualityTrendsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="5 5" label="Target" />
                  <Line 
                    type="monotone" 
                    dataKey="quality" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    name="Quality Score"
                    dot={{ r: 4, fill: '#8884d8', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2, fill: '#fff' }}
                    animationDuration={2000}
                    animationBegin={0}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="c3s" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="C3S Content (%)"
                    dot={{ r: 3, fill: '#82ca9d', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 5, stroke: '#82ca9d', strokeWidth: 2, fill: '#fff' }}
                    animationDuration={2500}
                    animationBegin={200}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fCao" 
                    stroke="#ffc658" 
                    strokeWidth={2}
                    name="Free CaO (%)"
                    dot={{ r: 3, fill: '#ffc658', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 5, stroke: '#ffc658', strokeWidth: 2, fill: '#fff' }}
                    animationDuration={2500}
                    animationBegin={400}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="emissions" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Leaf className="h-6 w-6 text-success" />
              Emissions Monitoring & Control
            </h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={emissionsTrendsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <ReferenceLine yAxisId="left" y={125} stroke="#ef4444" strokeDasharray="5 5" label="CO2 Target" />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="co2" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3}
                    name="CO2 (kg/ton)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="nox" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="NOx (mg/Nm³)"
                    dot={{ r: 3 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="pm" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="PM (mg/Nm³)"
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plant Performance Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Plant Performance Comparison
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Plant</th>
                <th className="text-center p-2">Energy Efficiency</th>
                <th className="text-center p-2">Quality Score</th>
                <th className="text-center p-2">Cost per Ton</th>
                <th className="text-center p-2">Environmental Score</th>
              </tr>
            </thead>
            <tbody>
              {plantComparison.map((plant, index) => (
                <tr key={plant.name} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-medium">
                    {plant.name}
                    {index === 0 && <span className="ml-2 text-yellow-500">⭐</span>}
                  </td>
                  <td className="text-center p-2">{plant.efficiency}%</td>
                  <td className="text-center p-2">{plant.quality}%</td>
                  <td className="text-center p-2">${plant.cost}</td>
                  <td className="text-center p-2">{plant.environmental}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Agent Performance & Reports */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        

        {/* Automated Reports */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Automated Reports
          </h3>
          
          <div className="space-y-4">
            {reports.map((report, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{report.name}</h4>
                    <p className="text-sm text-muted-foreground">{report.schedule}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${report.enabled ? 'bg-success' : 'bg-muted'}`} />
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Mail className="h-4 w-4 mr-1" />
              Email Now
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}