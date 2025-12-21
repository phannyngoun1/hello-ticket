
import os
import sys
import asyncio
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError

# Add backend to path
sys.path.append(os.path.abspath("/Users/ngounphanny/dev/envs/projects/ticket-system/backend"))

# Mock environment if needed
if not os.getenv("SECRET_KEY"):
    os.environ["SECRET_KEY"] = "your-secret-key-change-in-production"

from app.infrastructure.shared.security.jwt_handler import JWTHandler

def test_jwt_flow():
    print("Testing JWT Flow...")
    handler = JWTHandler()
    
    # 1. Create Token
    user_id = "test-user-123"
    token = handler.create_access_token(subject=user_id)
    print(f"Generated Token: {token}")
    
    # 2. Verify Token
    try:
        verified_id = handler.verify_token(token)
        print(f"Verified ID: {verified_id}")
        if verified_id == user_id:
            print("SUCCESS: Token verified correctly.")
        else:
            print(f"FAILURE: ID mismatch. Expected {user_id}, got {verified_id}")
    except Exception as e:
        print(f"FAILURE: Exception during verification: {e}")

    # 3. Test Invalid Token
    invalid_token = token + "invalid"
    verified_id = handler.verify_token(invalid_token)
    print(f"Invalid Token Verification Result: {verified_id} (Expected None)")

    # 4. Test Expired Token
    short_handler = JWTHandler(access_token_expire_minutes=-1) # Expired immediately
    expired_token = short_handler.create_access_token(subject=user_id)
    verified_id = handler.verify_token(expired_token)
    print(f"Expired Token Verification Result: {verified_id} (Expected None)")

    # 5. Decode manually to see what's wrong if verification failed
    try:
        decoded = jwt.decode(token, handler._secret_key, algorithms=[handler._algorithm])
        print(f"Decoded manually: {decoded}")
    except Exception as e:
        print(f"Manual decode failed: {e}")

if __name__ == "__main__":
    test_jwt_flow()
