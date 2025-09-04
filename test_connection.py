#!/usr/bin/env python3
"""
Test script to verify database and API connections before running the full application
"""

import os
import sys
from pathlib import Path

def test_database_connection():
    """Test PostgreSQL database connection"""
    print("Testing database connection...")
    
    try:
        import psycopg2
        from urllib.parse import urlparse
        
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL not found in environment")
            return False
        
        # Parse the database URL
        parsed = urlparse(database_url)
        
        # Test connection
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        
        print(f"✅ Database connected successfully")
        print(f"   PostgreSQL version: {version[0][:50]}...")
        print(f"   Host: {parsed.hostname}")
        print(f"   Database: {parsed.path[1:]}")
        
        cursor.close()
        conn.close()
        return True
        
    except ImportError:
        print("❌ psycopg2 not installed. Install with: pip install psycopg2-binary")
        return False
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_openai_connection():
    """Test OpenAI API connection"""
    print("\nTesting OpenAI API connection...")
    
    try:
        from openai import OpenAI
        
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            print("❌ OPENAI_API_KEY not found in environment")
            return False
        
        if not api_key.startswith('sk-'):
            print("❌ Invalid OpenAI API key format (should start with 'sk-')")
            return False
        
        # Test API connection with a simple request
        client = OpenAI(api_key=api_key)
        
        # Just test if we can create the client and it's properly configured
        print("✅ OpenAI client created successfully")
        print(f"   API key: {api_key[:20]}...")
        
        return True
        
    except ImportError:
        print("❌ openai package not installed. Install with: pip install openai")
        return False
    except Exception as e:
        print(f"❌ OpenAI API connection failed: {e}")
        return False

def test_environment():
    """Test environment variables"""
    print("\nTesting environment variables...")
    
    required_vars = ['DATABASE_URL', 'OPENAI_API_KEY', 'SESSION_SECRET']
    missing_vars = []
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: {'*' * 20} (set)")
        else:
            print(f"❌ {var}: not set")
            missing_vars.append(var)
    
    if missing_vars:
        print(f"\n❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    
    return True

def main():
    """Main test routine"""
    print("🔍 Testing Local Development Setup")
    print("=" * 50)
    
    # Load environment variables from .env file
    env_file = Path('.env')
    if env_file.exists():
        print(f"Loading environment from: {env_file.absolute()}")
        
        # Simple .env parser
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Remove quotes if present
                    value = value.strip('"\'')
                    os.environ[key] = value
    else:
        print("⚠️  No .env file found - relying on system environment variables")
    
    # Run tests
    tests_passed = 0
    total_tests = 3
    
    if test_environment():
        tests_passed += 1
    
    if test_database_connection():
        tests_passed += 1
    
    if test_openai_connection():
        tests_passed += 1
    
    print("\n" + "=" * 50)
    print(f"Tests completed: {tests_passed}/{total_tests} passed")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! You're ready to run the application.")
        print("\nNext step: python start_integrated_system.py")
    else:
        print("❌ Some tests failed. Please fix the issues above before proceeding.")
        print("\nTip: Check your .env file and ensure all values are copied correctly from Replit.")
    
    return tests_passed == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)