import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  Zap, 
  Leaf, 
  TestTube, 
  TrendingUp, 
  Play, 
  Save, 
  Copy,
  BarChart3,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface KPITestConfigurationProps {
  onStartTest: (config: any) => void;
}

export function KPITestConfiguration({ onStartTest }: KPITestConfigurationProps) {
  const [selectedObjective, setSelectedObjective] = useState<string>('');
  const [testName, setTestName] = useState('');
  const [duration, setDuration] = useState('24');
  const [speed, setSpeed] = useState('10');
  const [safetyLimits, setSafetyLimits] = useState(true);
  const [autoStop, setAutoStop] = useState(true);

  const testObjectives = [
    {
      id: 'quality',
      name: 'Quality Optimization',
      icon: <Target className="h-5 w-5" />,
      target: 'Clinker Quality Score >95%',
      constraints: ['C3S: 55-60%', 'f-CaO: <1.5%'],
      expectedImpact: { quality: '+3%', cost: '±0%', energy: '+1%' },
      description: 'Optimize cement quality while maintaining operational efficiency',
      complexity: 'Medium',
      duration: '18-24 hours'
    },
    {
      id: 'emissions',
      name: 'CO2 Emission Reduction',
      icon: <Leaf className="h-5 w-5" />,
      target: '<115 kg CO2/ton cement',
      constraints: ['Alt fuel: up to 60%', 'Quality: >90%'],
      expectedImpact: { emissions: '-12%', cost: '+5%', quality: '-2%' },
      description: 'Maximize alternative fuel usage to reduce carbon footprint',
      complexity: 'High',
      duration: '24-36 hours'
    },
    {
      id: 'efficiency',
      name: 'Fuel Efficiency Maximization',
      icon: <Zap className="h-5 w-5" />,
      target: '<3.2 GJ/ton clinker',
      constraints: ['Thermal efficiency: >92%', 'Quality: maintained'],
      expectedImpact: { energy: '-8%', cost: '-6%', quality: '+2%' },
      description: 'Optimize thermal and electrical energy consumption',
      complexity: 'Medium',
      duration: '12-18 hours'
    },
    {
      id: 'production',
      name: 'Production Rate Optimization',
      icon: <TrendingUp className="h-5 w-5" />,
      target: '>140 tons/hour output',
      constraints: ['Quality: >92%', 'Energy: <3.5 GJ/ton'],
      expectedImpact: { production: '+8%', quality: '±0%', energy: '+3%' },
      description: 'Maximize production throughput within quality parameters',
      complexity: 'Low',
      duration: '8-12 hours'
    }
  ];

  const selectedObj = testObjectives.find(obj => obj.id === selectedObjective);

  const predictedResults = {
    quality: selectedObjective === 'quality' ? 95.2 : 
             selectedObjective === 'emissions' ? 92.1 :
             selectedObjective === 'efficiency' ? 94.8 : 93.5,
    energy: selectedObjective === 'efficiency' ? 3.15 :
            selectedObjective === 'quality' ? 3.28 :
            selectedObjective === 'emissions' ? 3.45 : 3.32,
    emissions: selectedObjective === 'emissions' ? 113 :
               selectedObjective === 'efficiency' ? 119 :
               selectedObjective === 'quality' ? 121 : 118,
    cost: selectedObjective === 'efficiency' ? 79.2 :
          selectedObjective === 'quality' ? 82.5 :
          selectedObjective === 'emissions' ? 86.8 : 81.5
  };

  const handleStartTest = () => {
    if (!selectedObjective || !testName) return;
    
    const testConfig = {
      name: testName,
      objective: selectedObj,
      duration: parseInt(duration),
      speed: parseInt(speed),
      safetyLimits,
      autoStop,
      predictedResults,
      timestamp: new Date().toISOString()
    };
    
    onStartTest(testConfig);
  };

  return (
    <div className="space-y-6">
      {/* Test Name */}
      <Card className="p-4">
        <Label htmlFor="test-name" className="text-base font-semibold">Test Scenario Name</Label>
        <Input
          id="test-name"
          placeholder="Enter descriptive test name"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          className="mt-2"
        />
      </Card>

      {/* Objective Selection */}
      <Card className="p-4">
        <h3 className="text-base font-semibold mb-4">Select Primary Optimization Objective</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testObjectives.map((objective) => (
            <div
              key={objective.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedObjective === objective.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedObjective(objective.id)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${
                  selectedObjective === objective.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {objective.icon}
                </div>
                <div>
                  <h4 className="font-semibold">{objective.name}</h4>
                  <Badge variant="outline" className="mt-1">
                    {objective.complexity} Complexity
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Target:</span> <span>{objective.target}</span>
                </div>
                
                <div>
                  <span className="font-medium">Constraints:</span>
                  <ul className="list-disc list-inside ml-2 text-muted-foreground">
                    {objective.constraints.map((constraint, idx) => (
                      <li key={idx}><span>{constraint}</span></li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-medium">Expected Impact:</span>
                  <div className="flex gap-3 mt-1">
                    {Object.entries(objective.expectedImpact).map(([key, value]) => (
                      <Badge key={key} variant="secondary" className="text-xs">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                </div>

                <p className="text-muted-foreground">{objective.description}</p>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">Duration: {objective.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Test Configuration */}
      {selectedObjective && (
        <Card className="p-4">
          <h3 className="text-base font-semibold mb-4">Test Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="duration">Test Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="36">36 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="speed">Simulation Speed</Label>
                <Select value={speed} onValueChange={setSpeed}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x Real-time</SelectItem>
                    <SelectItem value="5">5x Real-time</SelectItem>
                    <SelectItem value="10">10x Real-time</SelectItem>
                    <SelectItem value="20">20x Real-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="safety-limits"
                  checked={safetyLimits}
                  onCheckedChange={(checked) => setSafetyLimits(checked === true)}
                />
                <Label htmlFor="safety-limits">Enforce Safety Limits</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-stop"
                  checked={autoStop}
                  onCheckedChange={(checked) => setAutoStop(checked === true)}
                />
                <Label htmlFor="auto-stop">Auto-stop on Critical Failure</Label>
              </div>

              {!safetyLimits && (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-warning">Safety Limits Disabled</p>
                    <p className="text-warning/80">This may allow parameters beyond normal operating ranges.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Predicted Results */}
      {selectedObjective && (
        <Card className="p-4">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Predicted Results Preview
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Quality Score</p>
              <p className="text-2xl font-bold">{predictedResults.quality}%</p>
              <p className="text-xs text-success">
                {selectedObj?.expectedImpact.quality || '+0%'}
              </p>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Energy Usage</p>
              <p className="text-2xl font-bold">{predictedResults.energy} GJ/ton</p>
              <p className="text-xs text-info">
                {selectedObj?.expectedImpact.energy || '±0%'}
              </p>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">CO2 Emissions</p>
              <p className="text-2xl font-bold">{predictedResults.emissions} kg/ton</p>
              <p className="text-xs text-success">
                {selectedObj?.expectedImpact.emissions || '±0%'}
              </p>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Production Cost</p>
              <p className="text-2xl font-bold">${predictedResults.cost}/ton</p>
              <p className="text-xs text-muted-foreground">
                {selectedObj?.expectedImpact.cost || '±0%'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={handleStartTest}
          disabled={!selectedObjective || !testName}
        >
          <Play className="h-4 w-4 mr-2" />
          Start Test
        </Button>
        
        <Button variant="outline" disabled={!selectedObjective || !testName}>
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
        
        <Button variant="outline">
          <Copy className="h-4 w-4 mr-2" />
          Clone Existing
        </Button>
      </div>
    </div>
  );
}