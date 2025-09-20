"""
CementOptimizer Technical Support Representative (TSR) Agent
Simplified async implementation with FastAPI for cement production optimization.
"""

import asyncio
import json
import logging
import math
import random
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Data Models
class OptimizationRequest(BaseModel):
    plant_capacity: float = Field(default=3000, description="Plant capacity in TPD")
    objective: str = Field(default="balanced", description="Optimization objective: cost, emissions, balanced, pareto")
    constraints: Dict[str, Any] = Field(default_factory=dict)
    sensitivity_params: Optional[Dict[str, float]] = None

class OptimizationResult(BaseModel):
    success: bool
    objective_values: Dict[str, float]
    raw_mix: Dict[str, float]
    fuel_mix: Dict[str, float]
    clinker_quality: Dict[str, float]
    recommendations: List[str]
    pareto_solutions: Optional[List[Dict]] = None
    sensitivity_analysis: Optional[Dict] = None

class MaterialData(BaseModel):
    name: str
    cost_per_ton: float
    co2_factor: float
    availability: float
    chemical_composition: Dict[str, float]

class FuelData(BaseModel):
    name: str
    cost_per_ton: float
    co2_factor: float
    calorific_value: float
    availability: float
    ash_content: float
    ash_composition: Dict[str, float]

# Default Materials Database
DEFAULT_MATERIALS = {
    "limestone": MaterialData(
        name="Limestone",
        cost_per_ton=25.0,
        co2_factor=0.44,
        availability=1.0,
        chemical_composition={
            "CaO": 52.5, "SiO2": 2.8, "Al2O3": 0.8, "Fe2O3": 0.6,
            "MgO": 1.2, "SO3": 0.1, "K2O": 0.1, "Na2O": 0.05, "LOI": 42.0
        }
    ),
    "clay": MaterialData(
        name="Clay",
        cost_per_ton=18.0,
        co2_factor=0.1,
        availability=1.0,
        chemical_composition={
            "CaO": 0.8, "SiO2": 58.5, "Al2O3": 18.2, "Fe2O3": 6.8,
            "MgO": 2.1, "SO3": 0.2, "K2O": 2.8, "Na2O": 0.9, "LOI": 9.7
        }
    ),
    "iron_ore": MaterialData(
        name="Iron Ore",
        cost_per_ton=45.0,
        co2_factor=0.05,
        availability=0.95,
        chemical_composition={
            "CaO": 2.1, "SiO2": 8.5, "Al2O3": 3.2, "Fe2O3": 82.5,
            "MgO": 0.8, "SO3": 0.1, "K2O": 0.2, "Na2O": 0.1, "LOI": 2.5
        }
    ),
    "fly_ash": MaterialData(
        name="Fly Ash",
        cost_per_ton=12.0,
        co2_factor=-0.1,
        availability=0.8,
        chemical_composition={
            "CaO": 4.2, "SiO2": 52.8, "Al2O3": 28.5, "Fe2O3": 8.2,
            "MgO": 1.8, "SO3": 0.8, "K2O": 2.1, "Na2O": 1.2, "LOI": 0.4
        }
    ),
    "silica_sand": MaterialData(
        name="Silica Sand",
        cost_per_ton=22.0,
        co2_factor=0.02,
        availability=1.0,
        chemical_composition={
            "CaO": 0.1, "SiO2": 96.8, "Al2O3": 1.8, "Fe2O3": 0.8,
            "MgO": 0.1, "SO3": 0.05, "K2O": 0.2, "Na2O": 0.1, "LOI": 0.05
        }
    )
}

DEFAULT_FUELS = {
    "petcoke": FuelData(
        name="Petroleum Coke",
        cost_per_ton=85.0,
        co2_factor=3.2,
        calorific_value=8200,
        availability=1.0,
        ash_content=0.8,
        ash_composition={
            "CaO": 8.5, "SiO2": 28.2, "Al2O3": 18.5, "Fe2O3": 12.8,
            "MgO": 4.2, "SO3": 15.5, "K2O": 2.8, "Na2O": 1.5
        }
    ),
    "coal": FuelData(
        name="Coal",
        cost_per_ton=75.0,
        co2_factor=2.8,
        calorific_value=6500,
        availability=1.0,
        ash_content=12.5,
        ash_composition={
            "CaO": 5.2, "SiO2": 48.5, "Al2O3": 28.8, "Fe2O3": 8.5,
            "MgO": 2.1, "SO3": 2.8, "K2O": 2.5, "Na2O": 1.6
        }
    ),
    "biomass": FuelData(
        name="Biomass",
        cost_per_ton=65.0,
        co2_factor=0.1,
        calorific_value=4200,
        availability=0.7,
        ash_content=8.2,
        ash_composition={
            "CaO": 35.8, "SiO2": 28.5, "Al2O3": 8.2, "Fe2O3": 4.5,
            "MgO": 8.5, "SO3": 2.1, "K2O": 8.8, "Na2O": 3.6
        }
    ),
    "tdf": FuelData(
        name="Tire Derived Fuel",
        cost_per_ton=45.0,
        co2_factor=2.1,
        calorific_value=7800,
        availability=0.6,
        ash_content=15.2,
        ash_composition={
            "CaO": 2.8, "SiO2": 28.5, "Al2O3": 12.8, "Fe2O3": 38.5,
            "MgO": 1.2, "SO3": 8.5, "K2O": 2.1, "Na2O": 5.6
        }
    ),
    "wdf": FuelData(
        name="Waste Derived Fuel",
        cost_per_ton=35.0,
        co2_factor=1.8,
        calorific_value=5500,
        availability=0.5,
        ash_content=22.5,
        ash_composition={
            "CaO": 18.5, "SiO2": 32.8, "Al2O3": 15.2, "Fe2O3": 8.5,
            "MgO": 4.2, "SO3": 12.8, "K2O": 4.5, "Na2O": 3.5
        }
    )
}

class CementOptimizerTSR:
    """Technical Support Representative for Cement Production Optimization"""
    
    def __init__(self):
        self.materials = DEFAULT_MATERIALS
        self.fuels = DEFAULT_FUELS
        self.logger = logging.getLogger(__name__)
        
    async def optimize_production(self, request: OptimizationRequest) -> OptimizationResult:
        """Main optimization function"""
        try:
            self.logger.info(f"Starting optimization with objective: {request.objective}")
            
            if request.objective == "pareto":
                return await self._pareto_optimization(request)
            elif request.sensitivity_params:
                return await self._sensitivity_analysis(request)
            else:
                return await self._single_objective_optimization(request)
                
        except Exception as e:
            self.logger.error(f"Optimization failed: {str(e)}")
            return OptimizationResult(
                success=False,
                objective_values={"error": str(e)},
                raw_mix={},
                fuel_mix={},
                clinker_quality={},
                recommendations=[f"Optimization failed: {str(e)}"]
            )
    
    async def _single_objective_optimization(self, request: OptimizationRequest) -> OptimizationResult:
        """Single objective optimization using Monte Carlo method"""
        best_solution = None
        best_score = float('inf')
        
        # Generate random solutions
        for _ in range(1000):
            solution = self._generate_random_solution()
            
            if self._validate_constraints(solution, request.constraints):
                score = self._evaluate_objective(solution, request.objective)
                
                if score < best_score:
                    best_score = score
                    best_solution = solution
        
        if best_solution is None:
            return OptimizationResult(
                success=False,
                objective_values={"error": "No feasible solution found"},
                raw_mix={},
                fuel_mix={},
                clinker_quality={},
                recommendations=["No feasible solution found. Consider relaxing constraints."]
            )
        
        # Calculate results
        raw_mix, fuel_mix = best_solution
        clinker_quality = self._calculate_clinker_quality(raw_mix, fuel_mix)
        cost = self._calculate_cost(raw_mix, fuel_mix, request.plant_capacity)
        emissions = self._calculate_emissions(raw_mix, fuel_mix, request.plant_capacity)
        
        recommendations = self._generate_recommendations(raw_mix, fuel_mix, clinker_quality, request.objective)
        
        return OptimizationResult(
            success=True,
            objective_values={"cost": cost, "emissions": emissions, "score": best_score},
            raw_mix=raw_mix,
            fuel_mix=fuel_mix,
            clinker_quality=clinker_quality,
            recommendations=recommendations
        )
    
    async def _pareto_optimization(self, request: OptimizationRequest) -> OptimizationResult:
        """Multi-objective Pareto front optimization"""
        pareto_solutions = []
        
        # Generate solutions for Pareto front
        for _ in range(2000):
            solution = self._generate_random_solution()
            
            if self._validate_constraints(solution, request.constraints):
                raw_mix, fuel_mix = solution
                cost = self._calculate_cost(raw_mix, fuel_mix, request.plant_capacity)
                emissions = self._calculate_emissions(raw_mix, fuel_mix, request.plant_capacity)
                
                pareto_solutions.append({
                    "cost": cost,
                    "emissions": emissions,
                    "raw_mix": raw_mix,
                    "fuel_mix": fuel_mix,
                    "clinker_quality": self._calculate_clinker_quality(raw_mix, fuel_mix)
                })
        
        # Filter Pareto front
        pareto_front = self._filter_pareto_front(pareto_solutions)
        
        # Select representative solution (balanced)
        if pareto_front:
            best_solution = min(pareto_front, key=lambda x: x["cost"] + x["emissions"])
            
            return OptimizationResult(
                success=True,
                objective_values={"cost": best_solution["cost"], "emissions": best_solution["emissions"]},
                raw_mix=best_solution["raw_mix"],
                fuel_mix=best_solution["fuel_mix"],
                clinker_quality=best_solution["clinker_quality"],
                recommendations=self._generate_recommendations(
                    best_solution["raw_mix"], 
                    best_solution["fuel_mix"], 
                    best_solution["clinker_quality"], 
                    "balanced"
                ),
                pareto_solutions=pareto_front[:20]  # Return top 20 solutions
            )
        
        return OptimizationResult(
            success=False,
            objective_values={"error": "No Pareto solutions found"},
            raw_mix={},
            fuel_mix={},
            clinker_quality={},
            recommendations=["No feasible Pareto solutions found."]
        )
    
    async def _sensitivity_analysis(self, request: OptimizationRequest) -> OptimizationResult:
        """Perform sensitivity analysis"""
        base_solution = await self._single_objective_optimization(request)
        
        if not base_solution.success:
            return base_solution
        
        sensitivity_results = {}
        
        for param, variation in request.sensitivity_params.items():
            # Modify parameter and re-optimize
            modified_request = request.copy()
            
            if param in self.materials:
                # Modify material cost
                original_cost = self.materials[param].cost_per_ton
                self.materials[param].cost_per_ton *= (1 + variation)
                
                modified_solution = await self._single_objective_optimization(modified_request)
                
                if modified_solution.success:
                    cost_change = (modified_solution.objective_values["cost"] - 
                                 base_solution.objective_values["cost"]) / base_solution.objective_values["cost"]
                    sensitivity_results[param] = {
                        "parameter_change": variation,
                        "cost_impact": cost_change,
                        "new_cost": modified_solution.objective_values["cost"]
                    }
                
                # Restore original cost
                self.materials[param].cost_per_ton = original_cost
        
        base_solution.sensitivity_analysis = sensitivity_results
        return base_solution
    
    def _generate_random_solution(self) -> Tuple[Dict[str, float], Dict[str, float]]:
        """Generate random feasible raw mix and fuel mix"""
        # Generate raw mix
        raw_materials = list(self.materials.keys())
        raw_fractions = np.random.dirichlet(np.ones(len(raw_materials)))
        raw_mix = {material: float(fraction) for material, fraction in zip(raw_materials, raw_fractions)}
        
        # Generate fuel mix
        fuels = list(self.fuels.keys())
        fuel_fractions = np.random.dirichlet(np.ones(len(fuels)))
        fuel_mix = {fuel: float(fraction) for fuel, fraction in zip(fuels, fuel_fractions)}
        
        return raw_mix, fuel_mix
    
    def _validate_constraints(self, solution: Tuple[Dict[str, float], Dict[str, float]], 
                            constraints: Dict[str, Any]) -> bool:
        """Validate solution against constraints"""
        raw_mix, fuel_mix = solution
        clinker_quality = self._calculate_clinker_quality(raw_mix, fuel_mix)
        
        # Default clinker quality constraints
        lsf_min = constraints.get("lsf_min", 92.0)
        lsf_max = constraints.get("lsf_max", 98.0)
        sm_min = constraints.get("sm_min", 2.3)
        sm_max = constraints.get("sm_max", 2.7)
        am_min = constraints.get("am_min", 1.3)
        am_max = constraints.get("am_max", 2.0)
        
        return (lsf_min <= clinker_quality["LSF"] <= lsf_max and
                sm_min <= clinker_quality["SM"] <= sm_max and
                am_min <= clinker_quality["AM"] <= am_max)
    
    def _calculate_clinker_quality(self, raw_mix: Dict[str, float], 
                                 fuel_mix: Dict[str, float]) -> Dict[str, float]:
        """Calculate clinker quality moduli including fuel ash contribution"""
        total_composition = {"CaO": 0, "SiO2": 0, "Al2O3": 0, "Fe2O3": 0}
        
        # Raw materials contribution
        for material, fraction in raw_mix.items():
            if material in self.materials:
                composition = self.materials[material].chemical_composition
                for oxide in total_composition:
                    total_composition[oxide] += fraction * composition.get(oxide, 0)
        
        # Fuel ash contribution (assuming 5% ash in clinker)
        ash_factor = 0.05
        for fuel, fraction in fuel_mix.items():
            if fuel in self.fuels:
                fuel_data = self.fuels[fuel]
                ash_composition = fuel_data.ash_composition
                ash_contribution = fraction * fuel_data.ash_content / 100 * ash_factor
                
                for oxide in total_composition:
                    total_composition[oxide] += ash_contribution * ash_composition.get(oxide, 0) / 100
        
        # Calculate moduli
        cao = total_composition["CaO"]
        sio2 = total_composition["SiO2"]
        al2o3 = total_composition["Al2O3"]
        fe2o3 = total_composition["Fe2O3"]
        
        lsf = cao / (2.8 * sio2 + 1.2 * al2o3 + 0.65 * fe2o3) * 100 if sio2 + al2o3 + fe2o3 > 0 else 0
        sm = sio2 / (al2o3 + fe2o3) if al2o3 + fe2o3 > 0 else 0
        am = al2o3 / fe2o3 if fe2o3 > 0 else 0
        
        return {"LSF": lsf, "SM": sm, "AM": am, **total_composition}
    
    def _calculate_cost(self, raw_mix: Dict[str, float], fuel_mix: Dict[str, float], 
                       capacity: float) -> float:
        """Calculate production cost per ton of clinker"""
        cost = 0.0
        
        # Raw materials cost
        for material, fraction in raw_mix.items():
            if material in self.materials:
                cost += fraction * self.materials[material].cost_per_ton
        
        # Fuel cost (assuming 100 kg fuel per ton clinker)
        fuel_consumption = 0.1  # tons fuel per ton clinker
        for fuel, fraction in fuel_mix.items():
            if fuel in self.fuels:
                cost += fraction * fuel_consumption * self.fuels[fuel].cost_per_ton
        
        return cost
    
    def _calculate_emissions(self, raw_mix: Dict[str, float], fuel_mix: Dict[str, float], 
                           capacity: float) -> float:
        """Calculate CO2 emissions per ton of clinker"""
        emissions = 0.0
        
        # Raw materials emissions
        for material, fraction in raw_mix.items():
            if material in self.materials:
                emissions += fraction * self.materials[material].co2_factor
        
        # Fuel emissions (assuming 100 kg fuel per ton clinker)
        fuel_consumption = 0.1  # tons fuel per ton clinker
        for fuel, fraction in fuel_mix.items():
            if fuel in self.fuels:
                emissions += fraction * fuel_consumption * self.fuels[fuel].co2_factor
        
        return emissions
    
    def _evaluate_objective(self, solution: Tuple[Dict[str, float], Dict[str, float]], 
                          objective: str) -> float:
        """Evaluate objective function"""
        raw_mix, fuel_mix = solution
        cost = self._calculate_cost(raw_mix, fuel_mix, 3000)
        emissions = self._calculate_emissions(raw_mix, fuel_mix, 3000)
        
        if objective == "cost":
            return cost
        elif objective == "emissions":
            return emissions
        elif objective == "balanced":
            # Normalize and combine (assuming cost ~100, emissions ~1)
            return cost / 100 + emissions
        else:
            return cost + emissions
    
    def _filter_pareto_front(self, solutions: List[Dict]) -> List[Dict]:
        """Filter solutions to get Pareto front"""
        pareto_front = []
        
        for solution in solutions:
            is_dominated = False
            
            for other in solutions:
                if (other["cost"] <= solution["cost"] and other["emissions"] <= solution["emissions"] and
                    (other["cost"] < solution["cost"] or other["emissions"] < solution["emissions"])):
                    is_dominated = True
                    break
            
            if not is_dominated:
                pareto_front.append(solution)
        
        return sorted(pareto_front, key=lambda x: x["cost"])
    
    def _generate_recommendations(self, raw_mix: Dict[str, float], fuel_mix: Dict[str, float], 
                                clinker_quality: Dict[str, float], objective: str) -> List[str]:
        """Generate optimization recommendations"""
        recommendations = []
        
        # Quality recommendations
        lsf = clinker_quality["LSF"]
        if lsf < 94:
            recommendations.append("Consider increasing limestone content to improve LSF")
        elif lsf > 96:
            recommendations.append("Consider reducing limestone content to optimize LSF")
        
        # Cost recommendations
        if objective in ["cost", "balanced"]:
            # Find most expensive materials
            expensive_materials = [(mat, frac) for mat, frac in raw_mix.items() 
                                 if frac > 0.1 and self.materials[mat].cost_per_ton > 30]
            if expensive_materials:
                recommendations.append(f"Consider reducing {expensive_materials[0][0]} usage to lower costs")
        
        # Environmental recommendations
        if objective in ["emissions", "balanced"]:
            high_emission_fuels = [(fuel, frac) for fuel, frac in fuel_mix.items() 
                                 if frac > 0.2 and self.fuels[fuel].co2_factor > 2.0]
            if high_emission_fuels:
                recommendations.append(f"Consider increasing biomass usage to reduce CO2 emissions")
        
        # Alternative fuel recommendations
        biomass_fraction = fuel_mix.get("biomass", 0)
        if biomass_fraction < 0.3:
            recommendations.append("Increase biomass usage up to 30% for better sustainability")
        
        if not recommendations:
            recommendations.append("Current mix appears well-optimized for the selected objective")
        
        return recommendations

# FastAPI Application
app = FastAPI(title="CementOptimizer TSR", version="1.0.0")
tsr = CementOptimizerTSR()

@app.post("/optimize", response_model=OptimizationResult)
async def optimize_cement_production(request: OptimizationRequest):
    """Main optimization endpoint"""
    return await tsr.optimize_production(request)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/materials")
async def get_materials():
    """Get available materials and fuels"""
    return {
        "materials": {name: {
            "cost_per_ton": mat.cost_per_ton,
            "co2_factor": mat.co2_factor,
            "availability": mat.availability
        } for name, mat in tsr.materials.items()},
        "fuels": {name: {
            "cost_per_ton": fuel.cost_per_ton,
            "co2_factor": fuel.co2_factor,
            "calorific_value": fuel.calorific_value,
            "availability": fuel.availability
        } for name, fuel in tsr.fuels.items()}
    }

async def main():
    """Main function for testing"""
    print("🏭 CementOptimizer TSR Starting...")
    
    # Test optimization
    test_request = OptimizationRequest(
        plant_capacity=3000,
        objective="balanced",
        constraints={"lsf_min": 92, "lsf_max": 98}
    )
    
    result = await tsr.optimize_production(test_request)
    
    if result.success:
        print(f"✅ Optimization successful!")
        print(f"Cost: ${result.objective_values['cost']:.2f}/ton")
        print(f"Emissions: {result.objective_values['emissions']:.2f} kg CO2/ton")
        print(f"LSF: {result.clinker_quality['LSF']:.1f}%")
        print(f"Recommendations: {len(result.recommendations)}")
    else:
        print(f"❌ Optimization failed: {result.objective_values}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        asyncio.run(main())
    else:
        uvicorn.run(app, host="0.0.0.0", port=8001)