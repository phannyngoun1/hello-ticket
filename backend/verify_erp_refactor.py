import asyncio
import logging
import sys
from app.infrastructure.integrations.erp_integrations import IntegrationService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verification")

async def main():
    logger.info("Starting verification...")
    
    service = IntegrationService()
    
    configs = {
        "sap_test": {
            "type": "sap",
            "base_url": "https://sap.example.com",
            "username": "user",
            "password": "pass",
            "client_id": "123"
        },
        "oracle_test": {
            "type": "oracle_erp",
            "connection_string": "oracle://localhost:1521/db",
            "username": "user",
            "password": "pass"
        },
        "salesforce_test": {
            "type": "salesforce",
            "instance_url": "https://na1.salesforce.com",
            "access_token": "token"
        },
        "shopify_test": {
            "type": "shopify",
            "shop_domain": "shop.myshopify.com",
            "access_token": "token"
        }
    }
    
    logger.info("Registering integrations...")
    await service.register_integrations(configs)
    
    logger.info("Sending messages...")
    for name in configs:
        success = await service.send_to_integration(
            name,
            "TEST_MSG",
            {"data": "test"}
        )
        if not success:
            logger.error(f"Failed to send to {name}")
            sys.exit(1)
            
    logger.info("Checking health...")
    health = await service.health_check_all()
    if not all(health.values()):
        logger.error(f"Health check failed: {health}")
        sys.exit(1)
        
    logger.info("Shutting down...")
    await service.shutdown()
    
    logger.info("Verification successful!")

if __name__ == "__main__":
    asyncio.run(main())
