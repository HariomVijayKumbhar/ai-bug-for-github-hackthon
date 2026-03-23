import os
import sys

# Ensure the project root is in the path for local imports
# This allows us to import from the 'backend' folder
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app

# Vercel needs the 'app' object.
# Set root_path to handle the '/api' prefix from rewrites
app.root_path = "/api"
