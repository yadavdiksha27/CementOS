# CementOS - Cement Plant Optimization System

AI-powered cement production optimization with multi-agent architecture for cost reduction, emissions control, and quality management.

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Start the main server
python main.py
```

### Cloud Run Deployment
```bash
# Make deployment script executable
chmod +x deploy.sh

# Deploy to Google Cloud Run
./deploy.sh
```

## 📡 API Endpoints

### Main Chat Interface
```bash
POST /chat
{
  "message": "What's the optimal fuel mix for the next 8 hours?",
  "session_id": "user123"
}
```

### Direct Optimization
```bash
POST /optimize
{
  "plant_capacity": 3000,
  "objective": "balanced",
  "constraints": {"lsf_min": 92, "lsf_max": 98}
}
```

### System Status
```bash
GET /status
GET /health
GET /capabilities
```

## 🏗️ Architecture

- **main.py**: Primary entry point with FastAPI server
- **orchestrator.py**: Central AI orchestrator with Gemini integration
- **tsr.py**: Technical Support Representative for optimization
- **quality.py**: Quality control agent for thermal imaging and f-CaO prediction
- **clinker.py**: Clinkerization agent for kiln optimization

## 🔧 Configuration

The system uses `config.json` for Google Cloud credentials and service configurations.

## 📊 Features

- **Multi-objective Optimization**: Cost, emissions, and quality balancing
- **Real-time Quality Control**: Thermal imaging analysis and f-CaO prediction
- **Alternative Fuel Integration**: Biomass, TDF, WDF optimization
- **Pareto Analysis**: Trade-off visualization
- **Sensitivity Analysis**: Parameter impact assessment
- **Natural Language Interface**: Chat-based interaction

## 🌐 Cloud Run Configuration

- **Memory**: 2GB
- **CPU**: 2 cores
- **Timeout**: 300 seconds
- **Concurrency**: 80 requests
- **Max Instances**: 10

## 🔒 Security

- Non-root container user
- CORS configuration for web interfaces
- Environment-based configuration
- Health checks and monitoring

## 📈 Monitoring

Access logs and metrics through Google Cloud Console:
```bash
gcloud logs read --service=cemenos --region=us-central1
```

## 🎯 Example Queries

- "Optimize my 3000 TPD cement plant for minimum cost"
- "What's the optimal fuel mix for reducing CO2 emissions by 20%?"
- "Analyze thermal image for abnormal conditions"
- "Predict f-CaO content from current DCS data"
- "Show Pareto front for cost vs emissions trade-off"
