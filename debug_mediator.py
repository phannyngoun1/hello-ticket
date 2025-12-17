
import sys
import os

# Add backend directory to python path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.shared.container import setup_container, setup_mediator
from app.application.inventory.handlers_goods_receipt import GoodsReceiptCommandHandler
from app.shared.mediator import Mediator

async def main():
    print("Setting up container...")
    container = setup_container()
    
    print("Setting up mediator...")
    mediator = setup_mediator(container)
    
    print("Resolving GoodsReceiptCommandHandler...")
    handler = container.resolve(GoodsReceiptCommandHandler)
    
    print(f"Handler instance: {handler}")
    print(f"Handler mediator: {handler._mediator}")
    
    if handler._mediator is None:
        print("FAIL: Mediator is None!")
    else:
        print("SUCCESS: Mediator is injected.")
        
    # Check if correct mediator
    if handler._mediator is mediator:
        print("SUCCESS: Injected mediator matches global mediator.")
    else:
        print("FAIL: Injected mediator is different instance.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
