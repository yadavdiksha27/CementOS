import asyncio,json,logging,random,time
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from google.cloud import pubsub_v1

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class KilnSensorData:
    """Kiln sensor readings"""
    timestamp: str
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
class RawMaterialData:
    """Raw material composition and flow data"""
    timestamp: str
    limestone_flow: float
    clay_flow: float
    iron_ore_flow: float
    gypsum_flow: float
    limestone_cao: float
    limestone_sio2: float
    limestone_al2o3: float
    limestone_fe2o3: float
    moisture_content: float
    fineness_blaine: float

@dataclass
class QualityLabData:
    """Quality lab test results"""
    timestamp: str
    sample_id: str
    c3s_content: float
    c2s_content: float
    c3a_content: float
    c4af_content: float
    free_cao: float
    compressive_strength_3d: float
    compressive_strength_28d: float
    setting_time_initial: int
    setting_time_final: int

@dataclass
class AlternativeFuelData:
    """Alternative fuel properties and usage"""
    timestamp: str
    fuel_type: str
    calorific_value: float
    moisture_content: float
    ash_content: float
    sulfur_content: float
    chlorine_content: float
    feed_rate: float
    thermal_substitution_rate: float

@dataclass
class UtilitiesData:
    """Plant utilities consumption"""
    timestamp: str
    electrical_power: float
    compressed_air_flow: float
    cooling_water_flow: float
    fuel_consumption: float
    co2_emissions: float
    dust_emissions: float
    nox_emissions: float

class DataGeneratorAgent:
    """
    Agent that generates realistic dummy data for all agents in the cement plant system
    """
    
    def __init__(self, project_id: str, enable_pubsub: bool = False):
        self.project_id = project_id
        self.enable_pubsub = enable_pubsub
        
        # Initialize Pub/Sub if enabled
        if self.enable_pubsub:
            self.publisher = pubsub_v1.PublisherClient()
            self.topics = {
                'kiln_data': f"projects/{project_id}/topics/kiln-sensor-data",
                'raw_material': f"projects/{project_id}/topics/raw-material-data",
                'quality_lab': f"projects/{project_id}/topics/quality-lab-data",
                'alternative_fuel': f"projects/{project_id}/topics/alternative-fuel-data",
                'utilities': f"projects/{project_id}/topics/utilities-data"
            }
        
        # Operating state variables
        self.current_conditions = {
            'kiln_state': 'normal',  # normal, startup, shutdown, maintenance
            'production_rate': 1.0,  # 0.0 to 1.2 (120% capacity)
            'fuel_quality': 'good',  # good, poor, mixed
            'weather_impact': 'none',  # none, high_humidity, cold, hot
            'maintenance_mode': False
        }
        
        # Base operating parameters
        self.base_params = {
            'flame_temperature': 1450,
            'material_temperature': 1200,
            'shell_temperature': 350,
            'o2_level': 3.0,
            'co_level': 50,
            'fuel_flow_rate': 45,
            'feed_rate': 120,
            'thermal_substitution_rate': 15.0
        }
        
        # Data generation patterns
        self.patterns = {
            'daily_cycle': True,
            'weekly_cycle': True,
            'seasonal_drift': True,
            'equipment_aging': True
        }

    async def start_data_generation(self, duration_hours: int = 24, interval_seconds: int = 30):
        """Start generating data for all agents"""
        logger.info(f"Starting data generation for {duration_hours} hours at {interval_seconds}s intervals")
        
        start_time = datetime.now()
        message_count = 0
        
        try:
            while (datetime.now() - start_time).total_seconds() < duration_hours * 3600:
                # Generate data for all agents
                timestamp = datetime.now().isoformat()
                
                # Apply time-based patterns
                self._update_operating_conditions(timestamp)
                
                # Generate data for each agent type
                kiln_data = self._generate_kiln_data(timestamp)
                raw_material_data = self._generate_raw_material_data(timestamp)
                quality_data = self._generate_quality_data(timestamp)
                fuel_data = self._generate_alternative_fuel_data(timestamp)
                utilities_data = self._generate_utilities_data(timestamp)
                
                # Publish or store data
                await self._publish_data({
                    'kiln_data': kiln_data,
                    'raw_material': raw_material_data,
                    'quality_lab': quality_data,
                    'alternative_fuel': fuel_data,
                    'utilities': utilities_data
                })
                
                message_count += 1
                if message_count % 100 == 0:
                    logger.info(f"Generated {message_count} data sets")
                
                await asyncio.sleep(interval_seconds)
                
        except KeyboardInterrupt:
            logger.info("Data generation stopped by user")
        
        logger.info(f"Data generation complete. Generated {message_count} data sets")

    def _update_operating_conditions(self, timestamp: str):
        """Update operating conditions based on time patterns"""
        current_time = datetime.fromisoformat(timestamp)
        
        # Daily cycle (production typically lower at night)
        if self.patterns['daily_cycle']:
            hour = current_time.hour
            if 22 <= hour or hour <= 6:  # Night shift
                self.current_conditions['production_rate'] = 0.85
            else:  # Day shift
                self.current_conditions['production_rate'] = 1.0
        
        # Weekly cycle (maintenance on weekends)
        if self.patterns['weekly_cycle']:
            if current_time.weekday() >= 5:  # Weekend
                if random.random() < 0.1:  # 10% chance of maintenance
                    self.current_conditions['maintenance_mode'] = True
                    self.current_conditions['production_rate'] = 0.3
        
        # Random process variations
        if random.random() < 0.05:  # 5% chance of condition change
            self.current_conditions['kiln_state'] = random.choice(['normal', 'startup', 'optimization'])
        
        if random.random() < 0.02:  # 2% chance of fuel quality change
            self.current_conditions['fuel_quality'] = random.choice(['good', 'poor', 'mixed'])

    def _generate_kiln_data(self, timestamp: str) -> KilnSensorData:
        """Generate realistic kiln sensor data"""
        
        # Base values adjusted for current conditions
        production_factor = self.current_conditions['production_rate']
        
        # Flame temperature
        flame_temp = self.base_params['flame_temperature']
        if self.current_conditions['kiln_state'] == 'startup':
            flame_temp -= random.uniform(50, 150)
        elif self.current_conditions['fuel_quality'] == 'poor':
            flame_temp -= random.uniform(20, 50)
        
        flame_temp += random.gauss(0, 15) * production_factor
        
        # Material temperature (correlated with flame temperature)
        material_temp = self.base_params['material_temperature'] + (flame_temp - self.base_params['flame_temperature']) * 0.6
        material_temp += random.gauss(0, 20)
        
        # Shell temperature
        shell_temp = self.base_params['shell_temperature'] + random.gauss(0, 10)
        
        # O2 level (inverse correlation with fuel rate)
        fuel_rate = self.base_params['fuel_flow_rate'] * production_factor
        fuel_rate += random.gauss(0, 3)
        
        o2_level = self.base_params['o2_level'] - (fuel_rate - self.base_params['fuel_flow_rate']) * 0.02
        o2_level += random.gauss(0, 0.3)
        o2_level = max(1.0, min(6.0, o2_level))
        
        # CO level (inverse correlation with O2)
        co_level = self.base_params['co_level'] + (self.base_params['o2_level'] - o2_level) * 20
        co_level += random.gauss(0, 15)
        co_level = max(10, min(500, co_level))
        
        # NOx level
        nox_level = 800 + (flame_temp - self.base_params['flame_temperature']) * 2
        nox_level += random.gauss(0, 50)
        
        # Feed rate
        feed_rate = self.base_params['feed_rate'] * production_factor
        feed_rate += random.gauss(0, 5)
        
        return KilnSensorData(
            timestamp=timestamp,
            flame_temperature=round(flame_temp, 1),
            material_temperature=round(material_temp, 1),
            shell_temperature=round(shell_temp, 1),
            draft_pressure=round(-50 + random.gauss(0, 3), 1),
            combustion_air_pressure=round(200 + random.gauss(0, 10), 1),
            o2_level=round(o2_level, 2),
            co_level=round(co_level, 0),
            nox_level=round(nox_level, 0),
            raw_meal_flow=round(feed_rate * 0.85, 1),
            fuel_flow_rate=round(fuel_rate, 1),
            kiln_rpm=round(2.5 + random.gauss(0, 0.1), 2),
            feed_rate=round(feed_rate, 1)
        )

    def _generate_raw_material_data(self, timestamp: str) -> RawMaterialData:
        """Generate raw material composition and flow data"""
        
        production_factor = self.current_conditions['production_rate']
        
        # Flow rates proportional to production
        limestone_flow = 95 * production_factor + random.gauss(0, 5)
        clay_flow = 15 * production_factor + random.gauss(0, 2)
        iron_ore_flow = 8 * production_factor + random.gauss(0, 1)
        gypsum_flow = 5 * production_factor + random.gauss(0, 0.5)
        
        # Chemical composition with realistic variations
        limestone_cao = 52.5 + random.gauss(0, 1.5)
        limestone_sio2 = 3.2 + random.gauss(0, 0.5)
        limestone_al2o3 = 0.8 + random.gauss(0, 0.2)
        limestone_fe2o3 = 0.4 + random.gauss(0, 0.1)
        
        # Moisture varies with weather
        base_moisture = 1.5
        if self.current_conditions['weather_impact'] == 'high_humidity':
            base_moisture += 2.0
        
        return RawMaterialData(
            timestamp=timestamp,
            limestone_flow=round(limestone_flow, 1),
            clay_flow=round(clay_flow, 1),
            iron_ore_flow=round(iron_ore_flow, 1),
            gypsum_flow=round(gypsum_flow, 1),
            limestone_cao=round(limestone_cao, 2),
            limestone_sio2=round(limestone_sio2, 2),
            limestone_al2o3=round(limestone_al2o3, 2),
            limestone_fe2o3=round(limestone_fe2o3, 2),
            moisture_content=round(base_moisture + random.gauss(0, 0.3), 2),
            fineness_blaine=round(320 + random.gauss(0, 20), 0)
        )

    def _generate_quality_data(self, timestamp: str) -> QualityLabData:
        """Generate quality lab test results (less frequent)"""
        
        # Quality influenced by process conditions
        flame_temp_deviation = random.gauss(0, 15)
        
        # Clinker phases
        c3s = 55.0 + flame_temp_deviation * 0.1 + random.gauss(0, 2)
        c2s = 20.0 - flame_temp_deviation * 0.05 + random.gauss(0, 1.5)
        c3a = 8.0 + random.gauss(0, 1)
        c4af = 10.0 + random.gauss(0, 1)
        
        # Free CaO (critical quality parameter)
        free_cao = 1.2
        if self.current_conditions['kiln_state'] == 'startup':
            free_cao += random.uniform(0.5, 2.0)
        elif flame_temp_deviation < -20:
            free_cao += random.uniform(0.3, 1.5)
        
        free_cao += random.gauss(0, 0.3)
        free_cao = max(0.1, min(4.0, free_cao))
        
        # Strength correlated with clinker phases
        strength_3d = 15 + (c3s - 55) * 0.5 - free_cao * 2 + random.gauss(0, 2)
        strength_28d = 45 + (c3s - 55) * 0.8 - free_cao * 3 + random.gauss(0, 3)
        
        return QualityLabData(
            timestamp=timestamp,
            sample_id=f"CLK_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            c3s_content=round(c3s, 1),
            c2s_content=round(c2s, 1),
            c3a_content=round(c3a, 1),
            c4af_content=round(c4af, 1),
            free_cao=round(free_cao, 2),
            compressive_strength_3d=round(max(10, strength_3d), 1),
            compressive_strength_28d=round(max(30, strength_28d), 1),
            setting_time_initial=round(120 + random.gauss(0, 15), 0),
            setting_time_final=round(180 + random.gauss(0, 20), 0)
        )

    def _generate_alternative_fuel_data(self, timestamp: str) -> AlternativeFuelData:
        """Generate alternative fuel usage data"""
        
        # Fuel type selection (weighted probabilities)
        fuel_types = ['RDF', 'Biomass', 'Tire_Derived_Fuel', 'Coal']
        weights = [0.4, 0.3, 0.2, 0.1]
        fuel_type = random.choices(fuel_types, weights=weights)[0]
        
        # Properties vary by fuel type
        if fuel_type == 'RDF':
            calorific_value = 18000 + random.gauss(0, 2000)
            moisture = 25 + random.gauss(0, 5)
            ash = 15 + random.gauss(0, 3)
        elif fuel_type == 'Biomass':
            calorific_value = 16000 + random.gauss(0, 1500)
            moisture = 35 + random.gauss(0, 8)
            ash = 5 + random.gauss(0, 2)
        elif fuel_type == 'Tire_Derived_Fuel':
            calorific_value = 32000 + random.gauss(0, 2000)
            moisture = 2 + random.gauss(0, 1)
            ash = 8 + random.gauss(0, 2)
        else:  # Coal
            calorific_value = 25000 + random.gauss(0, 2000)
            moisture = 10 + random.gauss(0, 3)
            ash = 12 + random.gauss(0, 3)
        
        # Feed rate based on thermal substitution target
        base_tsr = self.base_params['thermal_substitution_rate']
        current_tsr = base_tsr + random.gauss(0, 3)
        current_tsr = max(0, min(40, current_tsr))
        
        feed_rate = (current_tsr / 100) * self.current_conditions['production_rate'] * 10
        
        return AlternativeFuelData(
            timestamp=timestamp,
            fuel_type=fuel_type,
            calorific_value=round(calorific_value, 0),
            moisture_content=round(max(0, moisture), 1),
            ash_content=round(max(0, ash), 1),
            sulfur_content=round(random.uniform(0.1, 2.0), 2),
            chlorine_content=round(random.uniform(0.01, 0.5), 3),
            feed_rate=round(max(0, feed_rate), 2),
            thermal_substitution_rate=round(current_tsr, 1)
        )

    def _generate_utilities_data(self, timestamp: str) -> UtilitiesData:
        """Generate plant utilities consumption data"""
        
        production_factor = self.current_conditions['production_rate']
        
        # Power consumption scales with production
        electrical_power = 850 * production_factor + random.gauss(0, 50)
        
        # Compressed air
        compressed_air = 120 * production_factor + random.gauss(0, 10)
        
        # Cooling water
        cooling_water = 200 * production_factor + random.gauss(0, 15)
        
        # Fuel consumption
        fuel_consumption = 45 * production_factor + random.gauss(0, 3)
        
        # Emissions correlated with fuel consumption
        co2_emissions = fuel_consumption * 2.3 + random.gauss(0, 0.2)
        dust_emissions = 15 + random.gauss(0, 3)
        nox_emissions = 350 + random.gauss(0, 30)
        
        return UtilitiesData(
            timestamp=timestamp,
            electrical_power=round(electrical_power, 1),
            compressed_air_flow=round(compressed_air, 1),
            cooling_water_flow=round(cooling_water, 1),
            fuel_consumption=round(fuel_consumption, 2),
            co2_emissions=round(co2_emissions, 2),
            dust_emissions=round(max(5, dust_emissions), 1),
            nox_emissions=round(max(200, nox_emissions), 0)
        )

    async def _publish_data(self, data_dict: Dict):
        """Publish or store generated data"""
        
        if self.enable_pubsub:
            # Publish to Pub/Sub topics
            for data_type, data_obj in data_dict.items():
                if data_type in self.topics:
                    try:
                        message_data = json.dumps(asdict(data_obj)).encode('utf-8')
                        future = self.publisher.publish(self.topics[data_type], message_data)
                        future.result()  # Wait for publish to complete
                    except Exception as e:
                        logger.error(f"Error publishing {data_type}: {e}")
        else:
            # Log data locally
            for data_type, data_obj in data_dict.items():
                logger.info(f"{data_type.upper()}: {json.dumps(asdict(data_obj), indent=2)}")

    def trigger_scenario(self, scenario: str, duration_minutes: int = 30):
        """Trigger specific operational scenarios"""
        
        if scenario == 'startup':
            self.current_conditions['kiln_state'] = 'startup'
            self.current_conditions['production_rate'] = 0.4
        elif scenario == 'high_free_cao':
            self.current_conditions['fuel_quality'] = 'poor'
            self.base_params['flame_temperature'] = 1380
        elif scenario == 'maintenance':
            self.current_conditions['maintenance_mode'] = True
            self.current_conditions['production_rate'] = 0.1
        elif scenario == 'high_efficiency':
            self.current_conditions['fuel_quality'] = 'good'
            self.base_params['thermal_substitution_rate'] = 25.0
        elif scenario == 'weather_impact':
            self.current_conditions['weather_impact'] = 'high_humidity'
        
        logger.info(f"Triggered scenario: {scenario} for {duration_minutes} minutes")
        
        # Auto-reset after duration
        def reset_scenario():
            time.sleep(duration_minutes * 60)
            self.current_conditions = {
                'kiln_state': 'normal',
                'production_rate': 1.0,
                'fuel_quality': 'good',
                'weather_impact': 'none',
                'maintenance_mode': False
            }
            self.base_params['flame_temperature'] = 1450
            self.base_params['thermal_substitution_rate'] = 15.0
            logger.info(f"Reset scenario: {scenario}")
        
        import threading
        threading.Thread(target=reset_scenario, daemon=True).start()

    def get_current_conditions(self) -> Dict:
        """Get current operating conditions"""
        return {
            'conditions': self.current_conditions.copy(),
            'base_params': self.base_params.copy(),
            'patterns': self.patterns.copy()
        }

# Interactive data generation
async def interactive_data_generation():
    """Interactive interface for data generation"""
    
    print("Cement Plant Data Generator")
    print("=" * 40)
    print("Commands:")
    print("  start <hours>     - Start data generation")
    print("  scenario <name>   - Trigger scenario")
    print("  status           - Show current conditions")
    print("  stop             - Stop generation")
    print("  quit             - Exit")
    print()
    
    generator = DataGeneratorAgent(project_id="test-project", enable_pubsub=False)
    generation_task = None
    
    while True:
        command = input("> ").strip().lower()
        
        if command.startswith("start"):
            parts = command.split()
            hours = int(parts[1]) if len(parts) > 1 else 1
            
            if generation_task is None:
                generation_task = asyncio.create_task(
                    generator.start_data_generation(duration_hours=hours, interval_seconds=5)
                )
                print(f"Started data generation for {hours} hours")
            else:
                print("Data generation already running")
        
        elif command.startswith("scenario"):
            parts = command.split()
            if len(parts) > 1:
                scenario_name = parts[1]
                generator.trigger_scenario(scenario_name)
                print(f"Triggered scenario: {scenario_name}")
            else:
                print("Available scenarios: startup, high_free_cao, maintenance, high_efficiency, weather_impact")
        
        elif command == "status":
            conditions = generator.get_current_conditions()
            print("Current Conditions:")
            for key, value in conditions['conditions'].items():
                print(f"  {key}: {value}")
            print("Base Parameters:")
            for key, value in conditions['base_params'].items():
                print(f"  {key}: {value}")
        
        elif command == "stop":
            if generation_task:
                generation_task.cancel()
                generation_task = None
                print("Data generation stopped")
            else:
                print("No data generation running")
        
        elif command == "quit":
            if generation_task:
                generation_task.cancel()
            print("Exiting...")
            break
        
        else:
            print("Unknown command")

# Agent Integration with Orchestrator
async def register_with_orchestrator(orchestrator_endpoint: str) -> bool:
    """Register data generator agent with orchestrator"""
    try:
        registration_payload = {
            'agent_id': 'data_generator_agent',
            'agent_type': 'data_generator',
            'capabilities': [
                'kiln_sensor_data',
                'raw_material_data', 
                'quality_lab_data',
                'alternative_fuel_data',
                'utilities_data'
            ],
            'status': 'active',
            'timestamp': datetime.now().isoformat()
        }
        
        response = requests.post(
            f"{orchestrator_endpoint}/register",
            json=registration_payload,
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info("Successfully registered with orchestrator")
            return True
        else:
            logger.error(f"Failed to register with orchestrator: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"Error registering with orchestrator: {e}")
        return False

async def main():
    """Main function - Run as part of multi-agent system"""
    import os
    
    # Load configuration
    PROJECT_ID = os.getenv('GCP_PROJECT_ID', 'ageless-fire-466212-i2')
    ORCHESTRATOR_ENDPOINT = os.getenv('ORCHESTRATOR_ENDPOINT', 'http://localhost:8080')
    
    # Initialize agent
    generator = DataGeneratorAgent(project_id=PROJECT_ID, enable_pubsub=True)
    
    # Register with orchestrator
    registered = await register_with_orchestrator(ORCHESTRATOR_ENDPOINT)
    
    if registered:
        logger.info("Data Generator Agent starting as part of multi-agent system")
        # Start continuous data generation
        await generator.start_data_generation(duration_hours=24, interval_seconds=30)
    else:
        logger.error("Failed to register with orchestrator, exiting")

if __name__ == "__main__":
    asyncio.run(main())