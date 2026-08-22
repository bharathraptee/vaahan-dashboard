import uvicorn
from main import app
import sys
import multiprocessing

if __name__ == "__main__":
    multiprocessing.freeze_support()
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    uvicorn.run(app, host="127.0.0.1", port=port)
