import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Settings,
  Download,
  RefreshCw,
  Leaf,
  DollarSign
} from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface AltFuelModalProps {
  children: React.ReactNode;
}

const altFuelData = [
  { time: '00:00', usage: 45, savings: 12, co2Reduction: 15, cost: 85 },
  { time: '04:00', usage: 46, savings: 13, co2Reduction: 16, cost: 84 },
  { time: '08:00', usage: 47, savings: 14, co2Reduction: 17, cost: 83 },
  { time: '12:00', usage: 48, savings: 15, co2Reduction: 18, cost: 82 },
  { time: '16:00', usage: 47, savings: 14, co2Reduction: 17, cost: 83 },
  { time: '20:00', usage: 46, savings: 13, co2Reduction: 16, cost: 84 },
  { time: '24:00', usage: 47, savings: 14, co2Reduction: 17, cost: 83 }
];

const fuelTypes = [
  { name: 'Biomass', percentage: 28, status: 'success', trend: '+2%' },
  { name: 'Waste Derived Fuel', percentage: 12, status: 'success', trend: '+5%' },
  { name: 'Tire Derived Fuel', percentage: 4, status: 'warning', trend: '-1%' },
  { name: 'Plastics', percentage: 3, status: 'success', trend: '+1%' }
];

const benefits = [
  { label: 'CO2 Reduction', value: '17%', icon: Leaf, color: 'text-success' },
  { label: 'Cost Savings', value: '$245/hour', icon: DollarSign, color: 'text-primary' },
  { label: 'Energy Recovery', value: '89%', icon: Flame, color: 'text-warning' },
  { label: 'Waste Diverted', value: '2.4 tons/day', icon: BarChart3, color: 'text-info' }
];

const recentOptimizations = [
  { time: '1 hour ago', action: 'Increased biomass ratio', impact: '+2% usage', operator: 'AI Agent' },
  { time: '3 hours ago', action: 'Optimized fuel mix', impact: '+1.5% efficiency', operator: 'AI Agent' },
  { time: '6 hours ago', action: 'Adjusted feed rate', impact: '+0.8% usage', operator: 'Manual' },
  { time: '8 hours ago', action: 'Quality check passed', impact: 'Maintained ratio', operator: 'AI Agent' }
];

export function AltFuelModal({ children }: AltFuelModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Flame className="h-6 w-6 text-warning" />
            </div>
            Alternative Fuel Usage Analysis
            <Badge variant="default" className="ml-auto">
              47% - Above Target
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Current Usage</span>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div className="text-2xl font-bold text-success">47%</div>
              <div className="text-xs text-muted-foreground">+3% from last week</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Target Achievement</span>
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div className="text-2xl font-bold">104.4%</div>
              <div className="text-xs text-muted-foreground">Above 45% target</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Cost Savings</span>
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">$245/hr</div>
              <div className="text-xs text-muted-foreground">vs conventional fuel</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">CO2 Reduction</span>
                <Leaf className="h-4 w-4 text-success" />
              </div>
              <div className="text-2xl font-bold text-success">17%</div>
              <div className="text-xs text-muted-foreground">Emissions saved</div>
            </Card>
          </div>

          {/* Usage Trend Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">24-Hour Alt Fuel Usage & Savings</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={altFuelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <ReferenceLine y={45} stroke="#ef4444" strokeDasharray="5 5" label="Target" />
                  <Bar 
                    dataKey="usage" 
                    fill="#f59e0b" 
                    name="Alt Fuel Usage (%)"
                    animationDuration={2000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="savings" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Cost Savings (%)"
                    dot={{ r: 4, fill: '#10b981' }}
                    activeDot={{ r: 6 }}
                    animationDuration={2500}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Fuel Breakdown & Benefits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fuel Type Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Fuel Type Breakdown</h3>
              <div className="space-y-4">
                {fuelTypes.map((fuel, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{fuel.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          fuel.status === 'success' ? 'text-success' : 'text-warning'
                        }`}>
                          {fuel.percentage}%
                        </span>
                        <span className="text-xs text-muted-foreground">{fuel.trend}</span>
                      </div>
                    </div>
                    <Progress value={fuel.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Environmental Benefits */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Environmental Benefits</h3>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg text-center">
                    <benefit.icon className={`h-8 w-8 mx-auto mb-2 ${benefit.color}`} />
                    <div className="font-bold text-lg">{benefit.value}</div>
                    <div className="text-xs text-muted-foreground">{benefit.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recent Optimizations */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent AI Optimizations</h3>
            <div className="space-y-3">
              {recentOptimizations.map((opt, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <div>
                      <div className="font-medium text-sm">{opt.action}</div>
                      <div className="text-xs text-muted-foreground">{opt.operator}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-success">{opt.impact}</div>
                    <div className="text-xs text-muted-foreground">{opt.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Optimize Mix
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Analysis
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
