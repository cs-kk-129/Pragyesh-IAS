#!/usr/bin/env python3
"""
Integrated UPSC Evaluation System Startup Script
Starts both the Node.js frontend and FastAPI evaluation backend
"""

import subprocess
import sys
import time
import os
import signal
from pathlib import Path

# Fix Windows console encoding for Unicode characters
if os.name == 'nt':  # Windows
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

def check_requirements():
    """Check if required dependencies are available"""
    print("Checking system requirements...")
    
    # Check Node.js
    try:
        subprocess.run(["node", "--version"], check=True, capture_output=True, shell=True)
        print("✓ Node.js is available")
    except subprocess.CalledProcessError:
        print("✗ Node.js is not installed or not in PATH")
        return False
    
    # Check Python
    try:
        subprocess.run([sys.executable, "--version"], check=True, capture_output=True)
        print("✓ Python is available")
    except subprocess.CalledProcessError:
        print("✗ Python is not available")
        return False
    
    # Check if backend directory exists
    if not Path("backend").exists():
        print("✗ Backend directory not found")
        return False
    
    print("✓ All requirements met")
    return True

def start_fastapi_backend():
    """Start the FastAPI evaluation backend"""
    print("Starting FastAPI evaluation backend...")
    
    # Change to backend directory
    backend_dir = Path("backend")
    
    # Start FastAPI server with real-time output
    env = os.environ.copy()
    env["PYTHONPATH"] = str(backend_dir.absolute())
    
    try:
        process = subprocess.Popen(
            [sys.executable, "run_backend.py"],
            cwd=backend_dir,
            env=env,
            creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == 'nt' else 0
        )
        
        # Wait a moment for server to start
        time.sleep(5)
        
        if process.poll() is None:
            print("✓ FastAPI backend started on http://localhost:8001")
            return process
        else:
            print("✗ Failed to start FastAPI backend")
            return None
            
    except Exception as e:
        print(f"✗ Error starting backend: {e}")
        return None

def start_nodejs_frontend():
    """Start the Node.js frontend"""
    print("Starting Node.js frontend...")
    
    try:
        # On Windows, use npm.cmd and create new console
        if os.name == 'nt':
            process = subprocess.Popen(
                ["npm", "run", "dev"],
                shell=True,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:
            process = subprocess.Popen(["npm", "run", "dev"])
        
        # Wait a moment for server to start
        time.sleep(5)
        
        if process.poll() is None:
            print("✓ Node.js frontend started on http://localhost:5000")
            return process
        else:
            print("✗ Failed to start Node.js frontend")
            return None
            
    except Exception as e:
        print(f"✗ Error starting frontend: {e}")
        return None

def cleanup_processes(processes):
    """Clean up running processes"""
    print("\nShutting down services...")
    for process in processes:
        if process and process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
    print("All services stopped.")

def main():
    """Main startup routine"""
    print("Starting Integrated UPSC Evaluation System")
    print("=" * 50)
    
    if not check_requirements():
        print("Please install missing requirements and try again.")
        sys.exit(1)
    
    processes = []
    
    try:
        # Start FastAPI backend
        backend_process = start_fastapi_backend()
        if backend_process:
            processes.append(backend_process)
        
        # Start Node.js frontend
        frontend_process = start_nodejs_frontend()
        if frontend_process:
            processes.append(frontend_process)
        
        if not processes:
            print("Failed to start any services.")
            sys.exit(1)
        
        print("\n" + "=" * 50)
        print("System Ready!")
        print("Frontend: http://localhost:5000")
        print("Backend API: http://localhost:8001")
        print("API Docs: http://localhost:8001/docs")
        print("\nFeatures Available:")
        print("- Advanced mock test evaluation with AI recommendations")
        print("- PDF report generation with detailed analysis")  
        print("- Subject-wise and topic-wise performance tracking")
        print("- Time management analysis")
        print("- Personalized study recommendations")
        print("\nPress Ctrl+C to stop all services")
        print("=" * 50)
        
        # Keep running until interrupted
        while True:
            time.sleep(1)
            # Check if processes are still running
            running = [p for p in processes if p and p.poll() is None]
            if not running:
                print("All services have stopped.")
                break
    
    except KeyboardInterrupt:
        print("\nReceived shutdown signal...")
    except Exception as e:
        print(f"\nUnexpected error: {e}")
    finally:
        cleanup_processes(processes)

if __name__ == "__main__":
    main()