#!/usr/bin/env python3
"""
Robot Navigation Backend Server
Run this script to start the Flask server with WebSocket support
"""

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, socketio

if __name__ == '__main__':
    print("Starting Robot Navigation Backend Server...")
    print("Server will be available at: http://localhost:5000")
    print("WebSocket endpoint: ws://localhost:5000")
    print("\nAvailable endpoints:")
    print("  GET  /capture - Get environment image")
    print("  POST /move - Move robot (direction: up/down/left/right)")
    print("  POST /reset - Reset robot to start position")
    print("  POST /moving-obstacles - Spawn moving obstacles")
    print("  POST /start - Start simulation")
    print("  POST /stop - Stop simulation")
    print("  POST /set-goal - Set goal position")
    print("  GET  /results - Download experiment results graph")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        socketio.run(app, host='0.0.0.0', port=5000, debug=False)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error starting server: {e}")