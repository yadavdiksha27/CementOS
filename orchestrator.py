"""
Orchestrator Agent for Multi-Agent Cement Production Optimization System
Simplified async implementation with Gemini Pro integration and function calling.
"""

import asyncio
import json
import logging
import os
import re
from typing import Dict, List, Optional, Any
from datetime import datetime

import requests
import vertexai
from vertexai.generative_models import GenerativeModel, FunctionDeclaration, Tool, Part
from google.oauth2 import service_account

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OrchestratorAgent:
    """Central orchestrator for cement optimization system"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.session_context = {}
        self.tsr_endpoint = "http://localhost:8001"
        
        # Initialize Vertex AI
        self._initialize_vertex_ai()
        
        # Define function declarations for Gemini
        self.function_declarations = [
            FunctionDeclaration(
                name="optimize_cement_production",
                description="Optimize cement production for cost, emissions, or balanced objectives",
                parameters={
                    "type": "object",
                    "properties": {
                        "plant_capacity": {
                            "type": "number",
                            "description": "Plant capacity in tons per day (TPD)"
                        },
                        "objective": {
                            "type": "string",
                            "description": "Optimization objective: cost, emissions, balanced, or pareto",
                            "enum": ["cost", "emissions", "balanced", "pareto"]
                        },
                        "constraints": {
                            "type": "object",
                            "description": "Quality constraints for clinker (LSF, SM, AM ranges)"
                        }
                    },
                    "required": ["plant_capacity", "objective"]
                }
            ),
            FunctionDeclaration(
                name="sensitivity_analysis",
                description="Perform sensitivity analysis for parameter variations",
                parameters={
                    "type": "object",
                    "properties": {
                        "plant_capacity": {
                            "type": "number",
                            "description": "Plant capacity in TPD"
                        },
                        "base_objective": {
                            "type": "string",
                            "description": "Base optimization objective"
                        },
                        "parameters": {
                            "type": "object",
                            "description": "Parameters to vary with their percentage changes"
                        }
                    },
                    "required": ["plant_capacity", "parameters"]
                }
            ),
            FunctionDeclaration(
                name="get_cement_industry_info",
                description="Get general information about cement production, processes, or industry best practices",
                parameters={
                    "type": "object",
                    "properties": {
                        "topic": {
                            "type": "string",
                            "description": "Topic to get information about"
                        }
                    },
                    "required": ["topic"]
                }
            )
        ]
        
        # Create tool with function declarations
        self.cement_tool = Tool(function_declarations=self.function_declarations)
        
        # Initialize Gemini model
        self.model = GenerativeModel(
            "gemini-2.0-flash-lite",
            tools=[self.cement_tool],
            system_instruction="""You are CementOptiMax, an expert Technical Support Representative for cement production optimization. 

Your capabilities:
- Multi-objective optimization for cost and CO2 emissions
- Chemical quality constraint management (LSF, SM, AM moduli)
- Alternative fuel integration and analysis
- Sensitivity analysis for parameter variations
- Pareto front analysis for trade-off visualization

Always provide actionable recommendations and explain technical concepts clearly. Use function calls when users request optimization, analysis, or specific calculations. For general cement industry questions, provide informative responses based on your knowledge."""
        )
    
    def _initialize_vertex_ai(self):
        """Initialize Vertex AI with service account credentials"""
        try:
            # Try to load from environment variables first (better for Cloud Run)
            project_id = os.getenv('GOOGLE_CLOUD_PROJECT', 'mistri-472714')
            
            # Initialize Vertex AI with project ID
            vertexai.init(project=project_id, location="us-central1")
            
            # Initialize the model
            self.model = GenerativeModel("gemini-1.5-flash-002")
            
            logger.info("Vertex AI initialized successfully with Gemini credentials")
            return
            
        except Exception as e:
            logger.warning(f"Environment-based initialization failed: {e}")
            
        try:
            # Fallback: Load credentials from config.json (use relative path for container compatibility)
            config_path = os.path.join(os.path.dirname(__file__), 'config.json')
            if not os.path.exists(config_path):
                # Try current directory
                config_path = 'config.json'
            
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            # Use the specific gemini section from the config
            # Gemini uses Vertex AI under the hood, so we use these credentials
            if 'gemini' in config:
                gemini_config = config['gemini']
                credentials = service_account.Credentials.from_service_account_info(gemini_config)
                
                # Initialize Vertex AI
                vertexai.init(
                    project="mistri-472714",
                    location="us-central1",
                    credentials=credentials
                )
                
                self.logger.info("Vertex AI initialized successfully with Gemini credentials")
            else:
                raise ValueError("gemini configuration not found in config.json")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Vertex AI: {str(e)}")
            raise
    
    async def process_query(self, user_query: str, session_id: str = "default") -> str:
        """Process user query with intent classification and response generation"""
        try:
            self.logger.info(f"Processing query: {user_query[:100]}...")
            
            # Update session context
            if session_id not in self.session_context:
                self.session_context[session_id] = {
                    "conversation_history": [],
                    "last_optimization": None,
                    "user_preferences": {}
                }
            
            context = self.session_context[session_id]
            context["conversation_history"].append({"user": user_query, "timestamp": datetime.now()})
            
            # Classify intent and generate response
            intent = self._classify_intent(user_query)
            self.logger.info(f"Classified intent: {intent}")
            
            if intent == "tsr_optimization":
                response = await self._handle_with_gemini(user_query, context)
            elif intent == "quality_control":
                response = await self._handle_quality_control(user_query, context)
            elif intent == "general_info":
                response = await self._handle_general_query(user_query, context)
            else:
                response = await self._handle_with_gemini(user_query, context)
            
            # Update conversation history
            context["conversation_history"].append({"assistant": response, "timestamp": datetime.now()})
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error processing query: {str(e)}")
            return f"I apologize, but I encountered an error processing your request: {str(e)}. Please try again or rephrase your question."
    
    def _classify_intent(self, query: str) -> str:
        """Simple regex-based intent classification"""
        query_lower = query.lower()
        
        # Intent classification patterns
        self.intent_patterns = {
            'tsr_optimization': [
                r'optimi[sz]e|minimi[sz]e|maximi[sz]e',
                r'cost|price|expense',
                r'emission|co2|carbon',
                r'fuel|biomass|coal|petcoke',
                r'raw\s+mix|material',
                r'clinker|cement\s+production',
                r'lsf|lime\s+saturation',
                r'pareto|trade.?off',
                r'sensitivity|what\s+if',
                r'plant\s+capacity|tpd|tons?\s+per\s+day'
            ],
            'quality_control': [
                r'quality|f.?cao|free\s+cao|calcium\s+oxide',
                r'thermal\s+image|grate\s+cooler|flying\s+ash',
                r'abnormal\s+condition|operating\s+condition',
                r'dcs\s+data|control\s+system',
                r'image\s+classif|resnet|xgboost',
                r'predict\s+quality|quality\s+predict',
                r'clinker\s+quality|cement\s+quality',
                r'temperature\s+monitoring|thermal\s+analysis',
                r'analyze|detect|alert|prediction confidence'
            ],
            'general_info': [
                r'what\s+is|explain|describe|tell\s+me\s+about',
                r'how\s+does|how\s+to|process',
                r'difference|compare|versus',
                r'factors|affect|impact',
                r'reduce|improve|increase'
            ]
        }
        
        # Check each intent pattern
        matched_intent = None
        matched_pattern = None
        
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, query_lower):
                    self.logger.info(f"Intent matched: {intent} (pattern: {pattern})")
                    
                    # Quality control has higher priority than TSR if both match
                    if intent == 'quality_control' or matched_intent is None:
                        matched_intent = intent
                        matched_pattern = pattern
                    
                    # Don't break here, continue checking to find the best match
        
        # If we found a match, return it
        if matched_intent:
            self.logger.info(f"Final intent classification: {matched_intent} (matched pattern: {matched_pattern})")
            return matched_intent
        
        # If no specific pattern matches, check if it's a quality-related query
        quality_terms = ['quality', 'cao', 'thermal', 'image', 'predict', 'abnormal', 'flying ash', 'dcs']
        for term in quality_terms:
            if term in query_lower:
                self.logger.info(f"Quality term found in query: {term}")
                return "quality_control"
        
        # Default to general info for unclassified queries
        self.logger.info("No specific intent matched, defaulting to general_info")
        return "general_info"
    
    async def _handle_with_gemini(self, query: str, context: Dict) -> str:
        """Handle query using Gemini with function calling"""
        try:
            # Prepare conversation history for context
            history_context = ""
            if context["conversation_history"]:
                recent_history = context["conversation_history"][-4:]  # Last 2 exchanges
                for entry in recent_history:
                    if "user" in entry:
                        history_context += f"User: {entry['user']}\n"
                    elif "assistant" in entry:
                        history_context += f"Assistant: {entry['assistant'][:200]}...\n"
            
            # Create prompt with context
            prompt = f"""Previous conversation context:
{history_context}

Current user query: {query}

Please help the user with their cement production optimization needs. Use the available functions when appropriate for optimization tasks, sensitivity analysis, or technical calculations."""
            
            # Generate response with Gemini
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            # Handle function calls if present
            if response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'function_call') and part.function_call:
                        function_response = await self._execute_function_call(part.function_call)
                        
                        # Generate follow-up response with function results
                        follow_up_prompt = f"""The user asked: {query}

Function call results: {function_response}

Please provide a comprehensive response to the user based on these results, including:
1. Summary of the optimization results
2. Key recommendations
3. Explanation of trade-offs if applicable
4. Next steps or additional analysis suggestions

Format the response in a user-friendly way with clear sections and actionable insights."""
                        
                        final_response = await asyncio.to_thread(
                            self.model.generate_content,
                            follow_up_prompt
                        )
                        
                        return final_response.text
            
            return response.text
            
        except Exception as e:
            self.logger.error(f"Error in Gemini handling: {str(e)}")
            return f"I encountered an error while processing your request. Please try rephrasing your question or contact support if the issue persists."
    
    async def _execute_function_call(self, function_call) -> Dict[str, Any]:
        """Execute function calls from Gemini"""
        function_name = function_call.name
        args = dict(function_call.args)
        
        self.logger.info(f"Executing function: {function_name} with args: {args}")
        
        try:
            if function_name == "optimize_cement_production":
                return await self._call_tsr_optimization(args)
            elif function_name == "sensitivity_analysis":
                return await self._call_tsr_sensitivity(args)
            elif function_name == "get_cement_industry_info":
                return await self._get_industry_info(args)
            else:
                return {"error": f"Unknown function: {function_name}"}
                
        except Exception as e:
            self.logger.error(f"Function execution error: {str(e)}")
            return {"error": f"Function execution failed: {str(e)}"}
    
    async def _call_tsr_optimization(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Call TSR optimization service"""
        try:
            # Prepare request payload
            payload = {
                "plant_capacity": args.get("plant_capacity", 3000),
                "objective": args.get("objective", "balanced"),
                "constraints": args.get("constraints", {})
            }
            
            # Make async HTTP request to TSR service
            response = await asyncio.to_thread(
                requests.post,
                f"{self.tsr_endpoint}/optimize",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                self.logger.info("TSR optimization completed successfully")
                return result
            else:
                self.logger.error(f"TSR service error: {response.status_code}")
                return {"error": f"TSR service returned error: {response.status_code}"}
                
        except requests.exceptions.ConnectionError:
            self.logger.error("Cannot connect to TSR service")
            return {"error": "TSR service is not available. Please ensure the service is running on port 8001."}
        except Exception as e:
            self.logger.error(f"TSR call error: {str(e)}")
            return {"error": f"Failed to call TSR service: {str(e)}"}
    
    async def _call_tsr_sensitivity(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Call TSR sensitivity analysis"""
        try:
            payload = {
                "plant_capacity": args.get("plant_capacity", 3000),
                "objective": args.get("base_objective", "balanced"),
                "sensitivity_params": args.get("parameters", {})
            }
            
            response = await asyncio.to_thread(
                requests.post,
                f"{self.tsr_endpoint}/optimize",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"TSR service error: {response.status_code}"}
                
        except Exception as e:
            return {"error": f"Sensitivity analysis failed: {str(e)}"}
    
    async def _get_industry_info(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Provide cement industry information"""
        topic = args.get("topic", "").lower()
        
        info_database = {
            "cement production": "Cement production involves heating limestone and clay in a kiln at ~1450°C to form clinker, which is then ground with gypsum to make cement.",
            "clinker quality": "Clinker quality is measured by moduli: LSF (92-98%), SM (2.3-2.7), AM (1.3-2.0). These control cement strength and setting properties.",
            "alternative fuels": "Alternative fuels like biomass, tire-derived fuel, and waste can replace up to 60% of fossil fuels, reducing CO2 emissions significantly.",
            "co2 emissions": "Cement production generates ~0.8-1.0 tons CO2 per ton cement, from limestone calcination (~60%) and fuel combustion (~40%).",
            "optimization": "Multi-objective optimization balances production cost and environmental impact while maintaining quality constraints."
        }
        
        # Find matching topic
        for key, value in info_database.items():
            if key in topic or any(word in topic for word in key.split()):
                return {"topic": key, "information": value}
        
        return {"topic": topic, "information": "General cement production involves raw material preparation, clinker burning, and final grinding to produce cement."}
    
    async def _handle_quality_control(self, query: str, context: Dict) -> str:
        """Handle quality control queries"""
        try:
            # Use Gemini for quality control responses
            quality_model = GenerativeModel(
                "gemini-2.0-flash-lite",
                system_instruction="""You are a quality control expert in the cement industry. Provide informative, accurate responses about quality control, thermal imaging, and clinker quality. Keep responses concise but comprehensive."""
            )
            
            response = await asyncio.to_thread(
                quality_model.generate_content,
                query
            )
            
            return response.text
            
        except Exception as e:
            self.logger.error(f"Error in quality control handling: {str(e)}")
            return "I can help you with quality control questions. Please try rephrasing your question or ask about specific topics like thermal imaging or clinker quality."
    
    async def _handle_general_query(self, query: str, context: Dict) -> str:
        """Handle general cement industry queries"""
        try:
            # Use Gemini for general responses without function calling
            general_model = GenerativeModel(
                "gemini-2.0-flash-lite",
                system_instruction="""You are a cement industry expert. Provide informative, accurate responses about cement production, processes, chemistry, and industry practices. Keep responses concise but comprehensive."""
            )
            
            response = await asyncio.to_thread(
                general_model.generate_content,
                query
            )
            
            return response.text
            
        except Exception as e:
            self.logger.error(f"Error in general query handling: {str(e)}")
            return "I can help you with cement production questions. Please try rephrasing your question or ask about specific topics like optimization, clinker quality, or alternative fuels."

async def main():
    """Main function for testing the orchestrator - REMOVED FOR PRODUCTION"""
    print("🤖 CementOptiMax Orchestrator - Production Mode")
    print("Use main.py to start the full CementOS system")
    print("This file is now imported as a module by main.py")

if __name__ == "__main__":
    # In production, this should not be run directly
    # Use main.py instead
    print("⚠️  Please run 'python main.py' to start the CementOS system")
    print("This orchestrator is designed to be imported as a module.")
