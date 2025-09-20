"""
Clinkerization Agent for Cement Kiln Optimization
Simplified version without Google Cloud dependencies
"""

import asyncio
import json
import logging
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import os
import joblib
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class KilnSensorData:
    """Data structure for kiln sensor readings"""
    timestamp: datetime
    flame_temperature: float
    material_temperature: float
    shell_temperature: float
    draft_pressure: float
    combustion_air_pressure: float
    o2_level: float
    co_level: float
    nox_level: float
    raw_meal_flow: float
    fuel_flow_rate: float
    kiln_rpm: float
    feed_rate: float

@dataclass
class ClinkerPrediction:
    """Clinker quality and phase predictions"""
    c3s_content: float  # Tricalcium silicate
    c2s_content: float  # Dicalcium silicate
    c3a_content: float  # Tricalcium aluminate
    c4af_content: float # Tetracalcium aluminoferrite
    free_cao: float     # Free calcium oxide
    quality_score: float
    energy_efficiency: float
    confidence: float

@dataclass
class ControlDecision:
    """Control adjustments to be applied to kiln"""
    fuel_flow_adjustment: float  # kg/hr change
    air_flow_adjustment: float   # m³/min change
    feed_rate_adjustment: float  # tons/hr change
    temperature_setpoint: float  # °C
    priority: str  # HIGH, MEDIUM, LOW
    reasoning: str

class ClinkerizationAgent:
    """
    Autonomous Clinkerization Agent for cement kiln optimization
    
    This agent monitors kiln sensor data and makes real-time
    control decisions to optimize energy efficiency, product quality, and
    environmental performance.
    """
    
    def __init__(self, orchestrator_endpoint: Optional[str] = None):
        """
        Initialize the Clinkerization Agent
        
        Args:
            orchestrator_endpoint: URL for orchestrator communication
        """
        self.start_time = datetime.now()
        self.orchestrator_endpoint = orchestrator_endpoint or os.getenv('ORCHESTRATOR_ENDPOINT', 'http://localhost:5000')
        
        # Load ML models
        self.clinker_model = self._load_clinker_prediction_model()
        self.scaler = self._load_data_scaler()
        
        # Control parameters and thresholds
        self.target_thresholds = {
            'flame_temp_min': 1400,
            'flame_temp_max': 1500,
            'free_cao_max': 2.0,
            'energy_efficiency_min': 0.75,
            'quality_score_min': 0.85,
            'o2_level_min': 2.0,
            'o2_level_max': 4.0,
            'co_level_max': 100.0
        }
        
        # Safety limits
        self.safety_limits = {
            'max_fuel_adjustment': 10.0,      # kg/hr
            'max_air_adjustment': 20.0,       # m³/min
            'max_feed_adjustment': 5.0,       # tons/hr
            'max_temp_setpoint': 1600.0,      # °C
            'min_temp_setpoint': 1300.0       # °C
        }
        
        # Decision history
        self.decision_history = []
        self.max_history_size = 100
        
        # Performance metrics
        self.metrics = {
            'requests_processed': 0,
            'decisions_made': 0,
            'errors': 0,
            'last_performance_check': datetime.now()
        }

    def _load_clinker_prediction_model(self):
        """Load pre-trained ML model for clinker prediction"""
        try:
            model_path = os.getenv('CLINKER_MODEL_PATH', './models/clinker_model.pkl')
            
            if os.path.exists(model_path):
                logger.info(f"Loading clinker model from {model_path}")
                return joblib.load(model_path)
            else:
                logger.warning("Model file not found, initializing with default model")
                # Initialize with a basic model structure
                try:
                    from sklearn.ensemble import RandomForestRegressor
                    model = RandomForestRegressor(
                        n_estimators=100, 
                        random_state=42,
                        max_depth=10,
                        min_samples_split=5
                    )
                    
                    # Create dummy training data with realistic distributions
                    np.random.seed(42)
                    X_dummy = np.random.normal(0, 1, (1000, 12))  # 12 sensor features
                    
                    # Realistic clinker phase targets
                    y_dummy = np.column_stack([
                        np.random.normal(55, 5, 1000),   # C3S: 50-60%
                        np.random.normal(20, 3, 1000),   # C2S: 15-25%
                        np.random.normal(8, 2, 1000),    # C3A: 5-12%
                        np.random.normal(10, 2, 1000),   # C4AF: 8-15%
                        np.random.exponential(1, 1000)   # Free CaO: 0-3%
                    ])
                    
                    model.fit(X_dummy, y_dummy)
                    logger.info("Initialized model with synthetic training data")
                    return model
                except ImportError:
                    logger.warning("sklearn not available, using dummy model")
                    # Create a simple dummy model
                    class DummyModel:
                        def predict(self, X):
                            return np.array([[55.0, 20.0, 8.0, 10.0, 1.0]])
                    return DummyModel()
                
        except Exception as e:
            logger.error(f"Error loading clinker model: {e}")
            # Return a simple dummy model
            class DummyModel:
                def predict(self, X):
                    return np.array([[55.0, 20.0, 8.0, 10.0, 1.0]])
            return DummyModel()

    def _load_data_scaler(self):
        """Load data preprocessing scaler"""
        try:
            scaler_path = os.getenv('SCALER_PATH', './models/scaler.pkl')
            
            if os.path.exists(scaler_path):
                logger.info(f"Loading scaler from {scaler_path}")
                return joblib.load(scaler_path)
            else:
                logger.warning("Scaler file not found, initializing with default scaler")
                try:
                    from sklearn.preprocessing import StandardScaler
                    scaler = StandardScaler()
                    
                    # Fit with typical sensor value ranges
                    typical_ranges = np.array([
                        [1400, 50],   # flame_temperature: mean, std
                        [1200, 100],  # material_temperature
                        [350, 30],    # shell_temperature
                        [-50, 10],    # draft_pressure
                        [200, 20],    # combustion_air_pressure
                        [3.0, 0.5],   # o2_level
                        [50, 20],     # co_level
                        [800, 100],   # nox_level
                        [100, 10],    # raw_meal_flow
                        [45, 5],      # fuel_flow_rate
                        [2.5, 0.2],   # kiln_rpm
                        [120, 15]     # feed_rate
                    ])
                    
                    # Generate sample data for fitting
                    X_sample = np.random.normal(
                        typical_ranges[:, 0], 
                        typical_ranges[:, 1], 
                        (100, 12)
                    )
                    scaler.fit(X_sample)
                    logger.info("Initialized scaler with typical sensor ranges")
                    return scaler
                except ImportError:
                    logger.warning("sklearn not available, using dummy scaler")
                    # Create a simple dummy scaler
                    class DummyScaler:
                        def transform(self, X):
                            return X
                    return DummyScaler()
                
        except Exception as e:
            logger.error(f"Error loading scaler: {e}")
            # Return a simple dummy scaler
            class DummyScaler:
                def transform(self, X):
                    return X
            return DummyScaler()

    async def process_sensor_data(self, sensor_data: KilnSensorData) -> Dict:
        """Process sensor data and generate control decisions"""
        try:
            self.metrics['requests_processed'] += 1
            
            # Validate sensor data
            if not self._validate_sensor_data(sensor_data):
                logger.warning("Invalid sensor data received")
                return {
                    "success": False,
                    "error": "Invalid sensor data",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Get historical context (simplified for local version)
            historical_context = self._get_default_historical_context()
            
            # Predict clinker quality and phases
            prediction = await self._predict_clinker_quality(sensor_data, historical_context)
            
            # Generate control decisions
            decision = await self._generate_control_decision(sensor_data, prediction)
            
            # Store decision in history
            self._store_decision(sensor_data, prediction, decision)
            
            self.metrics['decisions_made'] += 1
            
            return {
                "success": True,
                "prediction": {
                    "c3s_content": prediction.c3s_content,
                    "c2s_content": prediction.c2s_content,
                    "c3a_content": prediction.c3a_content,
                    "c4af_content": prediction.c4af_content,
                    "free_cao": prediction.free_cao,
                    "quality_score": prediction.quality_score,
                    "energy_efficiency": prediction.energy_efficiency,
                    "confidence": prediction.confidence
                },
                "decision": {
                    "fuel_flow_adjustment": decision.fuel_flow_adjustment,
                    "air_flow_adjustment": decision.air_flow_adjustment,
                    "feed_rate_adjustment": decision.feed_rate_adjustment,
                    "temperature_setpoint": decision.temperature_setpoint,
                    "priority": decision.priority,
                    "reasoning": decision.reasoning
                },
                "timestamp": datetime.now().isoformat(),
                "message": "Control decision generated successfully"
            }
            
        except Exception as e:
            logger.error(f"Error processing sensor data: {e}")
            self.metrics['errors'] += 1
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def _validate_sensor_data(self, sensor_data: KilnSensorData) -> bool:
        """Validate sensor data for reasonable values"""
        try:
            # Check for reasonable temperature ranges
            if not (1000 <= sensor_data.flame_temperature <= 1800):
                logger.warning(f"Flame temperature out of range: {sensor_data.flame_temperature}")
                return False
            
            if not (800 <= sensor_data.material_temperature <= 1400):
                logger.warning(f"Material temperature out of range: {sensor_data.material_temperature}")
                return False
            
            # Check for reasonable gas levels
            if not (0 <= sensor_data.o2_level <= 10):
                logger.warning(f"O2 level out of range: {sensor_data.o2_level}")
                return False
            
            if not (0 <= sensor_data.co_level <= 1000):
                logger.warning(f"CO level out of range: {sensor_data.co_level}")
                return False
            
            # Check for reasonable flow rates
            if not (0 <= sensor_data.fuel_flow_rate <= 200):
                logger.warning(f"Fuel flow rate out of range: {sensor_data.fuel_flow_rate}")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating sensor data: {e}")
            return False

    def _get_default_historical_context(self) -> Dict:
        """Get default historical context when no real data is available"""
        return {
            'avg_flame_temp': 1450.0,
            'avg_efficiency': 0.8,
            'avg_quality': 0.85,
            'temp_variance': 10.0,
            'data_points': 0
        }

    async def _predict_clinker_quality(self, sensor_data: KilnSensorData, 
                                     context: Dict) -> ClinkerPrediction:
        """Use ML model to predict clinker quality and phases"""
        try:
            # Prepare features for ML model
            features = np.array([[
                sensor_data.flame_temperature,
                sensor_data.material_temperature,
                sensor_data.shell_temperature,
                sensor_data.draft_pressure,
                sensor_data.combustion_air_pressure,
                sensor_data.o2_level,
                sensor_data.co_level,
                sensor_data.nox_level,
                sensor_data.raw_meal_flow,
                sensor_data.fuel_flow_rate,
                sensor_data.kiln_rpm,
                sensor_data.feed_rate
            ]])
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Make prediction
            prediction = self.clinker_model.predict(features_scaled)[0]
            
            # Ensure predictions are within realistic ranges
            prediction = np.clip(prediction, [40, 10, 3, 5, 0], [70, 35, 15, 20, 5])
            
            # Calculate confidence based on model uncertainty and historical variance
            confidence = self._calculate_prediction_confidence(features_scaled, context)
            
            return ClinkerPrediction(
                c3s_content=float(prediction[0]),
                c2s_content=float(prediction[1]),
                c3a_content=float(prediction[2]),
                c4af_content=float(prediction[3]),
                free_cao=float(prediction[4]),
                quality_score=self._calculate_quality_score(prediction),
                energy_efficiency=self._calculate_energy_efficiency(sensor_data),
                confidence=confidence
            )
            
        except Exception as e:
            logger.error(f"Error in clinker prediction: {e}")
            raise

    def _calculate_prediction_confidence(self, features: np.ndarray, context: Dict) -> float:
        """Calculate prediction confidence based on model uncertainty and context"""
        # Simplified confidence calculation for local version
        return 0.85  # Return a fixed high confidence for simplicity

    def _calculate_quality_score(self, prediction: np.ndarray) -> float:
        """Calculate overall quality score from clinker phases"""
        try:
            c3s, c2s, c3a, c4af, free_cao = prediction
            
            # Industry-standard quality targets
            quality_factors = []
            
            # C3S: optimal range 50-60%
            c3s_score = 1.0 - min(1.0, abs(c3s - 55.0) / 15.0)
            quality_factors.append(c3s_score)
            
            # C2S: optimal range 15-25%
            c2s_score = 1.0 - min(1.0, abs(c2s - 20.0) / 10.0)
            quality_factors.append(c2s_score)
            
            # C3A: optimal range 6-10%
            c3a_score = 1.0 - min(1.0, abs(c3a - 8.0) / 4.0)
            quality_factors.append(c3a_score)
            
            # C4AF: optimal range 8-12%
            c4af_score = 1.0 - min(1.0, abs(c4af - 10.0) / 4.0)
            quality_factors.append(c4af_score)
            
            # Free CaO: should be < 2%, heavily penalize high values
            if free_cao <= 1.0:
                free_cao_score = 1.0
            elif free_cao <= 2.0:
                free_cao_score = 1.0 - (free_cao - 1.0)
            else:
                free_cao_score = max(0.0, 1.0 - (free_cao - 1.0) * 0.5)
            
            quality_factors.append(free_cao_score * 2)  # Double weight for free CaO
            
            # Calculate weighted average
            return max(0.0, min(1.0, np.mean(quality_factors)))
            
        except Exception as e:
            logger.error(f"Error calculating quality score: {e}")
            return 0.5  # Default moderate quality

    def _calculate_energy_efficiency(self, sensor_data: KilnSensorData) -> float:
        """Calculate energy efficiency based on current operating conditions"""
        try:
            # Optimal operating conditions
            optimal_fuel_rate = 50.0  # kg/hr
            optimal_temp = 1450.0     # °C
            optimal_o2 = 3.0          # %
            optimal_feed_rate = 120.0 # tons/hr
            
            # Calculate individual efficiency factors
            fuel_efficiency = 1.0 - min(1.0, abs(sensor_data.fuel_flow_rate - optimal_fuel_rate) / optimal_fuel_rate)
            temp_efficiency = 1.0 - min(1.0, abs(sensor_data.flame_temperature - optimal_temp) / optimal_temp)
            o2_efficiency = 1.0 - min(1.0, abs(sensor_data.o2_level - optimal_o2) / optimal_o2)
            feed_efficiency = 1.0 - min(1.0, abs(sensor_data.feed_rate - optimal_feed_rate) / optimal_feed_rate)
            
            # Penalize high CO levels (incomplete combustion)
            co_penalty = min(0.2, sensor_data.co_level / 500.0)  # Max 20% penalty
            
            # Calculate overall efficiency
            efficiency = (fuel_efficiency + temp_efficiency + o2_efficiency + feed_efficiency) / 4 - co_penalty
            
            return max(0.0, min(1.0, efficiency))
            
        except Exception as e:
            logger.error(f"Error calculating energy efficiency: {e}")
            return 0.5  # Default moderate efficiency

    async def _generate_control_decision(self, sensor_data: KilnSensorData, 
                                       prediction: ClinkerPrediction) -> ControlDecision:
        """Generate control adjustments based on predictions and thresholds"""
        try:
            # Initialize adjustments
            fuel_adjustment = 0.0
            air_adjustment = 0.0
            feed_adjustment = 0.0
            temp_setpoint = sensor_data.flame_temperature
            priority = "MEDIUM"
            reasoning_parts = []

            # Decision logic based on predictions and thresholds
            
            # 1. Free CaO control (highest priority - quality issue)
            if prediction.free_cao > self.target_thresholds['free_cao_max']:
                temp_adjustment = min(20, (prediction.free_cao - 2.0) * 8)
                temp_setpoint += temp_adjustment
                feed_adjustment = max(-2.0, -0.3 * prediction.free_cao)
                priority = "HIGH"
                reasoning_parts.append(f"High free CaO ({prediction.free_cao:.2f}%) - increasing temp by {temp_adjustment:.1f}°C, reducing feed rate")

            # 2. Temperature control
            if sensor_data.flame_temperature < self.target_thresholds['flame_temp_min']:
                fuel_adjustment = min(5.0, (self.target_thresholds['flame_temp_min'] - sensor_data.flame_temperature) * 0.1)
                reasoning_parts.append(f"Low flame temperature ({sensor_data.flame_temperature:.0f}°C) - increasing fuel by {fuel_adjustment:.1f} kg/hr")
                if priority != "HIGH":
                    priority = "MEDIUM"
                    
            elif sensor_data.flame_temperature > self.target_thresholds['flame_temp_max']:
                fuel_adjustment = max(-5.0, (self.target_thresholds['flame_temp_max'] - sensor_data.flame_temperature) * 0.1)
                reasoning_parts.append(f"High flame temperature ({sensor_data.flame_temperature:.0f}°C) - reducing fuel by {abs(fuel_adjustment):.1f} kg/hr")

            # 3. Oxygen level optimization (combustion efficiency)
            if sensor_data.o2_level > self.target_thresholds['o2_level_max']:
                # Excess air - reduce air flow
                air_adjustment = max(-10.0, (self.target_thresholds['o2_level_max'] - sensor_data.o2_level) * 2)
                reasoning_parts.append(f"Excess air (O2: {sensor_data.o2_level:.1f}%) - reducing air flow by {abs(air_adjustment):.1f} m³/min")
                
            elif sensor_data.o2_level < self.target_thresholds['o2_level_min']:
                # Insufficient air - increase air flow
                air_adjustment = min(8.0, (self.target_thresholds['o2_level_min'] - sensor_data.o2_level) * 2)
                reasoning_parts.append(f"Insufficient air (O2: {sensor_data.o2_level:.1f}%) - increasing air flow by {air_adjustment:.1f} m³/min")
                priority = "HIGH"  # Risk of incomplete combustion

            # 4. CO level control (safety and efficiency)
            if sensor_data.co_level > self.target_thresholds['co_level_max']:
                # High CO indicates incomplete combustion
                if air_adjustment == 0:  # Don't override O2-based air adjustment
                    air_adjustment = min(5.0, (sensor_data.co_level - self.target_thresholds['co_level_max']) * 0.05)
                priority = "HIGH"
                reasoning_parts.append(f"High CO level ({sensor_data.co_level:.0f} ppm) - safety concern")

            # Compile reasoning
            reasoning = "; ".join(reasoning_parts) if reasoning_parts else "Optimal operation - no adjustments needed"
            
            # Apply confidence factor to adjustments
            confidence_factor = prediction.confidence
            fuel_adjustment *= confidence_factor
            air_adjustment *= confidence_factor
            feed_adjustment *= confidence_factor

            return ControlDecision(
                fuel_flow_adjustment=fuel_adjustment,
                air_flow_adjustment=air_adjustment,
                feed_rate_adjustment=feed_adjustment,
                temperature_setpoint=temp_setpoint,
                priority=priority,
                reasoning=reasoning
            )

        except Exception as e:
            logger.error(f"Error generating control decision: {e}")
            raise

    def _store_decision(self, sensor_data: KilnSensorData,
                      prediction: ClinkerPrediction,
                      decision: ControlDecision):
        """Store decision for learning and analysis"""
        try:
            decision_record = {
                'timestamp': datetime.now().isoformat(),
                'sensor_data': {
                    'flame_temperature': sensor_data.flame_temperature,
                    'material_temperature': sensor_data.material_temperature,
                    'o2_level': sensor_data.o2_level,
                    'co_level': sensor_data.co_level,
                    'fuel_flow_rate': sensor_data.fuel_flow_rate,
                    'feed_rate': sensor_data.feed_rate
                },
                'prediction': {
                    'quality_score': prediction.quality_score,
                    'energy_efficiency': prediction.energy_efficiency,
                    'free_cao': prediction.free_cao,
                    'confidence': prediction.confidence
                },
                'decision': {
                    'fuel_flow_adjustment': decision.fuel_flow_adjustment,
                    'air_flow_adjustment': decision.air_flow_adjustment,
                    'feed_rate_adjustment': decision.feed_rate_adjustment,
                    'temperature_setpoint': decision.temperature_setpoint,
                    'priority': decision.priority,
                    'reasoning': decision.reasoning
                }
            }
            
            # Add to in-memory history (circular buffer)
            self.decision_history.append(decision_record)
            if len(self.decision_history) > self.max_history_size:
                self.decision_history = self.decision_history[-self.max_history_size:]
            
        except Exception as e:
            logger.error(f"Error storing decision history: {e}")

    def _make_json_serializable(self, obj):
        """Convert datetime objects to ISO format strings in nested dictionaries"""
        if isinstance(obj, dict):
            return {k: self._make_json_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._make_json_serializable(item) for item in obj]
        elif isinstance(obj, datetime):
            return obj.isoformat()
        else:
            return obj

    def get_status(self) -> Dict:
        """Get current agent status"""
        uptime = (datetime.now() - self.start_time).total_seconds()
        
        model_info = {
            'type': type(self.clinker_model).__name__,
            'has_scaler': self.scaler is not None
        }
        
        last_decision = None
        if self.decision_history:
            # Make JSON serializable by converting datetime objects
            last_decision = self._make_json_serializable(self.decision_history[-1])
        
        # Convert metrics to be JSON serializable
        metrics = self._make_json_serializable(self.metrics)
        
        return {
            'status': 'running',
            'metrics': metrics,
            'uptime_seconds': int(uptime),
            'model_info': model_info,
            'last_decision': last_decision
        }

async def start_server():
    """Start the FastAPI server"""
    import uvicorn
    from fastapi import FastAPI, HTTPException, Request
    from pydantic import BaseModel
    from typing import Optional, Dict, Any, List
    
    app = FastAPI(title="Clinkerization Agent API")
    
    # Initialize the agent
    clinker_agent = ClinkerizationAgent()
    
    class SensorData(BaseModel):
        flame_temperature: float
        material_temperature: float
        o2_level: float
        co_level: float
        fuel_flow_rate: float
        feed_rate: float
        # Optional fields
        shell_temperature: Optional[float] = None
        draft_pressure: Optional[float] = None
        combustion_air_pressure: Optional[float] = None
        nox_level: Optional[float] = None
        raw_meal_flow: Optional[float] = None
        kiln_rpm: Optional[float] = None
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint"""
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "agent": clinker_agent.get_status()
        }
    
    @app.post("/optimize")
    async def optimize(data: SensorData):
        """Process sensor data and return optimization decision"""
        try:
            result = await clinker_agent.process_sensor_data(data.dict())
            return result
        except Exception as e:
            logger.error(f"Error processing sensor data: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.post("/analyze")
    async def analyze(data: Dict[str, Any]):
        """Analyze historical data or perform special analysis"""
        try:
            # Handle different types of analysis
            if "sensor_history" in data:
                # Process historical sensor data
                results = []
                for entry in data["sensor_history"]:
                    result = await clinker_agent.process_sensor_data(entry)
                    results.append(result)
                return {"results": results}
            else:
                # Default to current status
                return clinker_agent.get_status()
        except Exception as e:
            logger.error(f"Error in analysis: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    # Run the server
    logger.info("Starting Clinkerization Agent API on port 8002")
    config = uvicorn.Config(app, host="0.0.0.0", port=8002)
    server = uvicorn.Server(config)
    await server.serve()

async def main():
    """Main function for testing the Clinkerization Agent"""
    print("🔥 Clinkerization Agent Starting...")
    
    agent = ClinkerizationAgent()
    
    # Create example sensor data
    example_data = KilnSensorData(
        timestamp=datetime.now(),
        flame_temperature=1450.0,
        material_temperature=1200.0,
        shell_temperature=320.0,
        draft_pressure=-50.0,
        combustion_air_pressure=200.0,
        o2_level=2.5,
        co_level=30.0,
        nox_level=750.0,
        raw_meal_flow=100.0,
        fuel_flow_rate=45.0,
        kiln_rpm=2.5,
        feed_rate=120.0
    )
    
    # Process the data
    result = await agent.process_sensor_data(example_data)
    print("\nProcessing optimal conditions:")
    print(json.dumps(result, indent=2))
    
    # Test with high temperature
    high_temp_data = KilnSensorData(
        timestamp=datetime.now(),
        flame_temperature=1550.0,
        material_temperature=1250.0,
        shell_temperature=350.0,
        draft_pressure=-52.0,
        combustion_air_pressure=210.0,
        o2_level=2.3,
        co_level=45.0,
        nox_level=780.0,
        raw_meal_flow=100.0,
        fuel_flow_rate=50.0,
        kiln_rpm=2.5,
        feed_rate=120.0
    )
    
    result = await agent.process_sensor_data(high_temp_data)
    print("\nProcessing high temperature conditions:")
    print(json.dumps(result, indent=2))
    
    # Test with low oxygen
    low_o2_data = KilnSensorData(
        timestamp=datetime.now(),
        flame_temperature=1430.0,
        material_temperature=1180.0,
        shell_temperature=340.0,
        draft_pressure=-55.0,
        combustion_air_pressure=190.0,
        o2_level=1.5,  # Below threshold
        co_level=120.0,
        nox_level=780.0,
        raw_meal_flow=95.0,
        fuel_flow_rate=43.0,
        kiln_rpm=2.4,
        feed_rate=115.0
    )
    
    result = await agent.process_sensor_data(low_o2_data)
    print("\nProcessing low oxygen conditions:")
    print(json.dumps(result, indent=2))
    
    # Print agent status
    status = agent.get_status()
    print("\nAgent Status:")
    print(json.dumps(status, indent=2))

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "serve":
        # Run as API server
        asyncio.run(start_server())
    else:
        # Run test examples
        asyncio.run(main())