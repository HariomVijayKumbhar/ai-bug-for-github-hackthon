# AntyGravity

Predictive Bug Intelligence for modern codebases. "AntyGravity" prevents software failures by predicting bugs before they impact the system.

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:
   ```bash
   python main.py
   ```
   The backend will run on `http://localhost:8000`.

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`.

## Features
- **GitLab Analysis**: Enter a repo URL to analyze risk levels.
- **Gravity Score**: Visual indicators for file and project risk.
- **AI Chatbot**: Ask "Why is this code risky?" to get deep insights.
- **Futuristic UI**: High-impact, dark-themed dashboard with neon accents.
