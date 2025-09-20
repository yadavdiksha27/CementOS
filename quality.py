"""
Quality Control Agent for Cement Manufacturing (Lite Version)
Based on "Quality Control of Cement Clinker through Operating Condition Classification and Free Calcium Oxide Content Prediction"

This is a lightweight version that avoids TensorFlow threading issues
"""

import asyncio
import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import os

# Configure environment variables to avoid TensorFlow threading issues
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow logging
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'  # Disable GPU
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN optimizations

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# FastAPI imports
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
import uvicorn

@dataclass
class ThermalImageData:
    """Structure for thermal image data from grate cooler"""
    timestamp: datetime
    image_data: bytes
    camera_id: str
    temperature_range: Tuple[float, float]
    metadata: Dict[str, Any]

@dataclass
class DCSData:
    """Structure for DCS time-series data"""
    timestamp: datetime
    inlet_temp_waste_heat: float  # °C
    secondary_air_temp: float     # °C
    flame_temperature: float      # °C
    clinker_temperature: float    # °C
    grate_bed_pressure: float     # kPa
    kiln_speed: float            # rpm
    feed_rate: float             # t/h
    fuel_flow: float             # kg/h
    o2_level: float              # %
    co_level: float              # ppm

class QualityControlAgent:
    """Simplified Quality Control Agent implementing the two-step methodology"""
    
    def __init__(self):
        self.start_time = datetime.now()
        self.dcs_data_buffer = []
        self.max_buffer_size = 1000
        
        # Metrics
        self.metrics = {
            'images_processed': 0,
            'abnormal_conditions_detected': 0,
            'fcao_predictions_made': 0,
            'alerts_generated': 0,
            'last_prediction_time': None
        }
        
        logger.info("Quality Control Agent initialized (Lite Version)")
    
    async def process_thermal_image(self, thermal_data: ThermalImageData) -> Dict[str, Any]:
        """Process thermal image and determine operating condition (simplified mock version)"""
        try:
            # In the lite version, we simulate the classification
            # In a real implementation, this would use ResNet50
            
            # Simulate classification based on image metadata
            is_abnormal = False
            confidence = 0.85
            
            # For demo purposes, detect abnormal conditions based on temperature range
            if thermal_data.temperature_range[1] > 800:
                is_abnormal = True
                confidence = 0.92
            
            self.metrics['images_processed'] += 1
            
            if is_abnormal:
                self.metrics['abnormal_conditions_detected'] += 1
                
                # Generate alert for abnormal condition
                alert = await self._generate_abnormal_condition_alert({
                    'camera_id': thermal_data.camera_id,
                    'confidence': confidence,
                    'predicted_class': 'abnormal_flying_ash'
                })
                
            classification_result = {
                "timestamp": thermal_data.timestamp.isoformat(),
                "camera_id": thermal_data.camera_id,
                "predicted_class": "abnormal_flying_ash" if is_abnormal else "normal",
                "confidence": confidence,
                "is_abnormal": is_abnormal,
                "alert_required": is_abnormal,
                "class_probabilities": {
                    "normal": 0.15 if is_abnormal else 0.85,
                    "abnormal_flying_ash": 0.85 if is_abnormal else 0.15
                }
            }
            
            if is_abnormal:
                classification_result['alert'] = alert
            
            logger.info(f"Image classification result: {classification_result['predicted_class']} (confidence: {confidence:.3f})")
            return classification_result
            
        except Exception as e:
            logger.error(f"Error processing thermal image: {e}")
            raise
    
    async def process_dcs_data(self, dcs_data: DCSData, operating_condition: str = "normal") -> Optional[Dict[str, Any]]:
        """Process DCS data and predict f-CaO if conditions are normal (simplified mock version)"""
        try:
            # Add to buffer
            self.dcs_data_buffer.append(dcs_data)
            
            # Maintain buffer size
            if len(self.dcs_data_buffer) > self.max_buffer_size:
                self.dcs_data_buffer = self.dcs_data_buffer[-self.max_buffer_size:]
            
            # Only predict if operating condition is normal
            if operating_condition != "normal":
                logger.info("Skipping f-CaO prediction due to abnormal operating condition")
                return None
            
            # Check if we have enough data for prediction
            if len(self.dcs_data_buffer) < 5:  # Need at least 5 data points
                return None
            
            # In the lite version, we simulate the prediction
            # In a real implementation, this would use XGBoost
            
            # Simple rule-based prediction based on latest DCS data
            latest_data = self.dcs_data_buffer[-1]
            
            # Simplified f-CaO prediction formula based on key parameters
            # This is a mock formula for demonstration purposes
            flame_temp_factor = (latest_data.flame_temperature - 1400) / 200  # Normalized around 1400-1600°C
            clinker_temp_factor = (latest_data.clinker_temperature - 1300) / 150  # Normalized around 1300-1450°C
            o2_factor = (latest_data.o2_level - 2) / 3  # Normalized around 2-5%
            
            # Lower is better for f-CaO (free lime)
            f_cao_prediction = 1.5 - 0.5 * flame_temp_factor - 0.3 * clinker_temp_factor + 0.2 * o2_factor
            f_cao_prediction = max(0.2, min(3.0, f_cao_prediction))  # Clamp between 0.2% and 3.0%
            
            # Calculate prediction confidence (simplified approach)
            confidence = min(0.95, max(0.5, 1.0 - abs(f_cao_prediction - 1.0) / 3.0))
            
            # Determine alert level based on f-CaO content
            alert_level = "none"
            recommendations = []
            
            if f_cao_prediction > 2.0:
                alert_level = "critical"
                recommendations.extend([
                    "High f-CaO detected - reduce kiln temperature",
                    "Check raw material composition",
                    "Increase residence time in burning zone"
                ])
            elif f_cao_prediction > 1.5:
                alert_level = "warning"
                recommendations.extend([
                    "Elevated f-CaO levels - monitor closely",
                    "Consider adjusting fuel flow rate"
                ])
            else:
                recommendations.append("f-CaO levels within acceptable range")
            
            self.metrics['fcao_predictions_made'] += 1
            self.metrics['last_prediction_time'] = datetime.now()
            
            prediction_result = {
                "timestamp": datetime.now().isoformat(),
                "f_cao_prediction": float(f_cao_prediction),
                "confidence": float(confidence),
                "alert_level": alert_level,
                "recommendations": recommendations,
                "input_features": {
                    "inlet_temp_waste_heat": float(latest_data.inlet_temp_waste_heat),
                    "secondary_air_temp": float(latest_data.secondary_air_temp),
                    "flame_temperature": float(latest_data.flame_temperature),
                    "clinker_temperature": float(latest_data.clinker_temperature),
                    "grate_bed_pressure": float(latest_data.grate_bed_pressure),
                    "kiln_speed": float(latest_data.kiln_speed),
                    "feed_rate": float(latest_data.feed_rate),
                    "fuel_flow": float(latest_data.fuel_flow),
                    "o2_level": float(latest_data.o2_level)
                }
            }
            
            # Generate alerts if necessary
            if alert_level != "none":
                self.metrics['alerts_generated'] += 1
                alert = await self._generate_quality_alert(prediction_result)
                prediction_result['alert'] = alert
            
            logger.info(f"f-CaO prediction: {f_cao_prediction:.3f}% (confidence: {confidence:.3f})")
            return prediction_result
            
        except Exception as e:
            logger.error(f"Error processing DCS data: {e}")
            raise
    
    async def _generate_abnormal_condition_alert(self, classification_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate alert for abnormal operating condition"""
        alert = {
            "type": "abnormal_condition",
            "severity": "high",
            "timestamp": datetime.now().isoformat(),
            "message": f"Abnormal operating condition detected: {classification_result['predicted_class']}",
            "confidence": classification_result['confidence'],
            "camera_id": classification_result['camera_id'],
            "actions_required": [
                "Inspect grate cooler for flying ash phenomenon",
                "Check material discharge positions",
                "Review operating parameters",
                "Consider reducing feed rate temporarily"
            ]
        }
        
        logger.warning(f"Abnormal condition alert generated: {alert['message']}")
        return alert
    
    async def _generate_quality_alert(self, prediction_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate alert for quality issues"""
        alert = {
            "type": "quality_alert",
            "severity": prediction_result['alert_level'],
            "timestamp": datetime.now().isoformat(),
            "message": f"f-CaO prediction: {prediction_result['f_cao_prediction']:.2f}%",
            "confidence": prediction_result['confidence'],
            "recommendations": prediction_result['recommendations']
        }
        
        logger.warning(f"Quality alert generated: {alert['message']}")
        return alert
    
    def get_status(self) -> Dict[str, Any]:
        """Get agent status"""
        uptime = (datetime.now() - self.start_time).total_seconds()
        
        return {
            "status": "running",
            "uptime_seconds": int(uptime),
            "metrics": self.metrics.copy(),
            "buffer_size": len(self.dcs_data_buffer),
            "models": {
                "thermal_classifier": "Simplified Rule-Based (Lite Version)",
                "fcao_predictor": "Simplified Formula (Lite Version)"
            },
            "version": "Lite 1.0"
        }

# FastAPI application
app = FastAPI(title="Quality Control Agent API (Lite)", version="1.0.0")

# Global agent instance
quality_agent = QualityControlAgent()

class ThermalImageRequest(BaseModel):
    camera_id: str
    timestamp: Optional[str] = None
    temperature_range: Optional[List[float]] = None
    metadata: Optional[Dict[str, Any]] = None

class DCSDataRequest(BaseModel):
    inlet_temp_waste_heat: float
    secondary_air_temp: float
    flame_temperature: float
    clinker_temperature: float
    grate_bed_pressure: float
    kiln_speed: float
    feed_rate: float
    fuel_flow: float
    o2_level: float
    co_level: float
    timestamp: Optional[str] = None
    operating_condition: Optional[str] = "normal"

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "agent": quality_agent.get_status()
    }

@app.post("/analyze-thermal-image")
async def analyze_thermal_image(
    request: ThermalImageRequest,
    image: Optional[UploadFile] = File(None)
):
    """Analyze thermal image for operating condition classification"""
    try:
        # Read image data if provided, otherwise use dummy data
        image_data = await image.read() if image else b"dummy_image_data"
        
        # Create thermal data object
        thermal_data = ThermalImageData(
            timestamp=datetime.fromisoformat(request.timestamp) if request.timestamp else datetime.now(),
            image_data=image_data,
            camera_id=request.camera_id,
            temperature_range=tuple(request.temperature_range) if request.temperature_range else (0.0, 1000.0),
            metadata=request.metadata or {}
        )
        
        # Process image
        result = await quality_agent.process_thermal_image(thermal_data)
        
        return {
            "success": True,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error analyzing thermal image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-fcao")
async def predict_fcao(request: DCSDataRequest):
    """Predict f-CaO content from DCS data"""
    try:
        # Create DCS data object
        dcs_data = DCSData(
            timestamp=datetime.fromisoformat(request.timestamp) if request.timestamp else datetime.now(),
            inlet_temp_waste_heat=request.inlet_temp_waste_heat,
            secondary_air_temp=request.secondary_air_temp,
            flame_temperature=request.flame_temperature,
            clinker_temperature=request.clinker_temperature,
            grate_bed_pressure=request.grate_bed_pressure,
            kiln_speed=request.kiln_speed,
            feed_rate=request.feed_rate,
            fuel_flow=request.fuel_flow,
            o2_level=request.o2_level,
            co_level=request.co_level
        )
        
        # Process DCS data
        result = await quality_agent.process_dcs_data(dcs_data, request.operating_condition)
        
        return {
            "success": True,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error predicting f-CaO: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
async def get_status():
    """Get agent status"""
    return quality_agent.get_status()

async def start_server():
    """Start the FastAPI server"""
    logger.info("Starting Quality Control Agent API (Lite Version) on port 8003")
    config = uvicorn.Config(
        app, 
        host="0.0.0.0", 
        port=8003,
        log_level="info",
        workers=1  # Use a single worker to avoid threading issues
    )
    server = uvicorn.Server(config)
    await server.serve()

if __name__ == "__main__":
    import sys
    try:
        if len(sys.argv) > 1 and sys.argv[1] == "serve":
            # Run as API server
            asyncio.run(start_server())
        else:
            # Run test examples
            print("🔬 Quality Control Agent (Lite Version) - Test Mode")
            print("Use 'python quality_lite.py serve' to start the API server")
    except KeyboardInterrupt:
        print("\nShutting down Quality Control Agent...")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Error starting Quality Control Agent: {str(e)}")
        sys.exit(1)
