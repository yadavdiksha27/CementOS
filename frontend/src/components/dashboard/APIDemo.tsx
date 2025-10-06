import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cementOSAPI, type OptimizationRequest } from '@/services/api';
import { 
  Zap, 
  Target, 
  TrendingDown, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Settings
} from 'lucide-react';

export function APIDemo() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [plantCapacity, setPlantCapacity] = useState('3000');
  const [objective, setObjective] = useState<'efficiency' | 'emissions' | 'cost' | 'balanced'>('balanced');
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const request: OptimizationRequest = {
        plant_capacity: parseInt(plantCapacity),
        objective,
        constraints: {
          lsf_min: 92,
          lsf_max: 98,
          sm_min: 2.2,
          sm_max: 2.8,
          am_min: 1.2,
          am_max: 2.0
        }
      };

      const result = await cementOSAPI.optimize(request);
      setOptimizationResult(result);
      
      toast({
        title: "Optimization Complete",
        description: "Plant optimization parameters have been calculated successfully.",
      });
    } catch (error) {
      console.error('Optimization failed:', error);
      toast({
        title: "Optimization Failed",
        description: "Unable to connect to CementOS API. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const fetchSystemStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const status = await cementOSAPI.getSystemStatus();
      setSystemStatus(status);
      
      toast({
        title: "System Status Updated",
        description: "Retrieved latest system information from CementOS API.",
      });
    } catch (error) {
      console.error('Status fetch failed:', error);
      toast({
        title: "Status Fetch Failed",
        description: "Unable to retrieve system status from CementOS API.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Optimization Demo */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Live API Optimization</h3>
          <Badge variant="outline" className="text-xs">
            Real CementOS API
          </Badge>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="capacity">Plant Capacity (TPD)</Label>
              <Input
                id="capacity"
                value={plantCapacity}
                onChange={(e) => setPlantCapacity(e.target.value)}
                placeholder="3000"
                type="number"
              />
            </div>
            
            <div>
              <Label htmlFor="objective">Objective</Label>
              <Select value={objective} onValueChange={(value: any) => setObjective(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select objective" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="efficiency">Energy Efficiency</SelectItem>
                  <SelectItem value="emissions">Low Emissions</SelectItem>
                  <SelectItem value="cost">Cost Optimization</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleOptimize} 
            disabled={isOptimizing}
            className="w-full"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Optimizing via CementOS API...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run Live Optimization
              </>
            )}
          </Button>

          {/* Optimization Results */}
          {optimizationResult && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Optimization Results
              </h4>
              <pre className="text-xs bg-background p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(optimizationResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Card>

      {/* System Status Demo */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">System Status Monitor</h3>
          <Badge variant="outline" className="text-xs">
            Live Data
          </Badge>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={fetchSystemStatus} 
            disabled={isLoadingStatus}
            variant="outline"
            className="w-full"
          >
            {isLoadingStatus ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Fetching Status...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Get Live System Status
              </>
            )}
          </Button>

          {/* System Status Results */}
          {systemStatus && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-success/10 rounded-lg">
                  <div className="text-sm font-medium text-success">System Health</div>
                  <div className="text-lg font-bold">{systemStatus.system_health}</div>
                </div>
                
                <div className="p-3 bg-info/10 rounded-lg">
                  <div className="text-sm font-medium text-info">Active Sessions</div>
                  <div className="text-lg font-bold">{systemStatus.active_sessions}</div>
                </div>
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium mb-2">Additional Info</div>
                <div className="space-y-1 text-xs">
                  <div>Uptime: {systemStatus.uptime}</div>
                  <div>Last Optimization: {systemStatus.last_optimization}</div>
                  <div>API Version: {systemStatus.api_version}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
