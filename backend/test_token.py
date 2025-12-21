#!/usr/bin/env python3
"""
Quick test to verify token from frontend and decode it
"""
import sys
sys.path.append("/Users/ngounphanny/dev/envs/projects/ticket-system/backend")

from jose import jwt, JWTError
import os

# Set the secret key from environment or default
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")

def test_token(token_string):
    """Test if a token can be decoded"""
    print(f"Testing token: {token_string[:30]}...")
    print(f"Token length: {len(token_string)}")
    print(f"Using SECRET_KEY (first 10 chars): {SECRET_KEY[:10]}...")
    
    try:
        # Try to decode without verification first
        unverified = jwt.get_unverified_claims(token_string)
        print(f"\nUnverified claims: {unverified}")
        
        # Now try with verification
        verified = jwt.decode(token_string, SECRET_KEY, algorithms=["HS256"])
        print(f"\nVerified claims: {verified}")
        print("\n✅ TOKEN IS VALID!")
        return True
    except JWTError as e:
        print(f"\n❌ JWT Error: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_token.py <YOUR_TOKEN_HERE>")
        print("\nAlternatively, paste your token when prompted:")
        token = input("Token: ").strip()
    else:
        token = sys.argv[1].strip()
    
    if not token:
        print("Error: No token provided")
        sys.exit(1)
    
    test_token(token)
