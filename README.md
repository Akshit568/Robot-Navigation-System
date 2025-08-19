<img width="1918" height="972" alt="Screenshot 2025-08-19 214636" src="https://github.com/user-attachments/assets/baaa667a-7c18-4187-b51a-e7e4615117bb" />🤖 Robot Navigation System

An autonomous robot navigation system that performs collision-free route planning using computer vision and AI techniques.
The project integrates a Python backend for robot control and a React + Vite + Tailwind frontend for visualization and simulation.

The system dynamically sets goal points and navigates the robot toward them while avoiding static and moving obstacles — without any manual intervention after launch.


🚀 Features

✅ Automatic collision-free route planning

✅ Computer Vision based obstacle detection (using /capture endpoint)

✅ Flask + WebSocket backend for real-time control

✅ React + Tailwind frontend for interactive visualization

✅ Supports dynamic goal points (placed near corners)

✅ Handles static and moving obstacles with minimal collisions

✅ Fully autonomous – no manual input required once launched

🛠️ Tech Stack
Backend (Python)

Flask (API + WebSocket server)

OpenCV (Computer Vision for obstacle detection)

Path planning algorithms (A*, custom navigation logic)

Frontend (React + Vite)

React + TypeScript

TailwindCSS for styling

WebSocket client for real-time updates

Vite for fast bundling and dev server

📂 Project Structure
project/
├── backend/             # Python backend (Flask + CV + Navigation Logic)
├── server/              # WebSocket + API server
├── src/                 # React frontend source code
├── package.json         # Frontend dependencies
├── vite.config.ts       # Vite config for frontend
├── tsconfig.json        # TypeScript configuration
└── tailwind.config.js   # TailwindCSS configuration

⚡ Installation & Setup
1️⃣ Clone the repository
git clone https://github.com/Akshit568/Robot-Navigation-System.git
cd Robot-Navigation-System/project

2️⃣ Backend Setup (Python)
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt


Run the backend:

python app.py


This starts the Flask server and exposes /capture, /move, and /move_rel endpoints.

3️⃣ Frontend Setup (React + Vite)
cd ../
npm install
npm run dev


This launches the frontend at:
👉 http://localhost:5173

🎮 How to Run the Simulation in VS Code

Open the project folder in VS Code.

Start the backend server (python app.py).

Open a new terminal and start the frontend (npm run dev).

The simulator UI will be available on http://localhost:5173
.

The robot will autonomously navigate toward the dynamically set goal with minimal collisions.

📊 Deliverables Implemented

Level 1 → Robot reaches goals in different corners (4 runs, average collision count recorded).

Level 2 → Robot adapts to moving obstacles and still reaches goals autonomously.

Level 3 → Graph of Obstacle Speed vs Average Collisions generated from simulation runs.

📷 Demo (Screenshots / Videos)

(Attach your demo videos / GIFs here)

Level 1: Static obstacles

Level 2: Moving obstacles

Level 3: Performance Graph

📌 Future Improvements

Integration with ROS2 navigation stack

Support for real-world robot hardware (not just simulator)

Reinforcement learning for adaptive path planning
