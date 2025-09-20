import asyncio, json, logging, joblib,requests,os #type: ignore
import numpy as np #type: ignore
import pandas as pd #type: ignore
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from google.cloud import pubsub_v1, bigquery
from google.cloud import aiplatform
from sklearn.ensemble import RandomForestRegressor #type: ignore
from sklearn.preprocessing import StandardScaler #type: ignore

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
    
    This agent continuously monitors kiln sensor data and makes real-time
    control decisions to optimize energy efficiency, product quality, and
    environmental performance.
    """
    
    def __init__(self, project_id: str, subscription_name: str, 
                 model_endpoint: str, bigquery_dataset: str,
                 orchestrator_endpoint: Optional[str] = None):
        """
        Initialize the Clinkerization Agent
        
        Args:
            project_id: Google Cloud Project ID
            subscription_name: Pub/Sub subscription for sensor data
            model_endpoint: Vertex AI model endpoint for predictions
            bigquery_dataset: BigQuery dataset for data storage
            orchestrator_endpoint: URL for orchestrator communication
        """
        self.project_id = project_id
        self.subscription_name = subscription_name
        self.model_endpoint = model_endpoint
        self.bigquery_dataset = bigquery_dataset
        self.orchestrator_endpoint = orchestrator_endpoint or os.getenv('ORCHESTRATOR_ENDPOINT')
        
        # Initialize Google Cloud clients
        self.subscriber = pubsub_v1.SubscriberClient()
        self.bigquery_client = bigquery.Client()
        self.subscription_path = self.subscriber.subscription_path(
            project_id, subscription_name
        )
        
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
        
        # Self-correction tracking
        self.correction_attempts = 0
        self.max_correction_attempts = 3
        self.last_decision_time = None
        self.decision_history = []
        
        # Performance metrics
        self.metrics = {
            'messages_processed': 0,
            'decisions_made': 0,
            'corrections_attempted': 0,
            'escalations_to_human': 0,
            'last_performance_check': datetime.now()
        }

    def _load_clinker_prediction_model(self):
        """Load pre-trained ML model for clinker prediction"""
        try:
            # In production, load from Vertex AI Model Registry
            # For initial deployment, use a pre-trained model
            
            model_path = os.getenv('CLINKER_MODEL_PATH', './models/clinker_model.pkl')
            
            if os.path.exists(model_path):
                logger.info(f"Loading clinker model from {model_path}")
                return joblib.load(model_path)
            else:
                logger.warning("Model file not found, initializing with default model")
                # Initialize with a basic model structure
                model = RandomForestRegressor(
                    n_estimators=100, 
                    random_state=42,
                    max_depth=10,
                    min_samples_split=5
                )
                
                # Create dummy training data with realistic distributions
                # This should be replaced with actual historical data
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
                
        except Exception as e:
            logger.error(f"Error loading clinker model: {e}")
            raise

    def _load_data_scaler(self):
        """Load data preprocessing scaler"""
        try:
            scaler_path = os.getenv('SCALER_PATH', './models/scaler.pkl')
            
            if os.path.exists(scaler_path):
                logger.info(f"Loading scaler from {scaler_path}")
                return joblib.load(scaler_path)
            else:
                logger.warning("Scaler file not found, initializing with default scaler")
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
                
        except Exception as e:
            logger.error(f"Error loading scaler: {e}")
            raise

    async def start_autonomous_cycle(self):
        """
        Main autonomous cycle - continuously processes streaming data
        
        This is the primary entry point for the agent. It starts concurrent
        tasks for data processing, decision monitoring, and self-correction.
        """
        logger.info("Starting Clinkerization Agent autonomous cycle...")
        logger.info(f"Project: {self.project_id}")
        logger.info(f"Subscription: {self.subscription_name}")
        logger.info(f"Dataset: {self.bigquery_dataset}")
        
        try:
            # Start concurrent tasks
            tasks = [
                asyncio.create_task(self._stream_data_processor()),
                asyncio.create_task(self._decision_monitor()),
                asyncio.create_task(self._self_correction_loop()),
                asyncio.create_task(self._performance_monitor())
            ]
            
            # Wait for all tasks to complete (they run indefinitely)
            await asyncio.gather(*tasks)
            
        except KeyboardInterrupt:
            logger.info("Received shutdown signal, stopping agent...")
        except Exception as e:
            logger.error(f"Critical error in autonomous cycle: {e}")
            await self._escalate_to_human(None, None, f"Critical system error: {e}")
            raise

    async def _stream_data_processor(self):
        """Process streaming IoT data from Pub/Sub"""
        logger.info(f"Starting stream data processor for subscription: {self.subscription_path}")
        
        def callback(message):
            try:
                # Parse incoming sensor data
                sensor_data = self._parse_sensor_message(message.data)
                
                # Process data asynchronously
                asyncio.create_task(self._process_sensor_data(sensor_data))
                
                # Acknowledge message
                message.ack()
                self.metrics['messages_processed'] += 1
                
                if self.metrics['messages_processed'] % 100 == 0:
                    logger.info(f"Processed {self.metrics['messages_processed']} messages")
                
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                message.nack()

        # Configure flow control for optimal performance
        flow_control = pubsub_v1.types.FlowControl(
            max_messages=100,
            max_bytes=1024*1024  # 1MB
        )
        
        # Start pulling messages
        streaming_pull_future = self.subscriber.subscribe(
            self.subscription_path, 
            callback=callback,
            flow_control=flow_control
        )
        
        try:
            logger.info("Listening for sensor data messages...")
            await asyncio.get_event_loop().run_in_executor(
                None, streaming_pull_future.result
            )
        except KeyboardInterrupt:
            streaming_pull_future.cancel()
            logger.info("Stream processor stopped")

    def _parse_sensor_message(self, message_data: bytes) -> KilnSensorData:
        """Parse Pub/Sub message into structured sensor data"""
        try:
            data = json.loads(message_data.decode('utf-8'))
            
            return KilnSensorData(
                timestamp=datetime.fromisoformat(data['timestamp']),
                flame_temperature=float(data['flame_temperature']),
                material_temperature=float(data['material_temperature']),
                shell_temperature=float(data['shell_temperature']),
                draft_pressure=float(data['draft_pressure']),
                combustion_air_pressure=float(data['combustion_air_pressure']),
                o2_level=float(data['o2_level']),
                co_level=float(data['co_level']),
                nox_level=float(data['nox_level']),
                raw_meal_flow=float(data['raw_meal_flow']),
                fuel_flow_rate=float(data['fuel_flow_rate']),
                kiln_rpm=float(data['kiln_rpm']),
                feed_rate=float(data['feed_rate'])
            )
            
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.error(f"Error parsing sensor data: {e}")
            logger.error(f"Raw message: {message_data}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error parsing sensor data: {e}")
            raise

    async def _process_sensor_data(self, sensor_data: KilnSensorData):
        """Core processing: analyze data and make decisions"""
        try:
            # Step 1: Validate sensor data
            if not self._validate_sensor_data(sensor_data):
                logger.warning("Invalid sensor data received, skipping processing")
                return
            
            # Step 2: Get historical context
            historical_context = await self._get_historical_context()
            
            # Step 3: Predict clinker quality and phases
            prediction = await self._predict_clinker_quality(sensor_data, historical_context)
            
            # Step 4: Generate control decisions
            decision = await self._generate_control_decision(sensor_data, prediction)
            
            # Step 5: Validate decision
            if await self._validate_decision(decision):
                # Step 6: Send to orchestrator
                await self._send_decision_to_orchestrator(decision, sensor_data, prediction)
                
                # Step 7: Store for learning
                await self._store_decision_history(sensor_data, prediction, decision)
                
                self.metrics['decisions_made'] += 1
                logger.info(f"Decision #{self.metrics['decisions_made']}: {decision.reasoning}")
                
                # Reset correction attempts on successful decision
                self.correction_attempts = 0
                
            else:
                logger.warning("Decision validation failed, triggering self-correction")
                await self._trigger_self_correction(sensor_data, prediction)
                
        except Exception as e:
            logger.error(f"Error processing sensor data: {e}")
            await self._handle_processing_error(e, sensor_data)

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
            
            # Check timestamp is recent (within last 5 minutes)
            time_diff = datetime.now() - sensor_data.timestamp
            if time_diff > timedelta(minutes=5):
                logger.warning(f"Sensor data too old: {time_diff}")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating sensor data: {e}")
            return False

    async def _get_historical_context(self) -> Dict:
        """Fetch recent historical data from BigQuery for context"""
        try:
            query = f"""
            SELECT 
                AVG(flame_temperature) as avg_flame_temp,
                AVG(energy_efficiency) as avg_efficiency,
                AVG(quality_score) as avg_quality,
                STDDEV(flame_temperature) as temp_variance,
                COUNT(*) as data_points,
                MAX(timestamp) as latest_timestamp
            FROM `{self.project_id}.{self.bigquery_dataset}.kiln_data`
            WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
            """
            
            query_job = self.bigquery_client.query(query)
            results = query_job.result()
            
            context = {
                'avg_flame_temp': 1450.0,
                'avg_efficiency': 0.8,
                'avg_quality': 0.85,
                'temp_variance': 10.0,
                'data_points': 0
            }
            
            for row in results:
                context = {
                    'avg_flame_temp': float(row.avg_flame_temp) if row.avg_flame_temp else 1450.0,
                    'avg_efficiency': float(row.avg_efficiency) if row.avg_efficiency else 0.8,
                    'avg_quality': float(row.avg_quality) if row.avg_quality else 0.85,
                    'temp_variance': float(row.temp_variance) if row.temp_variance else 10.0,
                    'data_points': int(row.data_points) if row.data_points else 0
                }
                break
            
            return context
            
        except Exception as e:
            logger.error(f"Error fetching historical context: {e}")
            # Return default context if BigQuery fails
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
        try:
            base_confidence = 0.8  # Base confidence level
            
            # Adjust confidence based on historical data availability
            if context.get('data_points', 0) > 50:
                data_confidence = 0.1
            elif context.get('data_points', 0) > 20:
                data_confidence = 0.05
            else:
                data_confidence = -0.1  # Lower confidence with limited data
            
            # Adjust confidence based on process stability
            temp_variance = context.get('temp_variance', 10.0)
            if temp_variance < 5.0:
                stability_confidence = 0.1  # Stable conditions
            elif temp_variance > 20.0:
                stability_confidence = -0.1  # Unstable conditions
            else:
                stability_confidence = 0.0
            
            # For RandomForest, use prediction variance across trees
            if hasattr(self.clinker_model, 'estimators_'):
                try:
                    tree_predictions = [tree.predict(features) for tree in self.clinker_model.estimators_[:10]]
                    # Flatten if needed - handle both mock and real model outputs
                    tree_predictions = [pred[0] if isinstance(pred, np.ndarray) and pred.ndim > 1 else pred for pred in tree_predictions]
                    variance = np.var(tree_predictions, axis=0).mean()
                    model_confidence = max(-0.2, 0.1 - variance * 0.01)
                except (AttributeError, IndexError, TypeError):
                    # Fallback for mock models or unexpected formats
                    model_confidence = 0.0
            else:
                model_confidence = 0.0
            
            total_confidence = base_confidence + data_confidence + stability_confidence + model_confidence
            return max(0.1, min(1.0, total_confidence))
            
        except Exception as e:
            logger.error(f"Error calculating prediction confidence: {e}")
            return 0.5  # Default moderate confidence

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

            # 5. Energy efficiency optimization
            if prediction.energy_efficiency < self.target_thresholds['energy_efficiency_min']:
                if not reasoning_parts:  # Only if no other major issues
                    # Fine-tune for efficiency
                    if abs(fuel_adjustment) < 1.0:
                        fuel_adjustment += -0.5 if sensor_data.fuel_flow_rate > 50 else 0.5
                    reasoning_parts.append(f"Low energy efficiency ({prediction.energy_efficiency:.2f}) - optimizing fuel rate")

            # 6. Quality score optimization
            if prediction.quality_score < self.target_thresholds['quality_score_min']:
                if not reasoning_parts:  # Conservative adjustment if no other issues
                    feed_adjustment = max(-1.0, feed_adjustment - 0.3)
                    reasoning_parts.append(f"Low quality score ({prediction.quality_score:.2f}) - reducing feed rate")
                priority = "HIGH"

            # 7. Process stability check
            if abs(fuel_adjustment) > 3.0 or abs(air_adjustment) > 8.0:
                priority = "HIGH"
                reasoning_parts.append("Large adjustments required - monitoring closely")

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

    async def _validate_decision(self, decision: ControlDecision) -> bool:
        """Validate decision against safety limits and operational constraints"""
        try:
            # Safety limit checks
            if abs(decision.fuel_flow_adjustment) > self.safety_limits['max_fuel_adjustment']:
                logger.warning(f"Fuel adjustment too large: {decision.fuel_flow_adjustment}")
                return False
            
            if abs(decision.air_flow_adjustment) > self.safety_limits['max_air_adjustment']:
                logger.warning(f"Air flow adjustment too large: {decision.air_flow_adjustment}")
                return False
            
            if abs(decision.feed_rate_adjustment) > self.safety_limits['max_feed_adjustment']:
                logger.warning(f"Feed rate adjustment too large: {decision.feed_rate_adjustment}")
                return False
            
            if (decision.temperature_setpoint > self.safety_limits['max_temp_setpoint'] or 
                decision.temperature_setpoint < self.safety_limits['min_temp_setpoint']):
                logger.warning(f"Temperature setpoint out of range: {decision.temperature_setpoint}")
                return False
            
            # Operational stability checks
            if len(self.decision_history) > 5:
                recent_decisions = self.decision_history[-5:]
                
                # Check for oscillating decisions
                fuel_adjustments = [d['decision']['fuel_flow_adjustment'] for d in recent_decisions]
                if len(fuel_adjustments) >= 3:
                    signs = [np.sign(adj) for adj in fuel_adjustments[-3:]]
                    if len(set(signs)) > 2:  # Alternating signs indicate oscillation
                        logger.warning("Detected oscillating fuel adjustments")
                        return False
                
                # Check for too many consecutive high-priority decisions
                high_priority_count = sum(1 for d in recent_decisions if d['decision']['priority'] == 'HIGH')
                if high_priority_count >= 4:
                    logger.warning("Too many consecutive high-priority decisions")
                    return False
            
            # Check if decision makes sense given current conditions
            if decision.priority == "HIGH" and all(abs(adj) < 0.1 for adj in [
                decision.fuel_flow_adjustment, 
                decision.air_flow_adjustment, 
                decision.feed_rate_adjustment
            ]):
                logger.warning("High priority decision with minimal adjustments - suspicious")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating decision: {e}")
            return False

    async def _send_decision_to_orchestrator(self, decision: ControlDecision, 
                                           sensor_data: KilnSensorData,
                                           prediction: ClinkerPrediction):
        """Send decision to central orchestrator"""
        try:
            if not self.orchestrator_endpoint:
                logger.warning("No orchestrator endpoint configured, skipping decision transmission")
                return
            
            payload = {
                'agent_id': 'clinkerization_agent',
                'timestamp': datetime.now().isoformat(),
                'decision': {
                    'fuel_flow_adjustment': decision.fuel_flow_adjustment,
                    'air_flow_adjustment': decision.air_flow_adjustment,
                    'feed_rate_adjustment': decision.feed_rate_adjustment,
                    'temperature_setpoint': decision.temperature_setpoint,
                    'priority': decision.priority,
                    'reasoning': decision.reasoning
                },
                'current_state': {
                    'flame_temperature': sensor_data.flame_temperature,
                    'fuel_flow_rate': sensor_data.fuel_flow_rate,
                    'o2_level': sensor_data.o2_level,
                    'co_level': sensor_data.co_level,
                    'feed_rate': sensor_data.feed_rate
                },
                'predictions': {
                    'quality_score': prediction.quality_score,
                    'energy_efficiency': prediction.energy_efficiency,
                    'free_cao': prediction.free_cao,
                    'confidence': prediction.confidence,
                    'c3s_content': prediction.c3s_content,
                    'c2s_content': prediction.c2s_content
                },
                'metadata': {
                    'correction_attempt': self.correction_attempts,
                    'agent_version': '1.0.0',
                    'model_confidence': prediction.confidence
                }
            }
            
            # Send to orchestrator with timeout
            timeout = 5  # seconds
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'ClinkerizationAgent/1.0.0'
            }
            
            response = requests.post(
                self.orchestrator_endpoint,
                json=payload,
                headers=headers,
                timeout=timeout
            )
            
            if response.status_code == 200:
                logger.info("Decision successfully sent to orchestrator")
                self.last_decision_time = datetime.now()
                
                # Parse response for any feedback
                try:
                    response_data = response.json()
                    if 'feedback' in response_data:
                        logger.info(f"Orchestrator feedback: {response_data['feedback']}")
                except:
                    pass  # Ignore response parsing errors
                    
            else:
                logger.error(f"Failed to send decision to orchestrator: HTTP {response.status_code}")
                logger.error(f"Response: {response.text}")
                
        except requests.Timeout:
            logger.error("Timeout sending decision to orchestrator")
        except requests.ConnectionError:
            logger.error("Connection error sending decision to orchestrator")
        except Exception as e:
            logger.error(f"Error sending decision to orchestrator: {e}")

    async def _store_decision_history(self, sensor_data: KilnSensorData,
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
                },
                'correction_attempt': self.correction_attempts
            }
            
            # Add to in-memory history (circular buffer)
            self.decision_history.append(decision_record)
            if len(self.decision_history) > 100:
                self.decision_history = self.decision_history[-100:]
            
            # Store in BigQuery for long-term analysis
            await self._store_in_bigquery(decision_record)
            
        except Exception as e:
            logger.error(f"Error storing decision history: {e}")

    async def _store_in_bigquery(self, decision_record: Dict):
        """Store decision record in BigQuery"""
        try:
            table_id = f"{self.project_id}.{self.bigquery_dataset}.decision_history"
            
            # Flatten the record for BigQuery
            flattened_record = {
                'timestamp': decision_record['timestamp'],
                'flame_temperature': decision_record['sensor_data']['flame_temperature'],
                'material_temperature': decision_record['sensor_data']['material_temperature'],
                'o2_level': decision_record['sensor_data']['o2_level'],
                'co_level': decision_record['sensor_data']['co_level'],
                'fuel_flow_rate': decision_record['sensor_data']['fuel_flow_rate'],
                'feed_rate': decision_record['sensor_data']['feed_rate'],
                'quality_score': decision_record['prediction']['quality_score'],
                'energy_efficiency': decision_record['prediction']['energy_efficiency'],
                'free_cao': decision_record['prediction']['free_cao'],
                'confidence': decision_record['prediction']['confidence'],
                'fuel_adjustment': decision_record['decision']['fuel_flow_adjustment'],
                'air_adjustment': decision_record['decision']['air_flow_adjustment'],
                'feed_adjustment': decision_record['decision']['feed_rate_adjustment'],
                'temperature_setpoint': decision_record['decision']['temperature_setpoint'],
                'priority': decision_record['decision']['priority'],
                'reasoning': decision_record['decision']['reasoning'],
                'correction_attempt': decision_record['correction_attempt']
            }
            
            # Insert into BigQuery
            errors = self.bigquery_client.insert_rows_json(table_id, [flattened_record])
            
            if errors:
                logger.error(f"Error storing in BigQuery: {errors}")
            
        except Exception as e:
            logger.error(f"Error storing in BigQuery: {e}")

    async def _trigger_self_correction(self, sensor_data: KilnSensorData,
                                     prediction: ClinkerPrediction):
        """Trigger self-correction mechanism"""
        self.correction_attempts += 1
        self.metrics['corrections_attempted'] += 1
        
        if self.correction_attempts <= self.max_correction_attempts:
            logger.info(f"Starting self-correction attempt {self.correction_attempts}/{self.max_correction_attempts}")
            
            # Wait before retry to allow system to stabilize
            await asyncio.sleep(10)
            
            # Generate alternative decision with more conservative parameters
            conservative_decision = await self._generate_conservative_decision(sensor_data, prediction)
            
            if await self._validate_decision(conservative_decision):
                await self._send_decision_to_orchestrator(
                    conservative_decision, sensor_data, prediction
                )
                await self._store_decision_history(sensor_data, prediction, conservative_decision)
                
                logger.info("Self-correction successful")
                self.correction_attempts = 0  # Reset counter on success
            else:
                logger.warning(f"Self-correction attempt {self.correction_attempts} failed")
                if self.correction_attempts >= self.max_correction_attempts:
                    await self._escalate_to_human(sensor_data, prediction, "Self-correction failed")
        else:
            # Escalate to human
            await self._escalate_to_human(sensor_data, prediction, "Maximum self-correction attempts exceeded")

    async def _generate_conservative_decision(self, sensor_data: KilnSensorData,
                                           prediction: ClinkerPrediction) -> ControlDecision:
        """Generate more conservative decision for self-correction"""
        try:
            # Get the normal decision first
            normal_decision = await self._generate_control_decision(sensor_data, prediction)
            
            # Apply conservative factors
            conservative_factor = 0.5  # Reduce all adjustments by 50%
            
            return ControlDecision(
                fuel_flow_adjustment=normal_decision.fuel_flow_adjustment * conservative_factor,
                air_flow_adjustment=normal_decision.air_flow_adjustment * conservative_factor,
                feed_rate_adjustment=normal_decision.feed_rate_adjustment * conservative_factor,
                temperature_setpoint=sensor_data.flame_temperature,  # No temp change in conservative mode
                priority="LOW",
                reasoning=f"Conservative adjustment (attempt {self.correction_attempts}): {normal_decision.reasoning}"
            )
            
        except Exception as e:
            logger.error(f"Error generating conservative decision: {e}")
            # Return minimal adjustment as fallback
            return ControlDecision(
                fuel_flow_adjustment=0.0,
                air_flow_adjustment=0.0,
                feed_rate_adjustment=0.0,
                temperature_setpoint=sensor_data.flame_temperature,
                priority="LOW",
                reasoning="Conservative fallback - no adjustments"
            )

    async def _escalate_to_human(self, sensor_data: Optional[KilnSensorData],
                               prediction: Optional[ClinkerPrediction],
                               reason: str):
        """Escalate to human operator when autonomous correction fails"""
        self.metrics['escalations_to_human'] += 1
        
        logger.critical(f"HUMAN INTERVENTION REQUIRED: {reason}")
        
        escalation_data = {
            'timestamp': datetime.now().isoformat(),
            'reason': reason,
            'correction_attempts': self.correction_attempts,
            'recent_decisions': self.decision_history[-5:] if self.decision_history else [],
            'agent_metrics': self.metrics
        }
        
        if sensor_data:
            escalation_data['current_sensor_data'] = {
                'flame_temperature': sensor_data.flame_temperature,
                'o2_level': sensor_data.o2_level,
                'co_level': sensor_data.co_level,
                'fuel_flow_rate': sensor_data.fuel_flow_rate
            }
        
        if prediction:
            escalation_data['current_prediction'] = {
                'quality_score': prediction.quality_score,
                'energy_efficiency': prediction.energy_efficiency,
                'free_cao': prediction.free_cao,
                'confidence': prediction.confidence
            }
        
        # Send escalation alert through multiple channels
        await self._send_escalation_alert(escalation_data)
        
        # Reset correction counter
        self.correction_attempts = 0

    async def _send_escalation_alert(self, escalation_data: Dict):
        """Send escalation alert to human operators"""
        try:
            # Send to orchestrator if available
            if self.orchestrator_endpoint:
                alert_payload = {
                    'alert_type': 'HUMAN_ESCALATION',
                    'agent_id': 'clinkerization_agent',
                    'severity': 'CRITICAL',
                    'data': escalation_data
                }
                
                try:
                    response = requests.post(
                        f"{self.orchestrator_endpoint.replace('/api/decisions', '/alerts')}",
                        json=alert_payload,
                        timeout=5
                    )
                    if response.status_code == 200:
                        logger.info("Escalation alert sent to orchestrator")
                except:
                    logger.error("Failed to send escalation alert to orchestrator")
            
            # Store escalation in BigQuery for tracking
            try:
                table_id = f"{self.project_id}.{self.bigquery_dataset}.escalations"
                self.bigquery_client.insert_rows_json(table_id, [escalation_data])
            except:
                logger.error("Failed to store escalation in BigQuery")
            
            # Log detailed escalation information
            logger.critical("="*50)
            logger.critical("CLINKERIZATION AGENT ESCALATION")
            logger.critical("="*50)
            logger.critical(f"Reason: {escalation_data['reason']}")
            logger.critical(f"Timestamp: {escalation_data['timestamp']}")
            logger.critical(f"Correction Attempts: {escalation_data['correction_attempts']}")
            logger.critical("="*50)
            
        except Exception as e:
            logger.error(f"Error sending escalation alert: {e}")

    async def _handle_processing_error(self, error: Exception, sensor_data: Optional[KilnSensorData]):
        """Handle errors in sensor data processing"""
        try:
            error_data = {
                'timestamp': datetime.now().isoformat(),
                'error_type': type(error).__name__,
                'error_message': str(error),
                'sensor_data_available': sensor_data is not None
            }
            
            if sensor_data:
                error_data['flame_temperature'] = sensor_data.flame_temperature
                error_data['fuel_flow_rate'] = sensor_data.fuel_flow_rate
            
            # Store error for analysis
            table_id = f"{self.project_id}.{self.bigquery_dataset}.processing_errors"
            try:
                self.bigquery_client.insert_rows_json(table_id, [error_data])
            except:
                pass  # Don't fail on error logging
            
            # If too many errors, escalate
            recent_errors = [r for r in self.decision_history[-10:] 
                           if 'error' in r.get('type', '')]
            
            if len(recent_errors) > 5:
                await self._escalate_to_human(
                    sensor_data, None, 
                    f"Multiple processing errors: {error}"
                )
                
        except Exception as e:
            logger.error(f"Error handling processing error: {e}")

    async def _decision_monitor(self):
        """Monitor decision implementation and outcomes"""
        logger.info("Starting decision monitor")
        
        while True:
            try:
                if self.last_decision_time:
                    time_since_decision = datetime.now() - self.last_decision_time
                    
                    # Evaluate decision outcome after 2 minutes
                    if time_since_decision > timedelta(minutes=2):
                        await self._evaluate_decision_outcome()
                        self.last_decision_time = None  # Reset to avoid re-evaluation
                
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in decision monitor: {e}")
                await asyncio.sleep(60)

    async def _evaluate_decision_outcome(self):
        """Evaluate the outcome of previous decisions for learning"""
        try:
            # Fetch recent performance data
            query = f"""
            SELECT 
                AVG(quality_score) as avg_quality,
                AVG(energy_efficiency) as avg_efficiency,
                COUNT(*) as samples,
                STDDEV(flame_temperature) as temp_stability
            FROM `{self.project_id}.{self.bigquery_dataset}.kiln_data`
            WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 5 MINUTE)
            """
            
            query_job = self.bigquery_client.query(query)
            results = query_job.result()
            
            for row in results:
                if row.samples and row.samples > 0:
                    current_quality = row.avg_quality or 0.5
                    current_efficiency = row.avg_efficiency or 0.5
                    temp_stability = row.temp_stability or 10.0
                    
                    # Evaluate performance against targets
                    quality_ok = current_quality >= self.target_thresholds['quality_score_min']
                    efficiency_ok = current_efficiency >= self.target_thresholds['energy_efficiency_min']
                    stability_ok = temp_stability < 15.0
                    
                    if quality_ok and efficiency_ok and stability_ok:
                        logger.info(f"Decision outcome: SUCCESS - Quality: {current_quality:.2f}, Efficiency: {current_efficiency:.2f}")
                    else:
                        issues = []
                        if not quality_ok:
                            issues.append(f"low quality ({current_quality:.2f})")
                        if not efficiency_ok:
                            issues.append(f"low efficiency ({current_efficiency:.2f})")
                        if not stability_ok:
                            issues.append(f"poor stability ({temp_stability:.1f})")
                        
                        logger.warning(f"Decision outcome: SUBOPTIMAL - {', '.join(issues)}")
                break
                
        except Exception as e:
            logger.error(f"Error evaluating decision outcome: {e}")

    async def _self_correction_loop(self):
        """Continuous self-correction and learning loop"""
        logger.info("Starting self-correction loop")
        
        while True:
            try:
                # Periodic model performance check
                await self._check_model_performance()
                
                # Reset correction attempts periodically if no recent activity
                if self.correction_attempts > 0 and self.last_decision_time:
                    time_since_last = datetime.now() - self.last_decision_time
                    if time_since_last > timedelta(minutes=15):
                        self.correction_attempts = 0
                        logger.info("Reset correction attempt counter due to inactivity")
                
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                logger.error(f"Error in self-correction loop: {e}")
                await asyncio.sleep(600)

    async def _check_model_performance(self):
        """Check if ML model performance is degrading"""
        try:
            if len(self.decision_history) >= 20:
                recent_decisions = self.decision_history[-20:]
                
                # Check decision quality indicators
                high_priority_count = sum(1 for d in recent_decisions 
                                        if d['decision']['priority'] == 'HIGH')
                
                low_confidence_count = sum(1 for d in recent_decisions 
                                         if d['prediction']['confidence'] < 0.6)
                
                # Alert if model performance seems poor
                if high_priority_count > 15:  # More than 75% high priority
                    logger.warning(f"High proportion of high-priority decisions ({high_priority_count}/20) - model may need retraining")
                
                if low_confidence_count > 10:  # More than 50% low confidence
                    logger.warning(f"High proportion of low-confidence predictions ({low_confidence_count}/20) - model uncertainty high")
                
                # Check for decision effectiveness
                quality_scores = [d['prediction']['quality_score'] for d in recent_decisions]
                avg_quality = np.mean(quality_scores)
                
                if avg_quality < 0.7:
                    logger.warning(f"Low average predicted quality ({avg_quality:.2f}) - review decision logic")
                
        except Exception as e:
            logger.error(f"Error checking model performance: {e}")

    async def _performance_monitor(self):
        """Monitor agent performance metrics"""
        logger.info("Starting performance monitor")
        
        while True:
            try:
                current_time = datetime.now()
                time_since_last_check = current_time - self.metrics['last_performance_check']
                
                if time_since_last_check > timedelta(minutes=10):
                    # Log performance metrics
                    logger.info("="*40)
                    logger.info("AGENT PERFORMANCE METRICS")
                    logger.info("="*40)
                    logger.info(f"Messages Processed: {self.metrics['messages_processed']}")
                    logger.info(f"Decisions Made: {self.metrics['decisions_made']}")
                    logger.info(f"Corrections Attempted: {self.metrics['corrections_attempted']}")
                    logger.info(f"Human Escalations: {self.metrics['escalations_to_human']}")
                    
                    if self.metrics['messages_processed'] > 0:
                        decision_rate = self.metrics['decisions_made'] / self.metrics['messages_processed']
                        logger.info(f"Decision Rate: {decision_rate:.2%}")
                    
                    logger.info("="*40)
                    
                    self.metrics['last_performance_check'] = current_time
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Error in performance monitor: {e}")
                await asyncio.sleep(120)

    def get_status(self) -> Dict:
        """Get current agent status"""
        return {
            'agent_id': 'clinkerization_agent',
            'status': 'running',
            'metrics': self.metrics.copy(),
            'correction_attempts': self.correction_attempts,
            'last_decision_time': self.last_decision_time.isoformat() if self.last_decision_time else None,
            'decision_history_size': len(self.decision_history),
            'target_thresholds': self.target_thresholds.copy(),
            'safety_limits': self.safety_limits.copy()
        }

# Main execution function
async def main():
    """Main function to run the Clinkerization Agent"""
    
    # Load configuration from environment variables
    PROJECT_ID = os.getenv('GCP_PROJECT_ID', 'your-gcp-project-id')
    SUBSCRIPTION_NAME = os.getenv('PUBSUB_SUBSCRIPTION', 'kiln-sensor-data-subscription')
    MODEL_ENDPOINT = os.getenv('VERTEX_AI_ENDPOINT', 'your-vertex-ai-model-endpoint')
    BIGQUERY_DATASET = os.getenv('BIGQUERY_DATASET', 'cement_plant_data')
    ORCHESTRATOR_ENDPOINT = os.getenv('ORCHESTRATOR_ENDPOINT')
    
    # Validate required configuration
    if PROJECT_ID == 'your-gcp-project-id':
        logger.error("Please set GCP_PROJECT_ID environment variable")
        return
    
    logger.info("Initializing Clinkerization Agent...")
    logger.info(f"Project ID: {PROJECT_ID}")
    logger.info(f"Subscription: {SUBSCRIPTION_NAME}")
    logger.info(f"Dataset: {BIGQUERY_DATASET}")
    
    try:
        # Initialize and start the agent
        agent = ClinkerizationAgent(
            project_id=PROJECT_ID,
            subscription_name=SUBSCRIPTION_NAME,
            model_endpoint=MODEL_ENDPOINT,
            bigquery_dataset=BIGQUERY_DATASET,
            orchestrator_endpoint=ORCHESTRATOR_ENDPOINT
        )
        
        logger.info("Agent initialized successfully")
        
        # Start the autonomous cycle
        await agent.start_autonomous_cycle()
        
    except KeyboardInterrupt:
        logger.info("Agent shutdown requested")
    except Exception as e:
        logger.error(f"Critical error in agent: {e}")
        raise

if __name__ == "__main__":
    # Set up signal handling for graceful shutdown
    import signal
    
    def signal_handler(signum, frame):
        logger.info(f"Received signal {signum}, shutting down...")
        raise KeyboardInterrupt
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Run the agent
    asyncio.run(main())