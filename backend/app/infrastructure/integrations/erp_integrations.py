"""
ERP-specific integration adapters
"""
import logging
import json
import asyncio
from typing import Any, Dict, List, Optional, Type
from pydantic import BaseModel, Field

from app.infrastructure.integrations.base import (
    IntegrationAdapter,
    IntegrationMessage,
    MessageStatus
)

logger = logging.getLogger(__name__)

# --- Configuration Models ---

class BaseIntegrationConfig(BaseModel):
    """Base configuration for all integrations"""
    type: str

class SAPConfig(BaseIntegrationConfig):
    """SAP integration configuration"""
    base_url: str
    username: str
    password: str
    client_id: str

class OracleConfig(BaseIntegrationConfig):
    """Oracle ERP integration configuration"""
    connection_string: str
    username: str
    password: str

class SalesforceConfig(BaseIntegrationConfig):
    """Salesforce integration configuration"""
    instance_url: str
    access_token: str
    api_version: str = "v57.0"

class ShopifyConfig(BaseIntegrationConfig):
    """Shopify integration configuration"""
    shop_domain: str
    access_token: str
    api_version: str = "2023-10"


# --- Base Adapter ---

class BaseERPAdapter(IntegrationAdapter):
    """Base class for ERP adapters to handle common logging and error handling"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.logger = logger
        self.system_name = "Unknown"

    async def connect(self) -> bool:
        """Connect to system"""
        try:
            self.logger.info(f"Connecting to {self.system_name}...")
            await self._perform_connect()
            self.logger.info(f"Connected to {self.system_name}")
            return True
        except Exception as e:
            self.logger.error(f"{self.system_name} connection failed: {e}")
            return False

    async def disconnect(self) -> None:
        """Disconnect from system"""
        self.logger.info(f"Disconnecting from {self.system_name}")

    async def send_message(self, message: IntegrationMessage) -> bool:
        """Send message to system"""
        try:
            self.logger.info(f"Sending message to {self.system_name}: {message.message_type}")
            self.logger.debug(f"Payload: {json.dumps(message.payload, indent=2)}")
            
            await self._perform_send(message)
            
            message.status = MessageStatus.COMPLETED
            return True
        except Exception as e:
            self.logger.error(f"{self.system_name} send failed: {e}")
            message.status = MessageStatus.FAILED
            message.error_message = str(e)
            return False

    async def receive_messages(self) -> List[IntegrationMessage]:
        """Receive messages from system"""
        return []

    async def health_check(self) -> bool:
        """Check system health"""
        try:
            await asyncio.sleep(0.05)
            return True
        except Exception:
            return False

    async def _perform_connect(self):
        """Actual connection logic to be implemented by subclasses"""
        await asyncio.sleep(0.1)

    async def _perform_send(self, message: IntegrationMessage):
        """Actual send logic to be implemented by subclasses"""
        await asyncio.sleep(0.1)


# --- Specific Adapters ---

class SAPIntegrationAdapter(BaseERPAdapter):
    """SAP ERP integration adapter"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.cfg = SAPConfig(**config)
        self.system_name = f"SAP ({self.cfg.base_url})"

class OracleERPIntegrationAdapter(BaseERPAdapter):
    """Oracle ERP integration adapter"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.cfg = OracleConfig(**config)
        self.system_name = "Oracle ERP"

class SalesforceIntegrationAdapter(BaseERPAdapter):
    """Salesforce CRM integration adapter"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.cfg = SalesforceConfig(**config)
        self.system_name = f"Salesforce ({self.cfg.instance_url})"

class ShopifyIntegrationAdapter(BaseERPAdapter):
    """Shopify e-commerce integration adapter"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.cfg = ShopifyConfig(**config)
        self.system_name = f"Shopify ({self.cfg.shop_domain})"


# --- Service ---

class IntegrationService:
    """Service for managing ERP integrations"""
    
    def __init__(self):
        self.adapters: Dict[str, IntegrationAdapter] = {}
        self.message_queue: List[IntegrationMessage] = []
    
    async def register_integrations(self, configs: Dict[str, Dict[str, Any]]) -> None:
        """Register all integrations"""
        for name, config in configs.items():
            try:
                adapter = self._create_adapter(config)
                if adapter:
                    self.adapters[name] = adapter
                    await adapter.connect()
            except Exception as e:
                logger.error(f"Failed to register integration {name}: {e}")
    
    def _create_adapter(self, config: Dict[str, Any]) -> Optional[IntegrationAdapter]:
        """Create integration adapter based on type"""
        adapter_type = config.get("type")
        
        adapter_map: Dict[str, Type[BaseERPAdapter]] = {
            "sap": SAPIntegrationAdapter,
            "oracle_erp": OracleERPIntegrationAdapter,
            "salesforce": SalesforceIntegrationAdapter,
            "shopify": ShopifyIntegrationAdapter,
        }
        
        adapter_class = adapter_map.get(adapter_type)
        if adapter_class:
            return adapter_class(config)
        
        logger.warning(f"Unknown integration type: {adapter_type}")
        return None
    
    async def send_to_integration(
        self,
        integration_name: str,
        message_type: str,
        payload: Dict[str, Any]
    ) -> bool:
        """Send message to specific integration"""
        adapter = self.adapters.get(integration_name)
        if not adapter:
            logger.error(f"Integration {integration_name} not found")
            return False
        
        # Avoid circular import if possible, or keep local import
        from app.infrastructure.integrations.base import IntegrationMessage
        
        message = IntegrationMessage(
            message_id=f"msg_{len(self.message_queue)}",
            source_system="design_code_api",
            target_system=integration_name,
            message_type=message_type,
            payload=payload
        )
        self.message_queue.append(message) # Track message
        
        return await adapter.send_message(message)
    
    async def health_check_all(self) -> Dict[str, bool]:
        """Check health of all integrations"""
        results = {}
        for name, adapter in self.adapters.items():
            try:
                results[name] = await adapter.health_check()
            except Exception as e:
                results[name] = False
                logger.error(f"Health check failed for {name}: {e}")
        return results
    
    async def shutdown(self) -> None:
        """Shutdown all integrations"""
        for adapter in self.adapters.values():
            try:
                await adapter.disconnect()
            except Exception as e:
                logger.error(f"Error disconnecting adapter: {e}")
