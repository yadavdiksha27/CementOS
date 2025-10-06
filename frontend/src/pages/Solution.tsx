import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Target, 
  Zap, 
  Flame,
  BarChart3,
  Eye,
  Settings,
  TrendingUp,
  Activity,
  Shield,
  TestTube
} from 'lucide-react';
import { Link } from 'react-router-dom';

const aiArchitecture = {
  orchestrator: {
    name: 'Orchestrator Agent',
    role: 'Central Command & Control',
    function: 'Routes queries, manages context, coordinates responses',
    technology: 'Google Gemini Pro + Vertex AI',
    color: 'bg-primary'
  },
  agents: [
    {
      name: 'TSR Agent',
      role: 'Thermal Substitution Rate Optimization',
      function: 'Maximizes alternative fuel usage while maintaining quality',
      technology: 'Multi-objective optimization + Genetic Algorithms',
      color: 'bg-energy',
      demo: 'Fuel mix optimization with real-time cost/emissions calculation'
    },
    {
      name: 'Clinker Agent', 
      role: 'Kiln Operation & Quality Prediction',
      function: 'Predicts clinker phases (C3S, C2S, C3A, C4AF) with 98.7% accuracy',
      technology: 'RandomForest + Physics-informed ML',
      color: 'bg-danger',
      demo: 'Parameter input → quality prediction visualization'
    },
    {
      name: 'Quality Agent',
      role: 'Two-Step Quality Control',
      function: 'Thermal image analysis + f-CaO content prediction',
      technology: 'ResNet50 + XGBoost hybrid model',
      color: 'bg-success',
      demo: 'Upload thermal image → quality assessment'
    }
  ]
};

const resultMetrics = [
  { metric: 'Energy Reduction', value: '15-20%', icon: <Zap className="h-6 w-6" />, color: 'text-energy' },
  { metric: 'CO2 Emissions', value: '-18%', icon: <Shield className="h-6 w-6" />, color: 'text-success' },
  { metric: 'Quality Consistency', value: '98.7%', icon: <Target className="h-6 w-6" />, color: 'text-primary' },
  { metric: 'Alternative Fuel Usage', value: 'Up to 50%', icon: <Flame className="h-6 w-6" />, color: 'text-warning' },
  { metric: 'Maintenance Costs', value: '-25%', icon: <Settings className="h-6 w-6" />, color: 'text-muted-foreground' },
  { metric: 'Overall Equipment Effectiveness', value: '+12%', icon: <TrendingUp className="h-6 w-6" />, color: 'text-success' }
];

export default function Solution() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          AI Multi-Agent System Architecture
        </h1>
        <p className="text-xl text-muted-foreground">
          Deep dive into how our Generative AI platform revolutionizes cement plant operations 
          through intelligent automation and continuous optimization.
        </p>
      </div>

      {/* AI Architecture Explanation */}
      <Card className="p-8">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Brain className="h-6 w-6" />
          Intelligent Agent Ecosystem
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Central Orchestrator */}
          <div className="lg:col-span-3 flex justify-center mb-8">
            <Card className="p-6 border-l-4 border-l-primary max-w-md text-center">
              <div className={`w-16 h-16 ${aiArchitecture.orchestrator.color} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{aiArchitecture.orchestrator.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{aiArchitecture.orchestrator.role}</p>
              <p className="text-sm mb-3">{aiArchitecture.orchestrator.function}</p>
              <div className="text-xs bg-muted/50 rounded-lg p-2">
                <strong>Technology:</strong> {aiArchitecture.orchestrator.technology}
              </div>
            </Card>
          </div>

          {/* Specialized Agents */}
          {aiArchitecture.agents.map((agent, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className={`w-12 h-12 ${agent.color} rounded-lg mb-4 flex items-center justify-center`}>
                {agent.name.includes('TSR') && <Flame className="h-6 w-6 text-white" />}
                {agent.name.includes('Clinker') && <Activity className="h-6 w-6 text-white" />}
                {agent.name.includes('Quality') && <Target className="h-6 w-6 text-white" />}
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{agent.name}</h3>
              <p className="text-sm font-medium text-primary mb-2">{agent.role}</p>
              <p className="text-sm text-muted-foreground mb-3">{agent.function}</p>
              
              <div className="text-xs bg-muted/50 rounded-lg p-2 mb-3">
                <strong>Technology:</strong> {agent.technology}
              </div>
              
              <div className="text-xs bg-primary/10 rounded-lg p-2 mb-4">
                <strong>Demo:</strong> {agent.demo}
              </div>
              
              <Button size="sm" variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Interactive Demo
              </Button>
            </Card>
          ))}
        </div>
      </Card>

      {/* Data Flow Visualization */}
      <Card className="p-8">
        <h2 className="text-2xl font-semibold mb-6">Data Flow & Decision Making</h2>
        
        <div className="flex items-center justify-center space-x-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-2">
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium">Sensors</h3>
            <p className="text-sm text-muted-foreground">Real-time data</p>
          </div>
          
          <div className="flex-1 h-0.5 bg-primary"></div>
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-2">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-medium">AI Agents</h3>
            <p className="text-sm text-muted-foreground">Intelligent analysis</p>
          </div>
          
          <div className="flex-1 h-0.5 bg-primary"></div>
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-success rounded-lg flex items-center justify-center mb-2">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-medium">Decisions</h3>
            <p className="text-sm text-muted-foreground">Automated actions</p>
          </div>
          
          <div className="flex-1 h-0.5 bg-primary"></div>
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-warning rounded-lg flex items-center justify-center mb-2">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-medium">Plant Control</h3>
            <p className="text-sm text-muted-foreground">Optimized operations</p>
          </div>
        </div>
      </Card>

      {/* Results Metrics */}
      <Card className="p-8">
        <h2 className="text-2xl font-semibold mb-6 text-center">Proven Results</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resultMetrics.map((result, index) => (
            <div key={index} className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                result.color.includes('energy') ? 'bg-energy/10' :
                result.color.includes('success') ? 'bg-success/10' :
                result.color.includes('primary') ? 'bg-primary/10' :
                result.color.includes('warning') ? 'bg-warning/10' :
                'bg-muted/50'
              }`}>
                <div className={result.color}>
                  {result.icon}
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">{result.metric}</h3>
              <div className="text-3xl font-bold mb-2 text-primary">{result.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Technology Stack */}
      <Card className="p-8">
        <h2 className="text-2xl font-semibold mb-6">Technology Foundation</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 border rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">Google Vertex AI</h3>
            <p className="text-sm text-muted-foreground">Machine learning platform</p>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="w-12 h-12 bg-energy/10 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <Zap className="h-6 w-6 text-energy" />
            </div>
            <h3 className="font-medium mb-2">Gemini Pro</h3>
            <p className="text-sm text-muted-foreground">Large language model</p>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="w-12 h-12 bg-success/10 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-success" />
            </div>
            <h3 className="font-medium mb-2">TensorFlow</h3>
            <p className="text-sm text-muted-foreground">Deep learning framework</p>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="w-12 h-12 bg-warning/10 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <Activity className="h-6 w-6 text-warning" />
            </div>
            <h3 className="font-medium mb-2">IoT Sensors</h3>
            <p className="text-sm text-muted-foreground">Real-time data collection</p>
          </div>
        </div>
      </Card>

      {/* Call to Action */}
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold mb-4">Ready to Experience CementOS?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          See how our AI agents work together to optimize your cement plant operations, 
          reduce emissions, and increase profitability.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/dashboard">
              <Activity className="h-5 w-5 mr-2" />
              Explore Live Dashboard
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg">
            <Link to="/testing">
              <TestTube className="h-5 w-5 mr-2" />
              Try Virtual Testing
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}