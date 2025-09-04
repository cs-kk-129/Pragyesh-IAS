#!/usr/bin/env python3
"""
Debug version of startup script - shows detailed output
"""

import subprocess
import sys
import time
import os
from pathlib import Path

def test_backend():
    """Test backend startup separately"""
    print("Testing backend startup...")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return False
    
    # Check if main.py exists
    main_file = backend_dir / "main.py"
    if not main_file.exists():
        print("❌ backend/main.py not found")
        return False
    
    print("✓ Backend files exist")
    
    # Try to import and check for errors
    try:
        env = os.environ.copy()
        env["PYTHONPATH"] = str(backend_dir.absolute())
        
        result = subprocess.run(
            [sys.executable, "-c", "import main; print('Import successful')"],
            cwd=backend_dir,
            env=env,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✓ Backend imports successfully")
        else:
            print("❌ Backend import error:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Error testing backend: {e}")
        return False
    
    return True

def test_frontend():
    """Test frontend startup separately"""
    print("\nTesting frontend...")
    
    # Check if package.json exists
    if not Path("package.json").exists():
        print("❌ package.json not found")
        return False
    
    print("✓ package.json exists")
    
    # Check if node_modules exists
    if not Path("node_modules").exists():
        print("❌ node_modules not found - run 'npm install'")
        return False
    
    print("✓ node_modules exists")
    
    # Test npm command
    try:
        result = subprocess.run(
            ["npm", "--version"],
            capture_output=True,
            text=True,
            shell=True
        )
        
        if result.returncode == 0:
            print(f"✓ npm version: {result.stdout.strip()}")
        else:
            print("❌ npm not working")
            return False
            
    except Exception as e:
        print(f"❌ Error testing npm: {e}")
        return False
    
    return True

def start_services_step_by_step():
    """Start services one by one with detailed output"""
    print("\n" + "="*50)
    print("Starting services step by step...")
    
    # Start backend first
    print("\n1. Starting backend...")
    try:
        backend_process = subprocess.Popen(
            [sys.executable, "run_backend.py"],
            cwd="backend",
            creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == 'nt' else 0
        )
        
        print("   Backend process started, waiting 7 seconds...")
        time.sleep(7)
        
        if backend_process.poll() is None:
            print("   ✓ Backend is running")
        else:
            print("   ❌ Backend stopped unexpectedly")
            return
            
    except Exception as e:
        print(f"   ❌ Failed to start backend: {e}")
        return
    
    # Start frontend
    print("\n2. Starting frontend...")
    try:
        frontend_process = subprocess.Popen(
            ["npm", "run", "dev"],
            shell=True,
            creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == 'nt' else 0
        )
        
        print("   Frontend process started, waiting 7 seconds...")
        time.sleep(7)
        
        if frontend_process.poll() is None:
            print("   ✓ Frontend is running")
        else:
            print("   ❌ Frontend stopped unexpectedly")
            return
            
    except Exception as e:
        print(f"   ❌ Failed to start frontend: {e}")
        return
    
    print("\n" + "="*50)
    print("✓ Both services should now be running!")
    print("Frontend: http://localhost:5000")
    print("Backend: http://localhost:8001")
    print("API Docs: http://localhost:8001/docs")
    print("\nPress Ctrl+C to stop...")
    
    try:
        while True:
            time.sleep(1)
            # Check if processes are still running
            if backend_process.poll() is not None:
                print("❌ Backend process stopped!")
                break
            if frontend_process.poll() is not None:
                print("❌ Frontend process stopped!")
                break
    except KeyboardInterrupt:
        print("\nShutting down...")
        if backend_process.poll() is None:
            backend_process.terminate()
        if frontend_process.poll() is None:
            frontend_process.terminate()

def main():
    print("🔍 Debug Startup Script")
    print("="*50)
    
    # Test backend
    if not test_backend():
        print("\n❌ Backend test failed. Fix backend issues first.")
        return
    
    # Test frontend
    if not test_frontend():
        print("\n❌ Frontend test failed. Fix frontend issues first.")
        return
    
    print("\n✓ All tests passed!")
    
    # Start services
    start_services_step_by_step()

if __name__ == "__main__":
    main()