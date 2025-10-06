import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Zap, 
  TrendingUp, 
  Settings, 
  BarChart3, 
  Download,
  Lightbulb,
  Clock,
  Target,
  TrendingDown
} from 'lucide-react';

interface EnergyEfficiencyPanelProps {
  children: React.ReactNode;
}

export function EnergyEfficiencyPanel({ children }: EnergyEfficiencyPanelProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  const energyBreakdown = [
    { name: 'Kiln Operation', percentage: 65, power: 2.8, color: 'bg-orange-500' },
    { name: 'Raw Mill', percentage: 20, power: 0.9, color: 'bg-blue-500' },
    { name: 'Fans & Blowers', percentage: 10, power: 0.4, color: 'bg-green-500' },
    { name: 'Auxiliaries', percentage: 5, power: 0.2, color: 'bg-purple-500' }
  ];

  const optimizationSuggestions = [
    {
      title: 'Reduce kiln RPM by 0.1',
      savings: '3% energy',
      impact: 'Medium',
      complexity: 'Low'
    },
    {
      title: 'Optimize mill airflow',
      savings: '2% energy',
      impact: 'Low',
      complexity: 'Medium'
    },
    {
      title: 'Schedule maintenance on Fan #3',
      savings: 'Prevent 8% loss',
      impact: 'High',
      complexity: 'High'
    }
  ];

  // Chart data for energy efficiency trends
  const hourlyTrendData = [
    { time: '00:00', efficiency: 85.2, consumption: 4.3 },
    { time: '02:00', efficiency: 86.1, consumption: 4.2 },
    { time: '04:00', efficiency: 87.5, consumption: 4.1 },
    { time: '06:00', efficiency: 88.2, consumption: 4.0 },
    { time: '08:00', efficiency: 87.8, consumption: 4.1 },
    { time: '10:00', efficiency: 87.2, consumption: 4.2 },
    { time: '12:00', efficiency: 88.5, consumption: 3.9 },
    { time: '14:00', efficiency: 89.1, consumption: 3.8 },
    { time: '16:00', efficiency: 87.9, consumption: 4.0 },
    { time: '18:00', efficiency: 86.8, consumption: 4.2 },
    { time: '20:00', efficiency: 87.5, consumption: 4.1 },
    { time: '22:00', efficiency: 87.3, consumption: 4.1 }
  ];

  // Pie chart data for energy breakdown
  const pieChartData = energyBreakdown.map(item => ({
    name: item.name,
    value: item.percentage,
    color: item.color.replace('bg-', '#').replace('-500', '')
  }));

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            Energy Efficiency Breakdown
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Current Status */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold">87.5%</p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-success font-medium">+2.3% vs yesterday</span>
                </div>
              </div>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                Above Target
              </Badge>
            </div>
          </Card>

          {/* Time Frame Selector */}
          <div className="flex gap-2">
            {['1h', '6h', '24h', '7d'].map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe)}
              >
                {timeframe}
              </Button>
            ))}
          </div>

          {/* Energy Breakdown */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Energy Consumption Breakdown
            </h3>
            
            <div className="space-y-4">
              {energyBreakdown.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{item.name}</span>
                    <div className="text-sm text-muted-foreground">
                      {item.percentage}% ({item.power} MW)
                    </div>
                  </div>
                  <div className="relative">
                    <div className="h-2 bg-muted rounded-full">
                      <div 
                        className={`h-2 ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Optimization Suggestions */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Optimization Suggestions
            </h3>
            
            <div className="space-y-3">
              {optimizationSuggestions.map((suggestion, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{suggestion.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.impact} Impact
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {suggestion.savings}
                    </span>
                    <span>Complexity: {suggestion.complexity}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Hourly Trend */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hourly Trend (Last 24h)
            </h3>
            
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="5 5" label="Target" />
                  <Line 
                    type="monotone" 
                    dataKey="efficiency" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                    name="Efficiency (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Energy Distribution Pie Chart */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Energy Distribution
            </h3>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Apply Suggestions
            </Button>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View History
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}