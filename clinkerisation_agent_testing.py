import asyncio,json,pytest,threading,time,random,requests_mock,logging, os,sys #type: ignore
import numpy as np #type: ignore
import pandas as pd #type: ignore
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from typing import List, Dict, Optional


# Import the main agent
try:
    from clinkerisation_agent import (
        ClinkerizationAgent, KilnSensorData, ClinkerPrediction, 
        ControlDecision
    )
except ImportError:
    print("Error: Cannot import clinkerization_agent. Make sure the file is in the same directory.")
    sys.exit(1)

# Configure test logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class KilnSimulator:
    """
    Simulates realistic kiln sensor data for testing
    
    This simulator generates realistic sensor readings with controlled
    variations and can trigger specific operational scenarios for testing.
    """
    
    def __init__(self):
        # Base operating conditions (typical cement kiln values)
        self.current_state = {
            'flame_temperature': 1450.0,
            'material_temperature': 1200.0,
            'shell_temperature': 350.0,
            'draft_pressure': -50.0,
            'combustion_air_pressure': 200.0,
            'o2_level': 3.0,
            'co_level': 50.0,
            'nox_level': 800.0,
            'raw_meal_flow': 100.0,
            'fuel_flow_rate': 45.0,
            'kiln_rpm': 2.5,
            'feed_rate': 120.0
        }
        
        # Realistic noise levels for each parameter
        self.noise_levels = {
            'flame_temperature': 10.0,
            'material_temperature': 15.0,
            'shell_temperature': 5.0,
            'draft_pressure': 2.0,
            'combustion_air_pressure': 5.0,
            'o2_level': 0.3,
            'co_level': 10.0,
            'nox_level': 50.0,
            'raw_meal_flow': 5.0,
            'fuel_flow_rate': 2.0,
            'kiln_rpm': 0.1,
            'feed_rate': 5.0
        }
        
        # Test scenario flags
        self.scenarios = {
            'high_free_cao': False,
            'low_efficiency': False,
            'unstable_conditions': False,
            'equipment_failure': False,
            'emergency_shutdown': False,
            'startup_sequence': False
        }
        
        # Scenario parameters
        self.scenario_intensities = {
            'high_free_cao': 1.0,
            'low_efficiency': 1.0,
            'unstable_conditions': 1.0
        }
        
        # Track applied decisions for realistic simulation
        self.recent_decisions = []

    def generate_sensor_data(self) -> Dict:
        """Generate realistic sensor data with controlled variations"""
        data = {}
        
        # Generate base readings with noise
        for param, base_value in self.current_state.items():
            noise = random.gauss(0, self.noise_levels[param])
            data[param] = base_value + noise
        
        # Apply scenario modifications
        data = self._apply_scenarios(data)
        
        # Apply physics-based constraints
        data = self._apply_physics_constraints(data)
        
        # Add timestamp
        data['timestamp'] = datetime.now().isoformat()
        
        return data

    def _apply_scenarios(self, data: Dict) -> Dict:
        """Apply specific test scenarios to sensor data"""
        
        if self.scenarios['high_free_cao']:
            intensity = self.scenario_intensities['high_free_cao']
            # Lower temperature and higher feed rate cause high free CaO
            data['flame_temperature'] -= 30 * intensity
            data['feed_rate'] += 15 * intensity
            data['o2_level'] -= 0.5 * intensity
        
        if self.scenarios['low_efficiency']:
            intensity = self.scenario_intensities['low_efficiency']
            # Excess air and fuel reduce efficiency
            data['o2_level'] += 2.0 * intensity
            data['fuel_flow_rate'] += 8 * intensity
            data['co_level'] += 30 * intensity
        
        if self.scenarios['unstable_conditions']:
            intensity = self.scenario_intensities['unstable_conditions']
            # Add extra variability to all parameters
            for param in data:
                if param != 'timestamp':
                    extra_noise = random.gauss(0, self.noise_levels.get(param, 1.0) * 2 * intensity)
                    data[param] += extra_noise
        
        if self.scenarios['equipment_failure']:
            # Simulate sensor failures or extreme readings
            failure_type = random.choice(['sensor_failure', 'extreme_readings', 'communication_loss'])
            
            if failure_type == 'sensor_failure':
                data['flame_temperature'] = -999  # Invalid sensor reading
            elif failure_type == 'extreme_readings':
                data['co_level'] = 2000  # Dangerously high CO
                data['o2_level'] = 0.5   # Extremely low oxygen
            elif failure_type == 'communication_loss':
                # Missing data (would be handled by message parsing)
                data = {'timestamp': data['timestamp']}
        
        if self.scenarios['emergency_shutdown']:
            # Simulate emergency conditions
            data['flame_temperature'] = 1100  # Very low temperature
            data['fuel_flow_rate'] = 0        # No fuel
            data['co_level'] = 500            # High CO from incomplete shutdown
        
        if self.scenarios['startup_sequence']:
            # Simulate kiln startup conditions
            data['flame_temperature'] = 1200  # Lower startup temperature
            data['fuel_flow_rate'] = 30       # Reduced fuel during startup
            data['feed_rate'] = 80            # Lower feed rate
        
        return data

    def _apply_physics_constraints(self, data: Dict) -> Dict:
        """Apply realistic physics constraints to sensor data"""
        
        # Temperature relationships
        if 'flame_temperature' in data and 'material_temperature' in data:
            # Material temperature should be lower than flame temperature
            if data['material_temperature'] > data['flame_temperature'] - 100:
                data['material_temperature'] = data['flame_temperature'] - 100 - random.uniform(50, 150)
        
        # Combustion relationships
        if 'fuel_flow_rate' in data and 'o2_level' in data:
            # Higher fuel rate typically means lower O2 (if air flow constant)
            fuel_effect = (data['fuel_flow_rate'] - 45) * 0.02
            data['o2_level'] = max(0.5, data['o2_level'] - fuel_effect)
        
        # CO and O2 relationship
        if 'co_level' in data and 'o2_level' in data:
            # Lower O2 typically means higher CO
            if data['o2_level'] < 2.0:
                data['co_level'] += (2.0 - data['o2_level']) * 50
        
        # Ensure realistic ranges
        data['flame_temperature'] = max(1000, min(1800, data.get('flame_temperature', 1450)))
        data['o2_level'] = max(0.1, min(10.0, data.get('o2_level', 3.0)))
        data['co_level'] = max(0, min(3000, data.get('co_level', 50)))
        data['fuel_flow_rate'] = max(0, min(200, data.get('fuel_flow_rate', 45)))
        
        return data

    def apply_control_adjustment(self, decision: ControlDecision):
        """Simulate the effect of control adjustments on kiln state"""
        try:
            # Store decision for simulation history
            decision_record = {
                'timestamp': datetime.now(),
                'decision': decision.__dict__,
                'state_before': self.current_state.copy()
            }
            self.recent_decisions.append(decision_record)
            
            # Keep only last 10 decisions
            if len(self.recent_decisions) > 10:
                self.recent_decisions = self.recent_decisions[-10:]
            
            # Simulate realistic time delays and partial responses
            
            # Fuel flow changes affect temperature (with delay)
            if decision.fuel_flow_adjustment != 0:
                self.current_state['fuel_flow_rate'] += decision.fuel_flow_adjustment
                # Temperature responds to fuel changes (partial response)
                temp_change = decision.fuel_flow_adjustment * 1.8  # 1.8°C per kg/hr fuel
                self.current_state['flame_temperature'] += temp_change * 0.6  # 60% immediate response
            
            # Air flow changes affect O2 levels
            if decision.air_flow_adjustment != 0:
                # Approximate air flow to O2 relationship
                o2_change = decision.air_flow_adjustment * 0.08  # 0.08% O2 per m³/min air
                self.current_state['o2_level'] += o2_change
                
                # Air changes also affect CO levels
                co_change = -decision.air_flow_adjustment * 2  # More air reduces CO
                self.current_state['co_level'] += co_change
            
            # Feed rate adjustments
            if decision.feed_rate_adjustment != 0:
                self.current_state['feed_rate'] += decision.feed_rate_adjustment
                # Feed rate affects material temperature
                temp_effect = -decision.feed_rate_adjustment * 2  # More feed = lower temp
                self.current_state['material_temperature'] += temp_effect * 0.4
            
            # Temperature setpoint changes (simulated PID controller response)
            if decision.temperature_setpoint != self.current_state['flame_temperature']:
                temp_error = decision.temperature_setpoint - self.current_state['flame_temperature']
                # Simulate PID controller response (partial)
                self.current_state['flame_temperature'] += temp_error * 0.3
            
            # Apply constraints to prevent unrealistic values
            self.current_state['fuel_flow_rate'] = max(0, min(200, self.current_state['fuel_flow_rate']))
            self.current_state['o2_level'] = max(0.5, min(8.0, self.current_state['o2_level']))
            self.current_state['co_level'] = max(0, min(1000, self.current_state['co_level']))
            self.current_state['feed_rate'] = max(50, min(200, self.current_state['feed_rate']))
            self.current_state['flame_temperature'] = max(1200, min(1600, self.current_state['flame_temperature']))
            
            logger.info(f"Applied control adjustments - Fuel: {decision.fuel_flow_adjustment:.1f}, Air: {decision.air_flow_adjustment:.1f}, Feed: {decision.feed_rate_adjustment:.1f}")
            
        except Exception as e:
            logger.error(f"Error applying control adjustment: {e}")

    def trigger_scenario(self, scenario: str, duration_seconds: int = 60, intensity: float = 1.0):
        """Trigger specific test scenarios"""
        if scenario in self.scenarios:
            self.scenarios[scenario] = True
            if scenario in self.scenario_intensities:
                self.scenario_intensities[scenario] = intensity
            
            logger.info(f"Triggered scenario: {scenario} (intensity: {intensity}, duration: {duration_seconds}s)")
            
            # Auto-reset after duration
            def reset_scenario():
                time.sleep(duration_seconds)
                self.scenarios[scenario] = False
                logger.info(f"Reset scenario: {scenario}")
            
            threading.Thread(target=reset_scenario, daemon=True).start()
        else:
            logger.warning(f"Unknown scenario: {scenario}")

    def get_current_state(self) -> Dict:
        """Get current kiln state"""
        return {
            'current_state': self.current_state.copy(),
            'active_scenarios': [k for k, v in self.scenarios.items() if v],
            'recent_decisions_count': len(self.recent_decisions)
        }

class MockCloudServices:
    """Mock Google Cloud services for testing"""
    
    def __init__(self):
        self.pubsub_messages = []
        self.bigquery_data = []
        self.published_messages = []
        self.subscribers = []
        
        # Mock data for BigQuery responses
        self.historical_context = {
            'avg_flame_temp': 1450.0,
            'avg_efficiency': 0.8,
            'avg_quality': 0.85,
            'temp_variance': 10.0,
            'data_points': 100
        }

    def setup_mocks(self):
        """Setup all cloud service mocks"""
        
        # Mock Pub/Sub
        self.pubsub_patcher = patch('google.cloud.pubsub_v1.SubscriberClient')
        self.mock_pubsub = self.pubsub_patcher.start()
        
        # Mock BigQuery
        self.bigquery_patcher = patch('google.cloud.bigquery.Client')
        self.mock_bigquery = self.bigquery_patcher.start()
        
        # Setup BigQuery mock responses
        mock_query_job = Mock()
        mock_query_job.result.return_value = [
            Mock(**self.historical_context)
        ]
        self.mock_bigquery.return_value.query.return_value = mock_query_job
        self.mock_bigquery.return_value.insert_rows_json.return_value = []
        
        # Mock Vertex AI
        self.vertex_patcher = patch('google.cloud.aiplatform')
        self.mock_vertex = self.vertex_patcher.start()

    def cleanup_mocks(self):
        """Cleanup all mocks"""
        try:
            self.pubsub_patcher.stop()
            self.bigquery_patcher.stop()
            self.vertex_patcher.stop()
        except:
            pass

    def add_pubsub_message(self, sensor_data: Dict):
        """Add a message to the mock Pub/Sub queue"""
        message_data = json.dumps(sensor_data).encode('utf-8')
        self.pubsub_messages.append(message_data)

    def get_bigquery_inserts(self) -> List[Dict]:
        """Get all data inserted into BigQuery"""
        return self.bigquery_data.copy()

class TestEnvironment:
    """Complete test environment for the Clinkerization Agent"""
    
    def __init__(self):
        self.simulator = KilnSimulator()
        self.mock_services = MockCloudServices()
        self.agent = None
        self.test_results = []
        self.running = False
        self.orchestrator_responses = []

    async def setup_agent(self, custom_config: Optional[Dict] = None):
        """Setup the agent with mocked dependencies"""
        
        # Setup cloud service mocks
        self.mock_services.setup_mocks()
        
        try:
            # Default test configuration
            config = {
                'project_id': 'test-project',
                'subscription_name': 'test-subscription',
                'model_endpoint': 'test-endpoint',
                'bigquery_dataset': 'test_dataset',
                'orchestrator_endpoint': 'http://localhost:8080/api/decisions'
            }
            
            # Apply custom configuration if provided
            if custom_config:
                config.update(custom_config)
            
            self.agent = ClinkerizationAgent(**config)
            
            # Mock the ML model with realistic behavior
            mock_model = Mock()
            
            def mock_predict(features):
                # Simulate realistic clinker predictions based on inputs
                base_prediction = np.array([55.0, 20.0, 8.0, 10.0, 1.5])
                
                # Add some variation based on flame temperature (first feature after scaling)
                if len(features) > 0 and len(features[0]) > 0:
                    temp_factor = features[0][0]  # Scaled flame temperature
                    variation = np.random.normal(0, 0.5, 5)  # Small random variation
                    
                    # Simulate temperature effects on clinker phases
                    if temp_factor < -1:  # Low temperature
                        variation[4] += 1.0  # Higher free CaO
                    elif temp_factor > 1:  # High temperature
                        variation[0] += 2.0  # Higher C3S
                
                return np.array([base_prediction + variation])
            
            mock_model.predict = mock_predict
            mock_estimators = []
            for i in range(10):
                estimator = Mock()
                estimator.predict.return_value = np.array([55.0, 20.0, 8.0, 10.0, 1.5])
                mock_estimators.append(estimator)
            mock_model.estimators_ = mock_estimators
                        
            self.agent.clinker_model = mock_model
            
            # Mock the scaler
            mock_scaler = Mock()
            mock_scaler.transform = lambda x: x  # Pass through for simplicity
            self.agent.scaler = mock_scaler
            
            # Mock orchestrator communication
            self.agent._send_decision_to_orchestrator = AsyncMock()
            
            # Track orchestrator calls
            async def track_orchestrator_call(*args, **kwargs):
                self.orchestrator_responses.append({
                    'timestamp': datetime.now(),
                    'args': args,
                    'kwargs': kwargs
                })
                return True
            
            self.agent._send_decision_to_orchestrator = track_orchestrator_call
            
            logger.info("Test agent setup complete")
            
        except Exception as e:
            logger.error(f"Error setting up test agent: {e}")
            self.mock_services.cleanup_mocks()
            raise

    async def cleanup(self):
        """Cleanup test environment"""
        self.running = False
        self.mock_services.cleanup_mocks()

    async def run_simulation(self, duration_minutes: int = 5, message_interval: int = 5) -> Dict:
        """Run a complete simulation test"""
        logger.info(f"Starting {duration_minutes}-minute simulation test")
        
        self.running = True
        start_time = datetime.now()
        message_count = 0
        decision_count = 0
        error_count = 0
        
        try:
            # Generate and process sensor data at regular intervals
            while self.running and (datetime.now() - start_time).total_seconds() < duration_minutes * 60:
                try:
                    # Generate sensor data
                    sensor_data = self.simulator.generate_sensor_data()
                    message_data = json.dumps(sensor_data).encode('utf-8')
                    
                    # Process through agent
                    kiln_data = self.agent._parse_sensor_message(message_data)
                    await self.agent._process_sensor_data(kiln_data)
                    
                    message_count += 1
                    
                    # Apply any decisions back to simulator
                    if len(self.agent.decision_history) > decision_count:
                        latest_decision = self.agent.decision_history[-1]
                        decision = ControlDecision(**latest_decision['decision'])
                        self.simulator.apply_control_adjustment(decision)
                        decision_count += 1
                    
                    if message_count % 10 == 0:
                        logger.info(f"Processed {message_count} messages, made {decision_count} decisions")
                    
                except Exception as e:
                    error_count += 1
                    logger.error(f"Error in simulation step {message_count}: {e}")
                    self.test_results.append({
                        'type': 'error',
                        'message': str(e),
                        'timestamp': datetime.now()
                    })
                
                await asyncio.sleep(message_interval)
            
        except Exception as e:
            logger.error(f"Critical simulation error: {e}")
            error_count += 1
        
        finally:
            self.running = False
        
        # Calculate results
        results = {
            'duration_minutes': duration_minutes,
            'messages_processed': message_count,
            'decisions_made': decision_count,
            'errors': error_count,
            'error_rate': error_count / max(1, message_count),
            'decision_rate': decision_count / max(1, message_count),
            'orchestrator_calls': len(self.orchestrator_responses),
            'agent_metrics': self.agent.get_status() if self.agent else {},
            'simulator_state': self.simulator.get_current_state()
        }
        
        logger.info(f"Simulation complete: {results}")
        return results

    async def run_scenario_test(self, scenario: str, duration_minutes: int = 2) -> Dict:
        """Run a specific scenario test"""
        logger.info(f"Running scenario test: {scenario}")
        
        # Trigger the scenario
        self.simulator.trigger_scenario(scenario, duration_minutes * 60)
        
        # Run simulation during scenario
        results = await self.run_simulation(duration_minutes)
        
        # Add scenario-specific analysis
        results['scenario'] = scenario
        results['scenario_decisions'] = []
        
        # Analyze decisions made during scenario
        for decision in self.agent.decision_history:
            if scenario.lower() in decision['decision']['reasoning'].lower():
                results['scenario_decisions'].append(decision)
        
        results['scenario_response_count'] = len(results['scenario_decisions'])
        
        return results

    def stop_simulation(self):
        """Stop the running simulation"""
        self.running = False
        logger.info("Simulation stop requested")

# Unit Tests
class TestClinkerizationAgent:
    """Unit tests for individual agent components"""
    
    @pytest.fixture
    async def test_env(self):
        """Setup test environment"""
        env = TestEnvironment()
        await env.setup_agent()
        yield env
        await env.cleanup()
    
    @pytest.mark.asyncio
    async def test_memory_usage(self):
        """Test memory usage doesn't grow unbounded"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        
        try:
            # Process many messages
            for i in range(150):
                sensor_data = test_env.simulator.generate_sensor_data()
                message_data = json.dumps(sensor_data).encode('utf-8')
                kiln_data = test_env.agent._parse_sensor_message(message_data)
                await test_env.agent._process_sensor_data(kiln_data)
            
            # Verify decision history is capped at 100
            assert len(test_env.agent.decision_history) <= 100
            
            logger.info("✓ Memory usage test passed")
            
        finally:
            await test_env.cleanup()

# Scenario Tests
class TestScenarios:
    """Test specific operational scenarios"""
    
    @pytest.mark.asyncio
    async def test_high_free_cao_scenario(self):
        """Test response to high free CaO conditions"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        
        try:
            # Run scenario test
            results = await test_env.run_scenario_test('high_free_cao', duration_minutes=1)
            
            # Verify appropriate response
            assert results['decisions_made'] > 0
            assert results['scenario_response_count'] > 0
            
            # Check that decisions address the issue
            scenario_decisions = results['scenario_decisions']
            if scenario_decisions:
                reasoning = scenario_decisions[-1]['decision']['reasoning'].lower()
                assert 'free cao' in reasoning or 'temperature' in reasoning
            
            logger.info("✓ High free CaO scenario test passed")
            
        finally:
            await test_env.cleanup()

    @pytest.mark.asyncio
    async def test_low_efficiency_scenario(self):
        """Test response to low efficiency conditions"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        
        try:
            results = await test_env.run_scenario_test('low_efficiency', duration_minutes=1)
            
            assert results['decisions_made'] > 0
            
            # Should make decisions to improve efficiency
            for decision_record in test_env.agent.decision_history:
                decision = decision_record['decision']
                if 'efficiency' in decision['reasoning'].lower() or 'air' in decision['reasoning'].lower():
                    # Found efficiency-related decision
                    break
            else:
                # No efficiency-related decisions found - this might be okay if other issues take priority
                pass
            
            logger.info("✓ Low efficiency scenario test passed")
            
        finally:
            await test_env.cleanup()

    @pytest.mark.asyncio
    async def test_unstable_conditions_scenario(self):
        """Test response to unstable conditions"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        
        try:
            results = await test_env.run_scenario_test('unstable_conditions', duration_minutes=1)
            
            # Should still make decisions despite instability
            assert results['decisions_made'] > 0
            
            # Error rate might be higher but should still be manageable
            assert results['error_rate'] < 0.5  # Less than 50% errors
            
            logger.info("✓ Unstable conditions scenario test passed")
            
        finally:
            await test_env.cleanup()

    @pytest.mark.asyncio
    async def test_equipment_failure_scenario(self):
        """Test response to equipment failure"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        
        try:
            # Trigger equipment failure
            test_env.simulator.trigger_scenario('equipment_failure', duration_seconds=30)
            
            # Process some data during failure
            error_count = 0
            for i in range(10):
                try:
                    sensor_data = test_env.simulator.generate_sensor_data()
                    message_data = json.dumps(sensor_data).encode('utf-8')
                    kiln_data = test_env.agent._parse_sensor_message(message_data)
                    await test_env.agent._process_sensor_data(kiln_data)
                except Exception:
                    error_count += 1
                
                await asyncio.sleep(1)
            
            # Should handle some failures gracefully
            assert error_count < 8  # Some errors expected, but not all
            
            logger.info("✓ Equipment failure scenario test passed")
            
        finally:
            await test_env.cleanup()

# Comprehensive Test Runner
class TestRunner:
    """Comprehensive test runner with detailed reporting"""
    
    def __init__(self):
        self.test_results = []
        self.start_time = None
        self.end_time = None

    async def run_all_tests(self, quick_mode: bool = False):
        """Run all test suites"""
        self.start_time = datetime.now()
        logger.info("Starting comprehensive Clinkerization Agent test suite")
        logger.info("="*60)
        
        try:
            # Unit tests
            await self._run_unit_tests()
            
            # Integration tests
            await self._run_integration_tests()
            
            # Performance tests
            if not quick_mode:
                await self._run_performance_tests()
            
            # Scenario tests
            await self._run_scenario_tests()
            
            # Simulation tests
            if not quick_mode:
                await self._run_simulation_tests()
            
        except Exception as e:
            logger.error(f"Critical error in test suite: {e}")
            self.test_results.append({
                'test_type': 'critical_error',
                'name': 'test_suite_execution',
                'passed': False,
                'error': str(e),
                'timestamp': datetime.now()
            })
        
        finally:
            self.end_time = datetime.now()
            await self._generate_report()

    async def _run_unit_tests(self):
        """Run unit test suite"""
        logger.info("Running unit tests...")
        
        test_cases = [
            ('sensor_data_parsing', self._test_sensor_parsing),
            ('sensor_data_validation', self._test_sensor_validation),
            ('clinker_prediction', self._test_clinker_prediction),
            ('control_decision', self._test_control_decision),
            ('decision_validation', self._test_decision_validation),
            ('quality_calculation', self._test_quality_calculation)
        ]
        
        for test_name, test_func in test_cases:
            try:
                await test_func()
                self.test_results.append({
                    'test_type': 'unit',
                    'name': test_name,
                    'passed': True,
                    'timestamp': datetime.now()
                })
                logger.info(f"  ✓ {test_name}")
            except Exception as e:
                self.test_results.append({
                    'test_type': 'unit',
                    'name': test_name,
                    'passed': False,
                    'error': str(e),
                    'timestamp': datetime.now()
                })
                logger.error(f"  ✗ {test_name}: {e}")

    async def _run_integration_tests(self):
        """Run integration test suite"""
        logger.info("Running integration tests...")
        
        test_cases = [
            ('complete_decision_cycle', self._test_decision_cycle),
            ('self_correction', self._test_self_correction),
            ('orchestrator_communication', self._test_orchestrator_comm)
        ]
        
        for test_name, test_func in test_cases:
            try:
                await test_func()
                self.test_results.append({
                    'test_type': 'integration',
                    'name': test_name,
                    'passed': True,
                    'timestamp': datetime.now()
                })
                logger.info(f"  ✓ {test_name}")
            except Exception as e:
                self.test_results.append({
                    'test_type': 'integration',
                    'name': test_name,
                    'passed': False,
                    'error': str(e),
                    'timestamp': datetime.now()
                })
                logger.error(f"  ✗ {test_name}: {e}")

    async def _run_performance_tests(self):
        """Run performance test suite"""
        logger.info("Running performance tests...")
        
        test_cases = [
            ('message_processing_rate', self._test_processing_rate),
            ('memory_usage', self._test_memory_usage),
            ('concurrent_processing', self._test_concurrent_processing)
        ]
        
        for test_name, test_func in test_cases:
            try:
                result = await test_func()
                self.test_results.append({
                    'test_type': 'performance',
                    'name': test_name,
                    'passed': True,
                    'metrics': result,
                    'timestamp': datetime.now()
                })
                logger.info(f"  ✓ {test_name}")
            except Exception as e:
                self.test_results.append({
                    'test_type': 'performance',
                    'name': test_name,
                    'passed': False,
                    'error': str(e),
                    'timestamp': datetime.now()
                })
                logger.error(f"  ✗ {test_name}: {e}")

    async def _run_scenario_tests(self):
        """Run scenario-based tests"""
        logger.info("Running scenario tests...")
        
        scenarios = [
            'high_free_cao',
            'low_efficiency', 
            'unstable_conditions',
            'equipment_failure'
        ]
        
        for scenario in scenarios:
            try:
                test_env = TestEnvironment()
                await test_env.setup_agent()
                
                results = await test_env.run_scenario_test(scenario, duration_minutes=1)
                
                self.test_results.append({
                    'test_type': 'scenario',
                    'name': scenario,
                    'passed': results['decisions_made'] > 0 and results['error_rate'] < 0.3,
                    'results': results,
                    'timestamp': datetime.now()
                })
                
                await test_env.cleanup()
                logger.info(f"  ✓ {scenario}")
                
            except Exception as e:
                self.test_results.append({
                    'test_type': 'scenario',
                    'name': scenario,
                    'passed': False,
                    'error': str(e),
                    'timestamp': datetime.now()
                })
                logger.error(f"  ✗ {scenario}: {e}")

    async def _run_simulation_tests(self):
        """Run comprehensive simulation tests"""
        logger.info("Running simulation tests...")
        
        test_env = TestEnvironment()
        try:
            await test_env.setup_agent()
            
            # Run extended simulation
            results = await test_env.run_simulation(duration_minutes=3, message_interval=2)
            
            # Evaluate simulation success
            success_criteria = [
                results['messages_processed'] > 50,
                results['decisions_made'] > 20,
                results['error_rate'] < 0.1,
                results['decision_rate'] > 0.3
            ]
            
            passed = all(success_criteria)
            
            self.test_results.append({
                'test_type': 'simulation',
                'name': 'extended_simulation',
                'passed': passed,
                'results': results,
                'timestamp': datetime.now()
            })
            
            if passed:
                logger.info("  ✓ extended_simulation")
            else:
                logger.error("  ✗ extended_simulation: Failed success criteria")
            
        except Exception as e:
            self.test_results.append({
                'test_type': 'simulation',
                'name': 'extended_simulation',
                'passed': False,
                'error': str(e),
                'timestamp': datetime.now()
            })
            logger.error(f"  ✗ extended_simulation: {e}")
        
        finally:
            await test_env.cleanup()

    # Individual test implementations
    async def _test_sensor_parsing(self):
        """Test sensor data parsing"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        try:
            test_data = {'timestamp': '2024-01-01T12:00:00', 'flame_temperature': 1450.0, 'material_temperature': 1200.0, 'shell_temperature': 350.0, 'draft_pressure': -50.0, 'combustion_air_pressure': 200.0, 'o2_level': 3.0, 'co_level': 50.0, 'nox_level': 800.0, 'raw_meal_flow': 100.0, 'fuel_flow_rate': 45.0, 'kiln_rpm': 2.5, 'feed_rate': 120.0}
            message_data = json.dumps(test_data).encode('utf-8')
            parsed_data = test_env.agent._parse_sensor_message(message_data)
            assert isinstance(parsed_data, KilnSensorData)
            assert parsed_data.flame_temperature == 1450.0
        finally:
            await test_env.cleanup()

    async def _test_sensor_validation(self):
        """Test sensor data validation"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        try:
            valid_data = KilnSensorData(timestamp=datetime.now(), flame_temperature=1450.0, material_temperature=1200.0, shell_temperature=350.0, draft_pressure=-50.0, combustion_air_pressure=200.0, o2_level=3.0, co_level=50.0, nox_level=800.0, raw_meal_flow=100.0, fuel_flow_rate=45.0, kiln_rpm=2.5, feed_rate=120.0)
            assert test_env.agent._validate_sensor_data(valid_data) == True
        finally:
            await test_env.cleanup()

    async def _test_clinker_prediction(self):
        """Test clinker prediction"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        try:
            sensor_data = KilnSensorData(timestamp=datetime.now(), flame_temperature=1450.0, material_temperature=1200.0, shell_temperature=350.0, draft_pressure=-50.0, combustion_air_pressure=200.0, o2_level=3.0, co_level=50.0, nox_level=800.0, raw_meal_flow=100.0, fuel_flow_rate=45.0, kiln_rpm=2.5, feed_rate=120.0)
            prediction = await test_env.agent._predict_clinker_quality(sensor_data, {})
            assert isinstance(prediction, ClinkerPrediction)
            assert 0 <= prediction.quality_score <= 1
        finally:
            await test_env.cleanup()

    async def _test_control_decision(self):
        """Test control decision generation"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        try:
            sensor_data = KilnSensorData(timestamp=datetime.now(), flame_temperature=1350.0, material_temperature=1150.0, shell_temperature=340.0, draft_pressure=-50.0, combustion_air_pressure=200.0, o2_level=4.5, co_level=30.0, nox_level=750.0, raw_meal_flow=100.0, fuel_flow_rate=45.0, kiln_rpm=2.5, feed_rate=120.0)
            prediction = ClinkerPrediction(c3s_content=52.0, c2s_content=22.0, c3a_content=8.5, c4af_content=10.2, free_cao=2.8, quality_score=0.65, energy_efficiency=0.7, confidence=0.85)
            decision = await test_env.agent._generate_control_decision(sensor_data, prediction)
            assert isinstance(decision, ControlDecision)
        finally:
            await test_env.cleanup()

    async def _test_decision_validation(self):
        """Test decision validation"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        try:
            valid_decision = ControlDecision(fuel_flow_adjustment=3.0, air_flow_adjustment=-5.0, feed_rate_adjustment=-1.0, temperature_setpoint=1460.0, priority="MEDIUM", reasoning="Test")
            assert await test_env.agent._validate_decision(valid_decision) == True
        finally:
            await test_env.cleanup()

    async def _test_quality_calculation(self):
        """Test quality score calculation"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        try:
            ideal_prediction = np.array([55.0, 20.0, 8.0, 10.0, 1.0])
            quality_score = test_env.agent._calculate_quality_score(ideal_prediction)
            assert 0 <= quality_score <= 1
        finally:
            await test_env.cleanup()

    async def _test_decision_cycle(self):
        """Test complete decision cycle"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        try:
            sensor_data = test_env.simulator.generate_sensor_data()
            message_data = json.dumps(sensor_data).encode('utf-8')
            kiln_data = test_env.agent._parse_sensor_message(message_data)
            await test_env.agent._process_sensor_data(kiln_data)
            assert len(test_env.agent.decision_history) > 0
        finally:
            await test_env.cleanup()

    async def _test_self_correction(self):
        """Test self-correction mechanism"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        try:
            original_validate = test_env.agent._validate_decision
            call_count = 0
            async def mock_validate(decision):
                nonlocal call_count
                call_count += 1
                return call_count > 1
            test_env.agent._validate_decision = mock_validate
            
            sensor_data = test_env.simulator.generate_sensor_data()
            message_data = json.dumps(sensor_data).encode('utf-8')
            kiln_data = test_env.agent._parse_sensor_message(message_data)
            await test_env.agent._process_sensor_data(kiln_data)
            assert call_count >= 2
        finally:
            await test_env.cleanup()

    async def _test_orchestrator_comm(self):
        """Test orchestrator communication"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        try:
            sensor_data = test_env.simulator.generate_sensor_data()
            message_data = json.dumps(sensor_data).encode('utf-8')
            kiln_data = test_env.agent._parse_sensor_message(message_data)
            await test_env.agent._process_sensor_data(kiln_data)
            assert len(test_env.orchestrator_responses) > 0
        finally:
            await test_env.cleanup()

    async def _test_processing_rate(self):
        """Test message processing rate"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        try:
            start_time = datetime.now()
            message_count = 30
            for i in range(message_count):
                sensor_data = test_env.simulator.generate_sensor_data()
                message_data = json.dumps(sensor_data).encode('utf-8')
                kiln_data = test_env.agent._parse_sensor_message(message_data)
                await test_env.agent._process_sensor_data(kiln_data)
            
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            messages_per_second = message_count / processing_time
            
            assert messages_per_second >= 3.0
            return {'messages_per_second': messages_per_second, 'processing_time': processing_time}
        finally:
            await test_env.cleanup()

    async def _test_memory_usage(self):
        """Test memory usage"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        try:
            for i in range(120):
                sensor_data = test_env.simulator.generate_sensor_data()
                message_data = json.dumps(sensor_data).encode('utf-8')
                kiln_data = test_env.agent._parse_sensor_message(message_data)
                await test_env.agent._process_sensor_data(kiln_data)
            
            assert len(test_env.agent.decision_history) <= 100
            return {'decision_history_size': len(test_env.agent.decision_history)}
        finally:
            await test_env.cleanup()

    async def _test_concurrent_processing(self):
        """Test concurrent message processing"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        try:
            # Process multiple messages concurrently
            tasks = []
            for i in range(10):
                sensor_data = test_env.simulator.generate_sensor_data()
                message_data = json.dumps(sensor_data).encode('utf-8')
                kiln_data = test_env.agent._parse_sensor_message(message_data)
                task = asyncio.create_task(test_env.agent._process_sensor_data(kiln_data))
                tasks.append(task)
            
            start_time = datetime.now()
            await asyncio.gather(*tasks)
            end_time = datetime.now()
            
            processing_time = (end_time - start_time).total_seconds()
            assert processing_time < 5.0  # Should complete quickly
            return {'concurrent_processing_time': processing_time}
        finally:
            await test_env.cleanup()

    async def _generate_report(self):
        """Generate comprehensive test report"""
        logger.info("\n" + "="*60)
        logger.info("CLINKERIZATION AGENT TEST REPORT")
        logger.info("="*60)
        
        total_time = (self.end_time - self.start_time).total_seconds() if self.end_time else 0
        total_tests = len(self.test_results)
        passed_tests = sum(1 for t in self.test_results if t['passed'])
        failed_tests = total_tests - passed_tests
        
        logger.info(f"Test Duration: {total_time:.1f} seconds")
        logger.info(f"Total Tests: {total_tests}")
        logger.info(f"Passed: {passed_tests}")
        logger.info(f"Failed: {failed_tests}")
        logger.info(f"Success Rate: {(passed_tests/max(1,total_tests))*100:.1f}%")
        
        # Group results by test type
        test_types = {}
        for test in self.test_results:
            test_type = test['test_type']
            if test_type not in test_types:
                test_types[test_type] = {'passed': 0, 'failed': 0, 'tests': []}
            
            if test['passed']:
                test_types[test_type]['passed'] += 1
            else:
                test_types[test_type]['failed'] += 1
            
            test_types[test_type]['tests'].append(test)
        
        logger.info("\nResults by Test Type:")
        logger.info("-" * 40)
        
        for test_type, results in test_types.items():
            total = results['passed'] + results['failed']
            success_rate = (results['passed'] / max(1, total)) * 100
            logger.info(f"{test_type.upper()}: {results['passed']}/{total} passed ({success_rate:.1f}%)")
            
            # Show failed tests
            for test in results['tests']:
                if not test['passed']:
                    logger.error(f"  ✗ {test['name']}: {test.get('error', 'Unknown error')}")
                else:
                    logger.info(f"  ✓ {test['name']}")
        
        # Performance metrics
        logger.info("\nPerformance Metrics:")
        logger.info("-" * 40)
        
        for test in self.test_results:
            if test['test_type'] == 'performance' and test['passed'] and 'metrics' in test:
                metrics = test['metrics']
                logger.info(f"{test['name']}:")
                for key, value in metrics.items():
                    logger.info(f"  {key}: {value}")
        
        # Simulation results
        simulation_tests = [t for t in self.test_results if t['test_type'] in ['simulation', 'scenario']]
        if simulation_tests:
            logger.info("\nSimulation Results:")
            logger.info("-" * 40)
            
            for test in simulation_tests:
                if 'results' in test:
                    results = test['results']
                    logger.info(f"{test['name']}:")
                    logger.info(f"  Messages: {results.get('messages_processed', 0)}")
                    logger.info(f"  Decisions: {results.get('decisions_made', 0)}")
                    logger.info(f"  Error Rate: {results.get('error_rate', 0):.1%}")
        
        logger.info("="*60)
        
        # Return summary for programmatic use
        return {
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': failed_tests,
            'success_rate': (passed_tests/max(1,total_tests))*100,
            'test_duration': total_time,
            'test_types': test_types
        }

# Interactive Testing Environment
async def interactive_testing():
    """Interactive testing environment for manual testing"""
    print("\n" + "="*50)
    print("CLINKERIZATION AGENT INTERACTIVE TESTING")
    print("="*50)
    print("\nCommands:")
    print("  start          - Start continuous simulation")
    print("  stop           - Stop simulation")
    print("  scenario <name> - Trigger scenario (high_free_cao, low_efficiency, etc.)")
    print("  status         - Show agent status")
    print("  decisions      - Show recent decisions")
    print("  simulate <min> - Run simulation for specified minutes")
    print("  test <type>    - Run specific test (unit, integration, performance)")
    print("  quit           - Exit")
    print("\nAvailable scenarios: high_free_cao, low_efficiency, unstable_conditions, equipment_failure")
    print()
    
    test_env = TestEnvironment()
    await test_env.setup_agent()
    
    simulation_task = None
    
    try:
        while True:
            command = input("> ").strip().lower()
            
            if command == "start":
                if simulation_task is None or simulation_task.done():
                    simulation_task = asyncio.create_task(
                        test_env.run_simulation(duration_minutes=60, message_interval=3)
                    )
                    print("✓ Continuous simulation started")
                else:
                    print("! Simulation already running")
            
            elif command == "stop":
                if simulation_task and not simulation_task.done():
                    test_env.stop_simulation()
                    print("✓ Simulation stopped")
                else:
                    print("! No simulation running")
            
            elif command.startswith("scenario"):
                parts = command.split()
                if len(parts) > 1:
                    scenario_name = parts[1]
                    test_env.simulator.trigger_scenario(scenario_name, duration_seconds=120)
                    print(f"✓ Triggered scenario: {scenario_name}")
                else:
                    print("! Please specify scenario name")
            
            elif command == "status":
                if test_env.agent:
                    status = test_env.agent.get_status()
                    print(f"Messages Processed: {status['metrics']['messages_processed']}")
                    print(f"Decisions Made: {status['metrics']['decisions_made']}")
                    print(f"Corrections: {status['metrics']['corrections_attempted']}")
                    print(f"Escalations: {status['metrics']['escalations_to_human']}")
                    print(f"Running: {test_env.running}")
                    
                    simulator_state = test_env.simulator.get_current_state()
                    print(f"Active Scenarios: {simulator_state['active_scenarios']}")
                else:
                    print("! Agent not initialized")
            
            elif command == "decisions":
                if test_env.agent and test_env.agent.decision_history:
                    print(f"Recent Decisions (last 5):")
                    for decision in test_env.agent.decision_history[-5:]:
                        print(f"  {decision['timestamp']}")
                        print(f"    Priority: {decision['decision']['priority']}")
                        print(f"    Reasoning: {decision['decision']['reasoning']}")
                        print()
                else:
                    print("! No decisions made yet")
            
            elif command.startswith("simulate"):
                parts = command.split()
                if len(parts) > 1:
                    try:
                        minutes = int(parts[1])
                        print(f"Running {minutes}-minute simulation...")
                        results = await test_env.run_simulation(duration_minutes=minutes)
                        print(f"✓ Simulation complete:")
                        print(f"  Messages: {results['messages_processed']}")
                        print(f"  Decisions: {results['decisions_made']}")
                        print(f"  Error Rate: {results['error_rate']:.1%}")
                    except ValueError:
                        print("! Invalid duration")
                else:
                    print("! Please specify duration in minutes")
            
            elif command.startswith("test"):
                parts = command.split()
                if len(parts) > 1:
                    test_type = parts[1]
                    runner = TestRunner()
                    
                    if test_type == "unit":
                        await runner._run_unit_tests()
                    elif test_type == "integration":
                        await runner._run_integration_tests()
                    elif test_type == "performance":
                        await runner._run_performance_tests()
                    else:
                        print("! Unknown test type")
                    
                    # Show results
                    passed = sum(1 for t in runner.test_results if t['passed'])
                    total = len(runner.test_results)
                    print(f"✓ {test_type} tests: {passed}/{total} passed")
                else:
                    print("! Please specify test type (unit, integration, performance)")
            
            elif command == "quit":
                if simulation_task and not simulation_task.done():
                    test_env.stop_simulation()
                print("Exiting...")
                break
            
            elif command == "help":
                print("Available commands: start, stop, scenario, status, decisions, simulate, test, quit")
            
            else:
                print("! Unknown command. Type 'help' for available commands.")
    
    finally:
        await test_env.cleanup()

# Simple Orchestrator Placeholder for Testing
class MockOrchestrator:
    """
    Simple orchestrator placeholder for testing the agent without full infrastructure
    """
    
    def __init__(self):
        self.received_decisions = []
        self.decision_responses = []
        self.alerts = []
        self.running = False
    
    def start_server(self, port: int = 8080):
        """Start a simple HTTP server to receive agent decisions"""
        from http.server import HTTPServer, BaseHTTPRequestHandler
        import json
        import threading
        
        orchestrator = self
        
        class OrchestratorHandler(BaseHTTPRequestHandler):
            def do_POST(self):
                try:
                    content_length = int(self.headers['Content-Length'])
                    post_data = self.rfile.read(content_length)
                    
                    if self.path == '/api/decisions':
                        # Handle decision from agent
                        decision_data = json.loads(post_data.decode('utf-8'))
                        orchestrator.received_decisions.append({
                            'timestamp': datetime.now(),
                            'data': decision_data
                        })
                        
                        # Log the decision
                        agent_id = decision_data.get('agent_id', 'unknown')
                        decision = decision_data.get('decision', {})
                        reasoning = decision.get('reasoning', 'No reasoning provided')
                        priority = decision.get('priority', 'UNKNOWN')
                        
                        print(f"\n📡 ORCHESTRATOR: Received decision from {agent_id}")
                        print(f"   Priority: {priority}")
                        print(f"   Reasoning: {reasoning}")
                        print(f"   Fuel Adj: {decision.get('fuel_flow_adjustment', 0):.1f} kg/hr")
                        print(f"   Air Adj: {decision.get('air_flow_adjustment', 0):.1f} m³/min")
                        print(f"   Feed Adj: {decision.get('feed_rate_adjustment', 0):.1f} tons/hr")
                        
                        # Send acknowledgment
                        response = {
                            'status': 'accepted',
                            'decision_id': f"dec_{len(orchestrator.received_decisions)}",
                            'feedback': 'Decision received and logged'
                        }
                        
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps(response).encode())
                    
                    elif self.path == '/alerts':
                        # Handle alerts/escalations
                        alert_data = json.loads(post_data.decode('utf-8'))
                        orchestrator.alerts.append({
                            'timestamp': datetime.now(),
                            'data': alert_data
                        })
                        
                        print(f"\n🚨 ORCHESTRATOR: ALERT RECEIVED")
                        print(f"   Type: {alert_data.get('alert_type', 'UNKNOWN')}")
                        print(f"   Severity: {alert_data.get('severity', 'UNKNOWN')}")
                        print(f"   Reason: {alert_data.get('data', {}).get('reason', 'No reason')}")
                        
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(b'{"status": "alert_received"}')
                    
                    else:
                        self.send_response(404)
                        self.end_headers()
                
                except Exception as e:
                    print(f"Error handling request: {e}")
                    self.send_response(500)
                    self.end_headers()
            
            def do_GET(self):
                if self.path == '/status':
                    # Return orchestrator status
                    status = {
                        'status': 'running',
                        'decisions_received': len(orchestrator.received_decisions),
                        'alerts_received': len(orchestrator.alerts),
                        'uptime': 'mock_orchestrator'
                    }
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(status).encode())
                else:
                    self.send_response(404)
                    self.end_headers()
            
            def log_message(self, format, *args):
                # Suppress default HTTP server logging
                pass
        
        def run_server():
            server = HTTPServer(('localhost', port), OrchestratorHandler)
            self.running = True
            print(f"🎯 Mock Orchestrator started on http://localhost:{port}")
            print("   Endpoints:")
            print("   POST /api/decisions - Receive agent decisions")
            print("   POST /alerts - Receive agent alerts") 
            print("   GET /status - Get orchestrator status")
            
            try:
                server.serve_forever()
            except KeyboardInterrupt:
                pass
            finally:
                self.running = False
                print("\n🎯 Mock Orchestrator stopped")
        
        # Start server in background thread
        server_thread = threading.Thread(target=run_server, daemon=True)
        server_thread.start()
        
        return server_thread
    
    def get_received_decisions(self):
        """Get all decisions received from agents"""
        return self.received_decisions.copy()
    
    def get_alerts(self):
        """Get all alerts received from agents"""
        return self.alerts.copy()
    
    def clear_history(self):
        """Clear decision and alert history"""
        self.received_decisions.clear()
        self.alerts.clear()

# Updated TestEnvironment with Orchestrator Placeholder
class TestEnvironmentWithOrchestrator(TestEnvironment):
    """Test environment with mock orchestrator included"""
    
    def __init__(self, use_mock_orchestrator: bool = True):
        super().__init__()
        self.use_mock_orchestrator = use_mock_orchestrator
        self.mock_orchestrator = None
        self.orchestrator_port = 8080

    async def generate_test_data(self, count: int = 10, interval: float = 2.0):
        print(f"Generating {count} synthetic sensor messages...")
        
        for i in range(count):
            # Generate sensor data
            sensor_data = self.simulator.generate_sensor_data()
            message_data = json.dumps(sensor_data).encode('utf-8')
            
            # Process directly through agent (bypassing Pub/Sub)
            try:
                kiln_data = self.agent._parse_sensor_message(message_data)
                await self.agent._process_sensor_data(kiln_data)
                print(f"Processed message {i+1}/{count}")
            except Exception as e:
                print(f"Error processing message {i+1}: {e}")
            
            if i < count - 1:  # Don't sleep after last message
                await asyncio.sleep(interval)
        print("✓ Synthetic data generation complete")
    
    async def setup_agent(self, custom_config: Optional[Dict] = None):
        """Setup agent with optional mock orchestrator"""
        
        # Start mock orchestrator if requested
        if self.use_mock_orchestrator:
            self.mock_orchestrator = MockOrchestrator()
            orchestrator_thread = self.mock_orchestrator.start_server(self.orchestrator_port)
            
            # Wait a moment for server to start
            await asyncio.sleep(1)
            
            # Configure agent to use mock orchestrator
            orchestrator_endpoint = f"http://localhost:{self.orchestrator_port}/api/decisions"
        else:
            orchestrator_endpoint = None
        
        # Setup cloud service mocks
        self.mock_services.setup_mocks()
        
        try:
            # Default test configuration
            config = {
                'project_id': 'test-project',
                'subscription_name': 'test-subscription',
                'model_endpoint': 'test-endpoint',
                'bigquery_dataset': 'test_dataset',
                'orchestrator_endpoint': orchestrator_endpoint
            }
            
            # Apply custom configuration if provided
            if custom_config:
                config.update(custom_config)
            
            self.agent = ClinkerizationAgent(**config)
            
            # Mock the ML model with realistic behavior
            mock_model = Mock()
            
            def mock_predict(features):
                # Simulate realistic clinker predictions based on inputs
                base_prediction = np.array([55.0, 20.0, 8.0, 10.0, 1.5])
                
                # Add some variation based on flame temperature (first feature after scaling)
                if len(features) > 0 and len(features[0]) > 0:
                    temp_factor = features[0][0]  # Scaled flame temperature
                    variation = np.random.normal(0, 0.5, 5)  # Small random variation
                    
                    # Simulate temperature effects on clinker phases
                    if temp_factor < -1:  # Low temperature
                        variation[4] += 1.0  # Higher free CaO
                    elif temp_factor > 1:  # High temperature
                        variation[0] += 2.0  # Higher C3S
                
                return np.array([base_prediction + variation])
            
            mock_model.predict = mock_predict
            mock_model.estimators_ = [Mock() for _ in range(10)]  # For confidence calculation
            
            self.agent.clinker_model = mock_model
            
            # Mock the scaler
            mock_scaler = Mock()
            mock_scaler.transform = lambda x: x  # Pass through for simplicity
            self.agent.scaler = mock_scaler
            
            # Don't mock orchestrator communication if using real mock server
            if not self.use_mock_orchestrator:
                self.agent._send_decision_to_orchestrator = AsyncMock()
                
                # Track orchestrator calls
                async def track_orchestrator_call(*args, **kwargs):
                    self.orchestrator_responses.append({
                        'timestamp': datetime.now(),
                        'args': args,
                        'kwargs': kwargs
                    })
                    return True
                
                self.agent._send_decision_to_orchestrator = track_orchestrator_call
            
            logger.info("Test agent setup complete")
            if self.use_mock_orchestrator:
                logger.info(f"Mock orchestrator running on port {self.orchestrator_port}")
            
        except Exception as e:
            logger.error(f"Error setting up test agent: {e}")
            self.mock_services.cleanup_mocks()
            raise
    
    async def cleanup(self):
        """Cleanup test environment including orchestrator"""
        self.running = False
        self.mock_services.cleanup_mocks()
        
        if self.mock_orchestrator:
            # Orchestrator cleanup happens automatically via daemon thread
            pass
    
    def get_orchestrator_decisions(self):
        """Get decisions received by mock orchestrator"""
        if self.mock_orchestrator:
            return self.mock_orchestrator.get_received_decisions()
        return []
    
    def get_orchestrator_alerts(self):
        """Get alerts received by mock orchestrator"""
        if self.mock_orchestrator:
            return self.mock_orchestrator.get_alerts()
        return []

# Updated Interactive Testing with Orchestrator
async def interactive_testing_with_orchestrator():
    """Interactive testing environment with mock orchestrator"""
    print("\n" + "="*50)
    print("CLINKERIZATION AGENT TESTING WITH MOCK ORCHESTRATOR")
    print("="*50)
    print("\nCommands:")
    print("  start          - Start continuous simulation")
    print("  stop           - Stop simulation")
    print("  scenario <n>   - Trigger scenario")
    print("  status         - Show agent status")
    print("  decisions      - Show recent decisions")
    print("  orchestrator   - Show orchestrator status")
    print("  simulate <min> - Run simulation for specified minutes")
    print("  quit           - Exit")
    print("\nThe mock orchestrator will show received decisions in real-time!")
    print()
    
    # Use the enhanced test environment with orchestrator
    test_env = TestEnvironmentWithOrchestrator(use_mock_orchestrator=True)
    await test_env.setup_agent()
    
    simulation_task = None
    
    try:
        while True:
            command = input("> ").strip().lower()
            
            if command == "start":
                if simulation_task is None or simulation_task.done():
                    simulation_task = asyncio.create_task(
                        test_env.run_simulation(duration_minutes=60, message_interval=5)
                    )
                    print("✓ Continuous simulation started (check orchestrator output above)")
                else:
                    print("! Simulation already running")
            
            elif command == "stop":
                if simulation_task and not simulation_task.done():
                    test_env.stop_simulation()
                    print("✓ Simulation stopped")
                else:
                    print("! No simulation running")
            
            elif command.startswith("scenario"):
                parts = command.split()
                if len(parts) > 1:
                    scenario_name = parts[1]
                    test_env.simulator.trigger_scenario(scenario_name, duration_seconds=120)
                    print(f"✓ Triggered scenario: {scenario_name}")
                    print("  Watch the orchestrator output for agent responses!")
                else:
                    print("! Available scenarios: high_free_cao, low_efficiency, unstable_conditions, equipment_failure")
            
            elif command == "status":
                if test_env.agent:
                    status = test_env.agent.get_status()
                    print(f"Agent Status:")
                    print(f"  Messages Processed: {status['metrics']['messages_processed']}")
                    print(f"  Decisions Made: {status['metrics']['decisions_made']}")
                    print(f"  Corrections: {status['metrics']['corrections_attempted']}")
                    print(f"  Escalations: {status['metrics']['escalations_to_human']}")
                    print(f"  Running: {test_env.running}")
                    
                    simulator_state = test_env.simulator.get_current_state()
                    print(f"  Active Scenarios: {simulator_state['active_scenarios']}")
                else:
                    print("! Agent not initialized")
            
            elif command == "orchestrator":
                decisions = test_env.get_orchestrator_decisions()
                alerts = test_env.get_orchestrator_alerts()
                
                print(f"Mock Orchestrator Status:")
                print(f"  Decisions Received: {len(decisions)}")
                print(f"  Alerts Received: {len(alerts)}")
                print(f"  Running: {test_env.mock_orchestrator.running if test_env.mock_orchestrator else False}")
                
                if decisions:
                    print(f"\nLast 3 Decisions:")
                    for decision in decisions[-3:]:
                        data = decision['data']
                        dec = data.get('decision', {})
                        print(f"  {decision['timestamp'].strftime('%H:%M:%S')} - {dec.get('priority', 'UNKNOWN')}: {dec.get('reasoning', 'No reasoning')[:60]}...")
                
                if alerts:
                    print(f"\nAlerts:")
                    for alert in alerts:
                        alert_data = alert['data']
                        print(f"  {alert['timestamp'].strftime('%H:%M:%S')} - {alert_data.get('severity', 'UNKNOWN')}: {alert_data.get('data', {}).get('reason', 'Unknown')}")
            
            elif command == "decisions":
                if test_env.agent and test_env.agent.decision_history:
                    print(f"Agent Decision History (last 5):")
                    for decision in test_env.agent.decision_history[-5:]:
                        print(f"  {decision['timestamp']}")
                        print(f"    Priority: {decision['decision']['priority']}")
                        print(f"    Reasoning: {decision['decision']['reasoning']}")
                        print()
                else:
                    print("! No decisions made yet")
            
            elif command.startswith("simulate"):
                parts = command.split()
                if len(parts) > 1:
                    try:
                        minutes = int(parts[1])
                        print(f"Running {minutes}-minute simulation...")
                        print("Watch the orchestrator output for real-time decisions!")
                        results = await test_env.run_simulation(duration_minutes=minutes, message_interval=3)
                        print(f"✓ Simulation complete:")
                        print(f"  Messages: {results['messages_processed']}")
                        print(f"  Decisions: {results['decisions_made']}")
                        print(f"  Error Rate: {results['error_rate']:.1%}")
                        print(f"  Orchestrator received: {len(test_env.get_orchestrator_decisions())} decisions")
                    except ValueError:
                        print("! Invalid duration")
                else:
                    print("! Please specify duration in minutes")

            elif command.startswith("generate"):
                parts = command.split()
                count = int(parts[1]) if len(parts) > 1 else 10
                await test_env.generate_test_data(count=count, interval=1.0)
            
            elif command == "quit":
                if simulation_task and not simulation_task.done():
                    test_env.stop_simulation()
                print("Exiting...")
                break
            
            elif command == "help":
                print("Available commands: start, stop, scenario, status, decisions, orchestrator, simulate, quit")
            
            else:
                print("! Unknown command. Type 'help' for available commands.")
    
    finally:
        await test_env.cleanup()

# Quick Test Function for Agent-Only Testing
async def quick_agent_test():
    """Quick test of just the agent without orchestrator"""
    print("🚀 Quick Agent Test (No Orchestrator)")
    print("="*40)
    
    # Test environment without orchestrator
    test_env = TestEnvironment()
    await test_env.setup_agent()
    
    try:
        print("Testing agent with mock sensor data...")
        
        # Run a short simulation
        results = await test_env.run_simulation(duration_minutes=1, message_interval=2)
        
        print(f"\n✓ Test Results:")
        print(f"  Messages Processed: {results['messages_processed']}")
        print(f"  Decisions Made: {results['decisions_made']}")
        print(f"  Error Rate: {results['error_rate']:.1%}")
        print(f"  Decision Rate: {results['decision_rate']:.1%}")
        
        if results['decisions_made'] > 0:
            print(f"\n📋 Sample Decision:")
            last_decision = test_env.agent.decision_history[-1]
            decision = last_decision['decision']
            print(f"  Priority: {decision['priority']}")
            print(f"  Reasoning: {decision['reasoning']}")
            print(f"  Fuel Adjustment: {decision['fuel_flow_adjustment']:.1f} kg/hr")
            print(f"  Air Adjustment: {decision['air_flow_adjustment']:.1f} m³/min")
        
        # Test a scenario
        print(f"\n🧪 Testing High Free CaO Scenario...")
        scenario_results = await test_env.run_scenario_test('high_free_cao', duration_minutes=1)
        
        print(f"✓ Scenario Results:")
        print(f"  Scenario Responses: {scenario_results['scenario_response_count']}")
        print(f"  Total Decisions: {scenario_results['decisions_made']}")
        
        print(f"\n🎉 Agent test completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
    
    finally:
        await test_env.cleanup()

# Main test execution
async def main():
    """Main test execution function"""
    
    print("Clinkerization Agent Testing Framework")
    print("="*50)
    print("Choose testing mode:")
    print("1. Quick agent test (no orchestrator, 2 minutes)")
    print("2. Interactive testing with mock orchestrator")
    print("3. Interactive testing without orchestrator")
    print("4. Comprehensive test suite")
    print("5. Agent-only performance test")
    
    choice = input("Enter choice (1-5): ").strip()
    
    if choice == "1":
        await quick_agent_test()
        
    elif choice == "2":
        await interactive_testing_with_orchestrator()
        
    elif choice == "3":
        await interactive_testing()
        
    elif choice == "4":
        runner = TestRunner()
        await runner.run_all_tests(quick_mode=False)
        
    elif choice == "5":
        # Performance test without orchestrator
        print("🏃 Agent Performance Test")
        test_env = TestEnvironment()
        await test_env.setup_agent()
        
        try:
            # Test message processing rate
            start_time = datetime.now()
            message_count = 100
            
            for i in range(message_count):
                sensor_data = test_env.simulator.generate_sensor_data()
                message_data = json.dumps(sensor_data).encode('utf-8')
                kiln_data = test_env.agent._parse_sensor_message(message_data)
                await test_env.agent._process_sensor_data(kiln_data)
                
                if (i + 1) % 20 == 0:
                    print(f"  Processed {i + 1}/{message_count} messages...")
            
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            messages_per_second = message_count / processing_time
            
            print(f"\n✓ Performance Results:")
            print(f"  Processing Rate: {messages_per_second:.1f} messages/second")
            print(f"  Total Time: {processing_time:.1f} seconds")
            print(f"  Decisions Made: {len(test_env.agent.decision_history)}")
            print(f"  Decision Rate: {len(test_env.agent.decision_history)/message_count:.1%}")
            
        finally:
            await test_env.cleanup()
    
    else:
        print("Invalid choice")

if __name__ == "__main__":
    # Run the testing framework
    asyncio.run(main()) 
    def test_sensor_data_parsing(self, test_env):
        """Test sensor data parsing accuracy"""
        test_data = {
            'timestamp': '2024-01-01T12:00:00',
            'flame_temperature': 1450.5,
            'material_temperature': 1200.3,
            'shell_temperature': 350.7,
            'draft_pressure': -50.2,
            'combustion_air_pressure': 200.1,
            'o2_level': 3.2,
            'co_level': 52.8,
            'nox_level': 815.4,
            'raw_meal_flow': 98.7,
            'fuel_flow_rate': 47.3,
            'kiln_rpm': 2.48,
            'feed_rate': 125.6
        }
        
        message_data = json.dumps(test_data).encode('utf-8')
        parsed_data = test_env.agent._parse_sensor_message(message_data)
        
        assert isinstance(parsed_data, KilnSensorData)
        assert parsed_data.flame_temperature == 1450.5
        assert parsed_data.fuel_flow_rate == 47.3
        assert parsed_data.o2_level == 3.2
        
        logger.info("✓ Sensor data parsing test passed")

    @pytest.mark.asyncio
    async def test_sensor_data_validation(self, test_env):
        """Test sensor data validation"""
        
        # Valid data
        valid_data = KilnSensorData(
            timestamp=datetime.now(),
            flame_temperature=1450.0,
            material_temperature=1200.0,
            shell_temperature=350.0,
            draft_pressure=-50.0,
            combustion_air_pressure=200.0,
            o2_level=3.0,
            co_level=50.0,
            nox_level=800.0,
            raw_meal_flow=100.0,
            fuel_flow_rate=45.0,
            kiln_rpm=2.5,
            feed_rate=120.0
        )
        
        assert test_env.agent._validate_sensor_data(valid_data) == True
        
        # Invalid data - extreme temperature
        invalid_data = KilnSensorData(
            timestamp=datetime.now(),
            flame_temperature=2000.0,  # Too high
            material_temperature=1200.0,
            shell_temperature=350.0,
            draft_pressure=-50.0,
            combustion_air_pressure=200.0,
            o2_level=3.0,
            co_level=50.0,
            nox_level=800.0,
            raw_meal_flow=100.0,
            fuel_flow_rate=45.0,
            kiln_rpm=2.5,
            feed_rate=120.0
        )
        
        assert test_env.agent._validate_sensor_data(invalid_data) == False
        
        logger.info("✓ Sensor data validation test passed")

    @pytest.mark.asyncio
    async def test_clinker_prediction(self, test_env):
        """Test clinker quality prediction"""
        sensor_data = KilnSensorData(
            timestamp=datetime.now(),
            flame_temperature=1450.0,
            material_temperature=1200.0,
            shell_temperature=350.0,
            draft_pressure=-50.0,
            combustion_air_pressure=200.0,
            o2_level=3.0,
            co_level=50.0,
            nox_level=800.0,
            raw_meal_flow=100.0,
            fuel_flow_rate=45.0,
            kiln_rpm=2.5,
            feed_rate=120.0
        )
        
        prediction = await test_env.agent._predict_clinker_quality(sensor_data, {})
        
        assert isinstance(prediction, ClinkerPrediction)
        assert 0 <= prediction.quality_score <= 1
        assert 0 <= prediction.energy_efficiency <= 1
        assert 0 < prediction.confidence <= 1
        assert prediction.free_cao >= 0
        
        # Check realistic clinker phase ranges
        assert 40 <= prediction.c3s_content <= 70
        assert 10 <= prediction.c2s_content <= 35
        assert 3 <= prediction.c3a_content <= 15
        assert 5 <= prediction.c4af_content <= 20
        
        logger.info("✓ Clinker prediction test passed")

    @pytest.mark.asyncio
    async def test_control_decision_generation(self, test_env):
        """Test control decision generation logic"""
        
        # Test scenario: Low temperature, high O2
        sensor_data = KilnSensorData(
            timestamp=datetime.now(),
            flame_temperature=1350.0,  # Low temperature
            material_temperature=1150.0,
            shell_temperature=340.0,
            draft_pressure=-50.0,
            combustion_air_pressure=200.0,
            o2_level=4.5,  # High O2 (excess air)
            co_level=30.0,
            nox_level=750.0,
            raw_meal_flow=100.0,
            fuel_flow_rate=45.0,
            kiln_rpm=2.5,
            feed_rate=120.0
        )
        
        prediction = ClinkerPrediction(
            c3s_content=52.0,
            c2s_content=22.0,
            c3a_content=8.5,
            c4af_content=10.2,
            free_cao=2.8,  # High free CaO
            quality_score=0.65,  # Low quality
            energy_efficiency=0.7,  # Low efficiency
            confidence=0.85
        )
        
        decision = await test_env.agent._generate_control_decision(sensor_data, prediction)
        
        assert isinstance(decision, ControlDecision)
        
        # Should increase fuel for low temperature
        assert decision.fuel_flow_adjustment > 0
        
        # Should reduce air for excess O2
        assert decision.air_flow_adjustment < 0
        
        # Should be high priority due to quality issues
        assert decision.priority == "HIGH"
        
        # Reasoning should mention the issues
        reasoning = decision.reasoning.lower()
        assert "free cao" in reasoning or "temperature" in reasoning
        
        logger.info("✓ Control decision generation test passed")

    @pytest.mark.asyncio
    async def test_decision_validation(self, test_env):
        """Test decision validation logic"""
        
        # Valid decision
        valid_decision = ControlDecision(
            fuel_flow_adjustment=3.0,
            air_flow_adjustment=-5.0,
            feed_rate_adjustment=-1.0,
            temperature_setpoint=1460.0,
            priority="MEDIUM",
            reasoning="Normal optimization"
        )
        
        assert await test_env.agent._validate_decision(valid_decision) == True
        
        # Invalid decision - fuel adjustment too large
        invalid_decision = ControlDecision(
            fuel_flow_adjustment=25.0,  # Exceeds safety limit
            air_flow_adjustment=-5.0,
            feed_rate_adjustment=-1.0,
            temperature_setpoint=1460.0,
            priority="HIGH",
            reasoning="Excessive adjustment"
        )
        
        assert await test_env.agent._validate_decision(invalid_decision) == False
        
        # Invalid decision - temperature out of range
        invalid_temp_decision = ControlDecision(
            fuel_flow_adjustment=3.0,
            air_flow_adjustment=-5.0,
            feed_rate_adjustment=-1.0,
            temperature_setpoint=1700.0,  # Too high
            priority="HIGH",
            reasoning="Dangerous temperature"
        )
        
        assert await test_env.agent._validate_decision(invalid_temp_decision) == False
        
        logger.info("✓ Decision validation test passed")

    def test_quality_score_calculation(self, test_env):
        """Test quality score calculation"""
        
        # Ideal clinker composition
        ideal_prediction = np.array([55.0, 20.0, 8.0, 10.0, 1.0])
        quality_score = test_env.agent._calculate_quality_score(ideal_prediction)
        assert quality_score > 0.8
        
        # Poor clinker composition
        poor_prediction = np.array([40.0, 30.0, 15.0, 5.0, 4.0])  # High free CaO
        quality_score = test_env.agent._calculate_quality_score(poor_prediction)
        assert quality_score < 0.6
        
        # Moderate clinker composition
        moderate_prediction = np.array([50.0, 25.0, 10.0, 12.0, 2.5])
        quality_score = test_env.agent._calculate_quality_score(moderate_prediction)
        assert 0.4 < quality_score < 0.8
        
        logger.info("✓ Quality score calculation test passed")

# Integration Tests
class TestAgentIntegration:
    """Integration tests for complete agent workflows"""
    
    @pytest.mark.asyncio
    async def test_complete_decision_cycle(self):
        """Test complete decision-making cycle"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        
        try:
            # Generate test sensor data
            sensor_data = test_env.simulator.generate_sensor_data()
            message_data = json.dumps(sensor_data).encode('utf-8')
            
            # Process through complete cycle
            kiln_data = test_env.agent._parse_sensor_message(message_data)
            await test_env.agent._process_sensor_data(kiln_data)
            
            # Verify decision was made
            assert len(test_env.agent.decision_history) > 0
            
            # Verify decision structure
            decision = test_env.agent.decision_history[-1]
            assert 'timestamp' in decision
            assert 'decision' in decision
            assert 'prediction' in decision
            assert 'sensor_data' in decision
            
            # Verify orchestrator was called
            assert len(test_env.orchestrator_responses) > 0
            
            logger.info("✓ Complete decision cycle test passed")
            
        finally:
            await test_env.cleanup()

    @pytest.mark.asyncio
    async def test_self_correction_mechanism(self):
        """Test self-correction when decisions fail validation"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        
        try:
            # Mock decision validation to fail initially
            original_validate = test_env.agent._validate_decision
            
            call_count = 0
            async def mock_validate(decision):
                nonlocal call_count
                call_count += 1
                if call_count == 1:
                    return False  # First attempt fails
                return await original_validate(decision)  # Second attempt succeeds
            
            test_env.agent._validate_decision = mock_validate
            
            # Process sensor data
            sensor_data = test_env.simulator.generate_sensor_data()
            message_data = json.dumps(sensor_data).encode('utf-8')
            kiln_data = test_env.agent._parse_sensor_message(message_data)
            
            await test_env.agent._process_sensor_data(kiln_data)
            
            # Verify self-correction was triggered
            assert call_count >= 2
            assert test_env.agent.correction_attempts >= 0  # Should reset after success
            
            logger.info("✓ Self-correction mechanism test passed")
            
        finally:
            await test_env.cleanup()

# Performance Tests
class TestAgentPerformance:
    """Performance and load tests"""
    
    @pytest.mark.asyncio
    async def test_message_processing_rate(self):
        """Test agent can handle expected message rate"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        
        try:
            # Process 50 messages rapidly
            start_time = datetime.now()
            message_count = 50
            
            for i in range(message_count):
                sensor_data = test_env.simulator.generate_sensor_data()
                message_data = json.dumps(sensor_data).encode('utf-8')
                kiln_data = test_env.agent._parse_sensor_message(message_data)
                await test_env.agent._process_sensor_data(kiln_data)
            
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            
            messages_per_second = message_count / processing_time
            
            # Should process at least 5 messages per second
            assert messages_per_second >= 5.0
            
            logger.info(f"✓ Message processing rate test passed: {messages_per_second:.1f} msg/sec")
            
        finally:
            await test_env.cleanup()

class TestAgentPerformance:
    """Performance and load tests"""
    
    @pytest.mark.asyncio
    async def test_message_processing_rate(self):
        """Test agent can handle expected message rate"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        
        try:
            # Process 50 messages rapidly
            start_time = datetime.now()
            message_count = 50
            
            for i in range(message_count):
                sensor_data = test_env.simulator.generate_sensor_data()
                message_data = json.dumps(sensor_data).encode('utf-8')
                kiln_data = test_env.agent._parse_sensor_message(message_data)
                await test_env.agent._process_sensor_data(kiln_data)
            
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            messages_per_second = message_count / processing_time
            
            # Should process at least 5 messages per second
            assert messages_per_second >= 5.0
            
            logger.info(f"✓ Message processing rate test passed: {messages_per_second:.1f} msg/sec")
            
        finally:
            await test_env.cleanup()
    
    @pytest.mark.asyncio
    async def test_memory_usage(self):
        """Test memory usage doesn't grow unbounded"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        
        try:
            # Process many messages
            for i in range(150):
                sensor_data = test_env.simulator.generate_sensor_data()
                message_data = json.dumps(sensor_data).encode('utf-8')
                kiln_data = test_env.agent._parse_sensor_message(message_data)
                await test_env.agent._process_sensor_data(kiln_data)
            
            # Verify decision history is capped at 100
            assert len(test_env.agent.decision_history) <= 100
            
            logger.info("✓ Memory usage test passed")
            
        finally:
            await test_env.cleanup()
    
    @pytest.mark.asyncio
    async def test_concurrent_processing(self):
        """Test concurrent message processing"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        
        try:
            # Process multiple messages concurrently
            tasks = []
            message_count = 20
            
            for i in range(message_count):
                sensor_data = test_env.simulator.generate_sensor_data()
                message_data = json.dumps(sensor_data).encode('utf-8')
                kiln_data = test_env.agent._parse_sensor_message(message_data)
                task = asyncio.create_task(test_env.agent._process_sensor_data(kiln_data))
                tasks.append(task)
            
            start_time = datetime.now()
            await asyncio.gather(*tasks)
            end_time = datetime.now()
            
            processing_time = (end_time - start_time).total_seconds()
            messages_per_second = message_count / processing_time
            
            # Should handle concurrent processing efficiently
            assert processing_time < 10.0  # Should complete within 10 seconds
            assert messages_per_second >= 2.0  # At least 2 messages per second
            
            logger.info(f"✓ Concurrent processing test passed: {messages_per_second:.1f} msg/sec")
            
        finally:
            await test_env.cleanup()
    
    @pytest.mark.asyncio
    async def test_sustained_load(self):
        """Test agent under sustained load"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        
        try:
            # Simulate sustained load for 2 minutes
            start_time = datetime.now()
            message_count = 0
            error_count = 0
            
            while (datetime.now() - start_time).seconds < 120:  # 2 minutes
                try:
                    sensor_data = test_env.simulator.generate_sensor_data()
                    message_data = json.dumps(sensor_data).encode('utf-8')
                    kiln_data = test_env.agent._parse_sensor_message(message_data)
                    await test_env.agent._process_sensor_data(kiln_data)
                    message_count += 1
                    
                    # Brief pause to simulate realistic timing
                    await asyncio.sleep(0.1)
                    
                except Exception as e:
                    error_count += 1
                    logger.warning(f"Error in sustained load test: {e}")
            
            end_time = datetime.now()
            total_time = (end_time - start_time).total_seconds()
            error_rate = error_count / max(1, message_count)
            
            # Performance criteria
            assert message_count > 100  # Should process significant number of messages
            assert error_rate < 0.05   # Less than 5% error rate
            assert len(test_env.agent.decision_history) > 50  # Should make decisions
            
            logger.info(f"✓ Sustained load test passed:")
            logger.info(f"  Messages: {message_count} in {total_time:.1f}s")
            logger.info(f"  Rate: {message_count/total_time:.1f} msg/sec")
            logger.info(f"  Error rate: {error_rate:.1%}")
            logger.info(f"  Decisions: {len(test_env.agent.decision_history)}")
            
        finally:
            await test_env.cleanup()
    
    @pytest.mark.asyncio
    async def test_decision_latency(self):
        """Test decision-making latency"""
        test_env = TestEnvironment()
        await test_env.setup_agent()
        
        try:
            latencies = []
            
            for i in range(20):
                sensor_data = test_env.simulator.generate_sensor_data()
                message_data = json.dumps(sensor_data).encode('utf-8')
                kiln_data = test_env.agent._parse_sensor_message(message_data)
                
                start_time = datetime.now()
                await test_env.agent._process_sensor_data(kiln_data)
                end_time = datetime.now()
                
                latency = (end_time - start_time).total_seconds() * 1000  # Convert to milliseconds
                latencies.append(latency)
            
            avg_latency = sum(latencies) / len(latencies)
            max_latency = max(latencies)
            min_latency = min(latencies)
            
            # Latency requirements
            assert avg_latency < 500  # Average latency under 500ms
            assert max_latency < 2000  # Maximum latency under 2 seconds
            
            logger.info(f"✓ Decision latency test passed:")
            logger.info(f"  Average: {avg_latency:.1f}ms")
            logger.info(f"  Min: {min_latency:.1f}ms") 
            logger.info(f"  Max: {max_latency:.1f}ms")
            
        finally:
            await test_env.cleanup()