import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import time
import threading
from config import HEADERS

# Persistent HTTP session with connection pooling
session = requests.Session()
session.headers.update(HEADERS)
retry_strategy = Retry(
    total=3,
    backoff_factor=1.5,
    status_forcelist=[429, 500, 502, 503, 504],
    raise_on_status=False
)
adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=5, pool_maxsize=10)
session.mount("https://", adapter)
session.mount("http://", adapter)

# -------------------------------------------------------------
# STRICT SEQUENTIAL RATE LIMITER & LOCK
# Guarantees that only ONE request to Vahan runs at any moment,
# with a minimum 400ms interval between requests to prevent bursting.
# -------------------------------------------------------------
VAHAN_REQUEST_LOCK = threading.Lock()
LAST_REQUEST_TIME = 0.0
MIN_REQUEST_INTERVAL = 0.40  # Minimum 400ms pause between any consecutive calls

def safe_request_get(url, params=None, timeout=15, max_attempts=3):
    """
    Executes a GET request to Vahan strictly sequentially.
    Enforces a global lock and minimum delay between requests to guarantee NO bursts.
    """
    global LAST_REQUEST_TIME
    
    with VAHAN_REQUEST_LOCK:
        for attempt in range(1, max_attempts + 1):
            try:
                now = time.time()
                elapsed = now - LAST_REQUEST_TIME
                if elapsed < MIN_REQUEST_INTERVAL:
                    time.sleep(MIN_REQUEST_INTERVAL - elapsed)
                
                r = session.get(url, params=params, timeout=timeout)
                LAST_REQUEST_TIME = time.time()
                
                if r.status_code == 429:
                    wait_time = attempt * 2.0
                    print(f"[RATE LIMIT] HTTP 429 received for {url}. Waiting {wait_time}s before retry (attempt {attempt}/{max_attempts})...")
                    time.sleep(wait_time)
                    continue
                    
                return r
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                LAST_REQUEST_TIME = time.time()
                if attempt < max_attempts:
                    wait_time = attempt * 2.0
                    print(f"[RETRY] Connection issue for {url}: {e}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    print(f"[ERROR] Max retries reached for {url}: {e}")
                    return None
            except Exception as e:
                LAST_REQUEST_TIME = time.time()
                print(f"[ERROR] Unexpected request error for {url}: {e}")
                return None
    return None
