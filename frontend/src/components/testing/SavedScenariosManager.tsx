import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Copy, 
  Trash2, 
  Eye, 
  Download, 
  Plus, 
  Edit, 
  Star,
  Calendar,
  Clock,
  BarChart3,
  Target,
  Zap,
  Leaf,
  Settings,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TestTube
} from 'lucide-react';

interface SavedScenario {
  id: string;
  name: string;
  description: string;
  created: string;
  modified: string;
  author: string;
  category: 'optimization' | 'stress-test' | 'maintenance' | 'emergency';
  status: 'draft' | 'validated' | 'production';
  successRate: number;
  runs: number;
  averageDuration: string;
  tags: string[];
  parameters: {
    objective: string;
    duration: string;
    speed: string;
    safetyLimits: boolean;
    autoStop: boolean;
  };
  expectedResults: {
    quality: { value: string; change: string };
    energy: { value: string; change: string };
    emissions: { value: string; change: string };
    cost: { value: string; change: string };
  };
  lastResults?: {
    quality: number;
    energy: number;
    emissions: number;
    cost: number;
    timestamp: string;
  };
}

interface SavedScenariosManagerProps {
  onLoadScenario: (scenario: SavedScenario) => void;
  onRunScenario: (scenario: SavedScenario) => void;
}

export function SavedScenariosManager({ onLoadScenario, onRunScenario }: SavedScenariosManagerProps) {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([
    {
      id: '1',
      name: 'Energy Crisis Mode',
      description: 'Optimizes for maximum energy efficiency during power shortages',
      created: '2 days ago',
      modified: '1 hour ago',
      author: 'Priya Sharma',
      category: 'optimization',
      status: 'production',
      successRate: 94,
      runs: 23,
      averageDuration: '6h 15m',
      tags: ['energy', 'efficiency', 'crisis'],
      parameters: {
        objective: 'efficiency',
        duration: '8 hours',
        speed: '5x',
        safetyLimits: true,
        autoStop: true
      },
      expectedResults: {
        quality: { value: '92%', change: '-2%' },
        energy: { value: '3.1 GJ/ton', change: '-8%' },
        emissions: { value: '122 kg/ton', change: '+3%' },
        cost: { value: '$78/ton', change: '-6%' }
      },
      lastResults: {
        quality: 91.8,
        energy: 3.12,
        emissions: 123,
        cost: 77.5,
        timestamp: '2024-01-15 14:30'
      }
    },
    {
      id: '2',
      name: 'Green Cement Protocol',
      description: 'Maximizes alternative fuel usage for CO2 reduction',
      created: '1 week ago',
      modified: '3 days ago',
      author: 'Rajesh Kumar',
      category: 'optimization',
      status: 'validated',
      successRate: 87,
      runs: 15,
      averageDuration: '12h 45m',
      tags: ['emissions', 'green', 'sustainability'],
      parameters: {
        objective: 'emissions',
        duration: '24 hours',
        speed: '8x',
        safetyLimits: true,
        autoStop: false
      },
      expectedResults: {
        quality: { value: '89%', change: '-5%' },
        energy: { value: '3.3 GJ/ton', change: '+2%' },
        emissions: { value: '105 kg/ton', change: '-18%' },
        cost: { value: '$86/ton', change: '+8%' }
      }
    },
    {
      id: '3',
      name: 'Quality First Emergency',
      description: 'Emergency protocol to maintain quality during equipment failures',
      created: '3 days ago',
      modified: '2 days ago',
      author: 'Neha Gupta',
      category: 'emergency',
      status: 'production',
      successRate: 96,
      runs: 8,
      averageDuration: '4h 20m',
      tags: ['quality', 'emergency', 'backup'],
      parameters: {
        objective: 'quality',
        duration: '6 hours',
        speed: '2x',
        safetyLimits: true,
        autoStop: true
      },
      expectedResults: {
        quality: { value: '95%', change: '+1%' },
        energy: { value: '3.4 GJ/ton', change: '+6%' },
        emissions: { value: '125 kg/ton', change: '+6%' },
        cost: { value: '$92/ton', change: '+12%' }
      }
    },
    {
      id: '4',
      name: 'Maintenance Mode Optimization',
      description: 'Optimized operations during scheduled maintenance windows',
      created: '5 days ago',
      modified: '1 day ago',
      author: 'Amit Singh',
      category: 'maintenance',
      status: 'draft',
      successRate: 78,
      runs: 5,
      averageDuration: '8h 30m',
      tags: ['maintenance', 'reduced-capacity', 'optimization'],
      parameters: {
        objective: 'efficiency',
        duration: '12 hours',
        speed: '4x',
        safetyLimits: true,
        autoStop: true
      },
      expectedResults: {
        quality: { value: '88%', change: '-6%' },
        energy: { value: '3.6 GJ/ton', change: '+12%' },
        emissions: { value: '130 kg/ton', change: '+10%' },
        cost: { value: '$85/ton', change: '+3%' }
      }
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newScenarioName, setNewScenarioName] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<SavedScenario | null>(null);

  const categories = [
    { key: 'all', label: 'All Scenarios', count: scenarios.length },
    { key: 'optimization', label: 'Optimization', count: scenarios.filter(s => s.category === 'optimization').length },
    { key: 'emergency', label: 'Emergency', count: scenarios.filter(s => s.category === 'emergency').length },
    { key: 'maintenance', label: 'Maintenance', count: scenarios.filter(s => s.category === 'maintenance').length },
    { key: 'stress-test', label: 'Stress Tests', count: scenarios.filter(s => s.category === 'stress-test').length }
  ];

  const filteredScenarios = scenarios.filter(scenario => {
    const matchesCategory = selectedCategory === 'all' || scenario.category === selectedCategory;
    const matchesSearch = scenario.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scenario.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scenario.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'production': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'validated': return <Target className="h-4 w-4 text-primary" />;
      case 'draft': return <Edit className="h-4 w-4 text-warning" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      'optimization': 'default',
      'emergency': 'destructive',
      'maintenance': 'secondary',
      'stress-test': 'outline'
    } as const;
    
    return <Badge variant={variants[category as keyof typeof variants] || 'outline'}>{category}</Badge>;
  };

  const handleSaveCurrentAsScenario = () => {
    const newScenario: SavedScenario = {
      id: Date.now().toString(),
      name: newScenarioName || 'New Scenario',
      description: 'Saved from current configuration',
      created: 'Just now',
      modified: 'Just now',
      author: 'Current User',
      category: 'optimization',
      status: 'draft',
      successRate: 0,
      runs: 0,
      averageDuration: '0h 0m',
      tags: ['custom'],
      parameters: {
        objective: 'quality',
        duration: '12 hours',
        speed: '10x',
        safetyLimits: true,
        autoStop: true
      },
      expectedResults: {
        quality: { value: '94%', change: '+0%' },
        energy: { value: '3.2 GJ/ton', change: '+0%' },
        emissions: { value: '118 kg/ton', change: '+0%' },
        cost: { value: '$82/ton', change: '+0%' }
      }
    };

    setScenarios(prev => [newScenario, ...prev]);
    setNewScenarioName('');
  };

  const handleDeleteScenario = (id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
  };

  const handleDuplicateScenario = (scenario: SavedScenario) => {
    const duplicated = {
      ...scenario,
      id: Date.now().toString(),
      name: `${scenario.name} (Copy)`,
      created: 'Just now',
      modified: 'Just now',
      status: 'draft' as const,
      runs: 0,
      successRate: 0
    };
    
    setScenarios(prev => [duplicated, ...prev]);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TestTube className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Saved Test Scenarios</h3>
            <p className="text-sm text-muted-foreground">Manage and execute pre-configured test scenarios</p>
          </div>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Save Current
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Current Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="scenario-name">Scenario Name</Label>
                <Input
                  id="scenario-name"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  placeholder="Enter scenario name..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="scenario-description">Description</Label>
                <Textarea
                  id="scenario-description"
                  placeholder="Brief description of this scenario..."
                  className="mt-1"
                />
              </div>
              <Button onClick={handleSaveCurrentAsScenario} className="w-full">
                Save Scenario
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4 mb-6">
        <Input
          placeholder="Search scenarios by name, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category.key}
              variant={selectedCategory === category.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.key)}
            >
              {category.label}
              <Badge variant="secondary" className="ml-2">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Scenarios Grid */}
      <ScrollArea className="h-96">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScenarios.map((scenario) => (
            <Card key={scenario.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(scenario.status)}
                  <h4 className="font-semibold">{scenario.name}</h4>
                  {scenario.successRate > 90 && <Star className="h-4 w-4 text-yellow-500" />}
                </div>
                {getCategoryBadge(scenario.category)}
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {scenario.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  <span>{scenario.successRate}% success</span>
                </div>
                <div className="flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  <span>{scenario.runs} runs</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{scenario.averageDuration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{scenario.modified}</span>
                </div>
              </div>

              {/* Expected Results Preview */}
              <div className="grid grid-cols-4 gap-1 text-xs mb-3">
                <div className="text-center p-1 bg-muted/50 rounded">
                  <div className="font-medium text-primary">{scenario.expectedResults.quality.value}</div>
                  <div className="text-muted-foreground">Quality</div>
                </div>
                <div className="text-center p-1 bg-muted/50 rounded">
                  <div className="font-medium text-energy">{scenario.expectedResults.energy.change}</div>
                  <div className="text-muted-foreground">Energy</div>
                </div>
                <div className="text-center p-1 bg-muted/50 rounded">
                  <div className="font-medium text-success">{scenario.expectedResults.emissions.change}</div>
                  <div className="text-muted-foreground">CO2</div>
                </div>
                <div className="text-center p-1 bg-muted/50 rounded">
                  <div className="font-medium text-warning">{scenario.expectedResults.cost.change}</div>
                  <div className="text-muted-foreground">Cost</div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex gap-1 mb-3 flex-wrap">
                {scenario.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => onRunScenario(scenario)}
                  className="flex-1"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Run
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onLoadScenario(scenario)}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Load
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{scenario.name}</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="overview">
                      <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="parameters">Parameters</TabsTrigger>
                        <TabsTrigger value="results">Results</TabsTrigger>
                      </TabsList>
                      <TabsContent value="overview" className="space-y-4">
                        <div>
                          <Label>Description</Label>
                          <p className="text-sm text-muted-foreground mt-1">{scenario.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Author</Label>
                            <p className="text-sm mt-1">{scenario.author}</p>
                          </div>
                          <div>
                            <Label>Success Rate</Label>
                            <p className="text-sm mt-1">{scenario.successRate}%</p>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="parameters" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Objective</Label>
                            <p className="text-sm mt-1 capitalize">{scenario.parameters.objective}</p>
                          </div>
                          <div>
                            <Label>Duration</Label>
                            <p className="text-sm mt-1">{scenario.parameters.duration}</p>
                          </div>
                          <div>
                            <Label>Speed</Label>
                            <p className="text-sm mt-1">{scenario.parameters.speed}</p>
                          </div>
                          <div>
                            <Label>Safety Limits</Label>
                            <p className="text-sm mt-1">{scenario.parameters.safetyLimits ? 'Enabled' : 'Disabled'}</p>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="results" className="space-y-4">
                        {scenario.lastResults ? (
                          <div>
                            <Label>Last Run Results ({scenario.lastResults.timestamp})</Label>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              <div className="p-3 bg-muted/50 rounded">
                                <div className="text-lg font-bold">{scenario.lastResults.quality}%</div>
                                <div className="text-xs text-muted-foreground">Quality Score</div>
                              </div>
                              <div className="p-3 bg-muted/50 rounded">
                                <div className="text-lg font-bold">{scenario.lastResults.energy}</div>
                                <div className="text-xs text-muted-foreground">Energy (GJ/ton)</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              No previous results available for this scenario.
                            </AlertDescription>
                          </Alert>
                        )}
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>

                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleDuplicateScenario(scenario)}
                >
                  <Copy className="h-3 w-3" />
                </Button>

                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleDeleteScenario(scenario.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {filteredScenarios.length === 0 && (
        <div className="text-center py-8">
          <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No scenarios found matching your criteria.</p>
        </div>
      )}
    </Card>
  );
}
