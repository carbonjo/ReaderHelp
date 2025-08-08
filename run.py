#!/usr/bin/env python3
"""
ReaderHelp Startup Script
Checks for Ollama and starts the Flask application
"""

import os
import sys
import subprocess
import requests
import time

def check_ollama():
    """Check if Ollama is running and the model is available"""
    try:
        response = requests.get('http://localhost:11434/api/tags', timeout=5)
        if response.status_code == 200:
            models = response.json().get('models', [])
            gemma_model = any('gemma2:12b' in model.get('name', '') for model in models)
            
            if gemma_model:
                print("✅ Ollama is running and gemma2:12b model is available")
                return True
            else:
                print("⚠️  Ollama is running but gemma2:12b model is not found")
                print("   Run: ollama pull gemma2:12b")
                return False
        else:
            print("❌ Ollama is not responding")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Ollama is not running")
        print("   Please start Ollama first:")
        print("   1. Install Ollama from https://ollama.ai/download")
        print("   2. Start Ollama: ollama serve")
        print("   3. Pull the model: ollama pull gemma2:12b")
        return False
    except Exception as e:
        print(f"❌ Error checking Ollama: {e}")
        return False

def install_dependencies():
    """Install Python dependencies if needed"""
    try:
        import flask
        import llama_index
        print("✅ Python dependencies are installed")
        return True
    except ImportError:
        print("📦 Installing Python dependencies...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
            print("✅ Dependencies installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            return False

def main():
    """Main startup function"""
    print("🚀 Starting ReaderHelp...")
    print("=" * 50)
    
    # Check Python dependencies
    if not install_dependencies():
        print("❌ Failed to install dependencies. Please run: pip install -r requirements.txt")
        sys.exit(1)
    
    # Check Ollama
    if not check_ollama():
        print("\n📋 Setup Instructions:")
        print("1. Install Ollama: https://ollama.ai/download")
        print("2. Start Ollama: ollama serve")
        print("3. Pull the model: ollama pull gemma2:12b")
        print("4. Run this script again")
        print("\nPress Enter to continue anyway (may not work without Ollama)...")
        input()
    
    # Start Flask application
    print("\n🌐 Starting Flask application...")
    print("📱 Open your browser to: http://localhost:5000")
    print("🛑 Press Ctrl+C to stop the server")
    print("=" * 50)
    
    try:
        from app import app
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\n👋 ReaderHelp stopped")
    except Exception as e:
        print(f"❌ Error starting application: {e}")

if __name__ == "__main__":
    main()
