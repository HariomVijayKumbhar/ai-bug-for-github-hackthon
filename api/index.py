import os
import sys

# Ensure the project root is in the path for local imports
# This allows us to import from the 'backend' folder
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app
