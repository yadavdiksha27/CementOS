import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Zap, Target, Brain, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '@/assets/cement-plant-hero.jpg';

const crisisMetrics = [
  { value: '8%', label: 'of Global CO2 Emissions', icon: '🌍' },
  { value: '4B', label: 'Tons Produced Annually', icon: '🏭' },
  { value: '$330B', label: 'Industry Size', icon: '💰' },
  { value: '20%', label: 'Energy Waste in Plants', icon: '⚡' }
];

const problems = [
  {
    title: 'Raw Material Variability',
    description: 'Inconsistent limestone quality leads to unpredictable cement properties',
    icon: '🪨'
  },
  {
    title: 'Energy-Intensive Processes',
    description: 'Cement production requires massive energy, driving up costs and emissions',
    icon: '🔥'
  },
  {
    title: 'Siloed Control Systems',
    description: 'Disconnected systems prevent optimal plant-wide decision making',
    icon: '🏗️'
  },
  {
    title: 'Manual Operations',
    description: 'Human error and delays reduce efficiency and increase waste',
    icon: '👨‍🔧'
  }
];

const solutions = [
  {
    title: 'AI Agents Work 24/7',
    description: 'Continuous optimization of every process parameter',
    icon: <Brain className="h-6 w-6 text-primary" />
  },
  {
    title: '98.7% Quality Prediction',
    description: 'Real-time quality forecasting prevents defects',
    icon: <Target className="h-6 w-6 text-success" />
  },
  {
    title: 'Autonomous Fuel Optimization',
    description: 'Dynamic fuel mix adjustment for cost and emission reduction',
    icon: <Zap className="h-6 w-6 text-energy" />
  },
  {
    title: 'Predictive Maintenance',
    description: 'Prevent downtime with AI-powered equipment monitoring',
    icon: <TrendingDown className="h-6 w-6 text-warning" />
  }
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section 
        className="relative h-screen flex items-center justify-center bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        {/* Enhanced overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/70" />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
        
        <div className="relative z-10 text-center text-white max-w-5xl mx-auto px-6">
          <div className="animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              The Cement Industry Burns{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 animate-pulse">
                4% of Global Energy
              </span>
              .{' '}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                We're Fixing That.
              </span>
            </h1>
          </div>
          
          <div className="animate-fade-in-up animation-delay-500">
            <p className="text-xl md:text-2xl mb-10 text-gray-100 max-w-3xl mx-auto leading-relaxed">
              CementOS uses <span className="font-semibold text-blue-300">Generative AI</span> to reduce cement plant emissions by{' '}
              <span className="font-bold text-green-400">20%</span> 
              while increasing profits by{' '}
              <span className="font-bold text-green-400">15%</span>
            </p>
          </div>
          
          <div className="animate-fade-in-up animation-delay-1000">
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg px-10 py-4 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-blue-400">
                <Link to="/solution">
                  See How It Works <ArrowRight className="ml-3 h-5 w-5" />
                </Link>
              </Button>
              
              <Button asChild size="lg" className="bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white text-lg px-10 py-4 rounded-full shadow-2xl border-2 border-white transform hover:scale-105 transition-all duration-300">
                <Link to="/dashboard">
                  <Brain className="mr-3 h-5 w-5" />
                  Explore Platform
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating animation indicators */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Crisis Metrics */}
      <section className="py-16 bg-card">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">The Climate Crisis in Numbers</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {crisisMetrics.map((metric, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{metric.icon}</div>
                <div className="text-3xl font-bold text-primary mb-2">{metric.value}</div>
                <div className="text-sm text-muted-foreground">{metric.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Breakdown */}
      <section className="py-16 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">The Problems We Solve</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            Traditional cement plants face complex operational challenges that waste energy, 
            increase costs, and harm the environment.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {problems.map((problem, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{problem.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{problem.title}</h3>
                    <p className="text-muted-foreground">{problem.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Preview */}
      <section className="py-16 bg-card">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Our AI-Powered Solution</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            CementOS deploys specialized AI agents that work together to optimize every aspect 
            of cement production in real-time.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((solution, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                <div className="flex items-start gap-4">
                  {solution.icon}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{solution.title}</h3>
                    <p className="text-muted-foreground">{solution.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-900 via-purple-900 to-blue-800 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-blue-300 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Ready to Transform Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                Cement Plant?
              </span>
            </h2>
          </div>
          
          <div className="animate-fade-in-up animation-delay-500">
            <p className="text-xl md:text-2xl mb-10 text-gray-100 max-w-3xl mx-auto leading-relaxed">
              Join the <span className="font-bold text-blue-300">AI revolution</span> in cement manufacturing.{' '}
              <span className="font-semibold text-green-400">Reduce emissions</span>,{' '}
              <span className="font-semibold text-green-400">increase profits</span>, and help save our planet.
            </p>
          </div>
          
          <div className="animate-fade-in-up animation-delay-1000">
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-xl px-12 py-6 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 animate-glow">
                <Link to="/dashboard">
                  <Brain className="mr-3 h-6 w-6" />
                  Explore the Platform
                </Link>
              </Button>
              
              <Button asChild size="lg" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 text-xl px-12 py-6 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300">
                <Link to="/solution">
                  <Target className="mr-3 h-6 w-6" />
                  Watch Demo
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Additional stats or trust indicators */}
          <div className="animate-fade-in-up animation-delay-1000 mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">20%</div>
              <div className="text-sm text-gray-300">Emission Reduction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">15%</div>
              <div className="text-sm text-gray-300">Profit Increase</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">24/7</div>
              <div className="text-sm text-gray-300">AI Monitoring</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}