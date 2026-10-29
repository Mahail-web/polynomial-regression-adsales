"""
Root Entrypoint for Streamlit Community Cloud Deployment.
Redirects execution to streamlit_app/app.py.
"""

from pathlib import Path
import runpy
import sys

# Ensure project root is in python path
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

if __name__ == "__main__":
    target_app = ROOT / "streamlit_app" / "app.py"
    runpy.run_path(str(target_app), run_name="__main__")
