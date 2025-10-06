import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Leaf, 
  Target, 
  Zap, 
  Flame, 
  TrendingDown,
  BarChart3,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';

interface CO2EmissionsModalProps {
  children: React.ReactNode;
}

export function CO2EmissionsModal({ children }: CO2EmissionsModalProps) {
  const [newTarget, setNewTarget] = useState('125');
  const [isOptimizing, setIsOptimizing] = useState(false);

  const emissionsSources = [
    { name: 'Fuel Combustion', percentage: 65, amount: 76.7, color: 'bg-orange-500' },
    { name: 'Limestone Calcination', percentage: 30, amount: 35.4, color: 'bg-blue-500' },
    { name: 'Electricity Grid', percentage: 5, amount: 5.9, color: 'bg-green-500' }
  ];

  const fuelMixScenarios = [
    { 
      name: 'Current Mix', 
      altFuel: 47, 
      emissions: 118, 
      status: 'current',
      description: 'Current operational state'
    },
    { 
      name: 'Optimized Mix', 
      altFuel: 55, 
      emissions: 108, 
      status: 'projected',
      description: 'AI-recommended optimization'
    },
    { 
      name: 'Maximum Alt Fuel', 
      altFuel: 65, 
      emissions: 102, 
      status: 'potential',
      description: 'Technical limit scenario'
    }
  ];

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => setIsOptimizing(false), 3000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-success/10 rounded-lg">
              <Leaf className="h-6 w-6 text-success" />
            </div>
            CO2 Emissions Control Center
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <Card className="p-4 border-l-4 border-l-success">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold">118 kg/ton</p>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-success" />
                  <span className="text-success font-medium">-5% reduction</span>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Below Target
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Target: &lt;125 kg/ton</p>
                <Progress value={85} className="w-32 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">15% to limit</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emissions Breakdown */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Emissions Breakdown
              </h3>
              
              <div className="space-y-4">
                {emissionsSources.map((source, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{source.name}</span>
                      <div className="text-sm text-muted-foreground">
                        {source.percentage}% ({source.amount} kg/ton)
                      </div>
                    </div>
                    <div className="relative">
                      <div className="h-3 bg-muted rounded-full">
                        <div 
                          className={`h-3 ${source.color} rounded-full transition-all duration-500`}
                          style={{ width: `${source.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Fuel Mix Impact */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Fuel Mix Impact Analysis
              </h3>
              
              <div className="space-y-3">
                {fuelMixScenarios.map((scenario, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{scenario.name}</h4>
                      <Badge 
                        variant={scenario.status === 'current' ? 'default' : 'outline'}
                        className={
                          scenario.status === 'current' ? 'bg-primary' :
                          scenario.status === 'projected' ? 'bg-success/10 text-success border-success/20' :
                          'bg-info/10 text-info border-info/20'
                        }
                      >
                        {scenario.status === 'current' ? 'Current' :
                         scenario.status === 'projected' ? 'Recommended' : 'Potential'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Alt Fuel Usage</p>
                        <p className="font-bold">{scenario.altFuel}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">CO2 Emissions</p>
                        <p className="font-bold">{scenario.emissions} kg/ton</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{scenario.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Real-time Monitoring */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Real-time Stack Monitoring (CEMS)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Stack Emissions</span>
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <p className="text-2xl font-bold">95 mg/Nm³</p>
                <p className="text-xs text-muted-foreground">Limit: 100 mg/Nm³</p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">NOx Levels</span>
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <p className="text-2xl font-bold">285 mg/Nm³</p>
                <p className="text-xs text-muted-foreground">Limit: 400 mg/Nm³</p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">SO2 Levels</span>
                  <AlertCircle className="h-4 w-4 text-warning" />
                </div>
                <p className="text-2xl font-bold">85 mg/Nm³</p>
                <p className="text-xs text-muted-foreground">Limit: 100 mg/Nm³</p>
              </div>
            </div>

            {/* CEMS Chart Placeholder */}
            <div className="mt-4 h-32 bg-muted/20 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Live CEMS Data</p>
                <p className="text-xs text-muted-foreground">Continuous emissions monitoring</p>
              </div>
            </div>
          </Card>

          {/* Target Setting & Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Set New Emissions Target
              </h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="emissions-target">Target CO2 Emissions (kg/ton)</Label>
                  <Input
                    id="emissions-target"
                    type="number"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Current: 118 kg/ton | Industry Average: 135 kg/ton
                </p>
                <Button className="w-full">
                  <Target className="h-4 w-4 mr-2" />
                  Update Target
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              
              <div className="space-y-2">
                <Button 
                  className="w-full justify-start" 
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isOptimizing ? 'Optimizing...' : 'Optimize Now'}
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Compliance Report
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Historical Analysis
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}