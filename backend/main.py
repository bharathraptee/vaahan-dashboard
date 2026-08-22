from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import time
import json
import os
import threading

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = "https://analytics.parivahan.gov.in/analytics/publicdashboard"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://analytics.parivahan.gov.in/analytics/publicdashboard/vahan?lang=en",
    "Origin": "https://analytics.parivahan.gov.in",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin"
}

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

ENDPOINTS = {
    "Yearly Trend": "/vahandashboard/vahanyearwiseregistrationtrend",
    "Month Wise (Duration)": "/vahandashboard/durationWiseRegistrationTable",
    "Top 5 (State/RTO)": "/vahandashboard/top5chart",
    "Fuel": "/vahandashboard/fueltypedonutchart",
    "Class": "/vahandashboard/classdistribution",
    "Status": "/vahandashboard/statusdistribution"
}

class FilterPayload(BaseModel):
    companies: List[str]
    timeFilter: str = "As on Date"
    fromYear: int
    toYear: int
    stateCode: str
    rtoCode: int
    fuelType: str
    vehicleCategory: str

class RtoBreakdownPayload(FilterPayload):
    rtos: List[Dict[str, Any]]

def get_base_params(payload: FilterPayload):
    params = {
        "fromYear": payload.fromYear,
        "toYear": payload.toYear,
        "stateCode": payload.stateCode,
        "vehicleClasses": "",
        "vehicleSubCategories": "",
        "vehicleEmissions": "",
        "vehicleFuels": payload.fuelType,
        "vehicleCategoryGroup": payload.vehicleCategory,
        "evType": "",
        "vehicleStatus": "",
        "vehicleOwnerType": "",
        "fitnessCheck": 0,
        "vehicleType": "",
        "archiveTypeAC": "ACTIVE_COMPLIANT",
        "archiveTypeANC": "ACTIVE_NON_COMPLIANT",
        "archiveTypePA": "",
        "archiveTypeTA": "",
        "archiveTypeNA": "",
        "timePeriod": 0 if payload.timeFilter == "Calendar Year" else 2,
    }
    
    if payload.rtoCode != 0:
        params["rtoCode"] = payload.rtoCode
        
    return params

# Cache file location
CACHE_FILE = os.path.join(os.path.dirname(__file__), "companies_cache.json")
COMPANIES_CACHE = []
QUERY_CACHE: Dict[str, Any] = {}
RTO_CACHE: Dict[str, Any] = {}
SYNC_IN_PROGRESS = False

def load_cached_companies():
    global COMPANIES_CACHE
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list) and len(data) > 0:
                    COMPANIES_CACHE = sorted(list(set(data)))
                    return COMPANIES_CACHE
        except Exception as e:
            print(f"[CACHE] Error reading cache file: {e}")
    return []

# Initialize cache on startup
load_cached_companies()

def save_cached_companies(companies_list):
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(companies_list, f, indent=2)
    except Exception as e:
        print(f"[CACHE] Error writing cache file: {e}")

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

def background_sync_all_makers():
    """
    Background worker that systematically fetches all pages of vehicle makers
    from Vahan without blocking users or triggering rate limits.
    """
    global COMPANIES_CACHE, SYNC_IN_PROGRESS
    if SYNC_IN_PROGRESS:
        return
    
    SYNC_IN_PROGRESS = True
    print("[BACKGROUND SYNC] Starting background fetch of all Vahan vehicle makers...")
    
    try:
        all_companies = set(COMPANIES_CACHE)
        page = 1
        max_pages = 25
        consecutive_empty = 0
        
        while page <= max_pages:
            url = f"https://analytics.parivahan.gov.in/analytics/publicdashboard/lazy/vehicle-makers?page={page}&size=100&search="
            try:
                r = safe_request_get(url, timeout=15, max_attempts=2)
                if r and r.status_code == 200:
                    data = r.json()
                    if not data or not isinstance(data, list) or len(data) == 0:
                        consecutive_empty += 1
                        if consecutive_empty >= 2:
                            print(f"[BACKGROUND SYNC] No more makers found. Completed at page {page}.")
                            break
                    else:
                        consecutive_empty = 0
                        all_companies.update(data)
                        COMPANIES_CACHE = sorted(list(all_companies))
                        print(f"[BACKGROUND SYNC] Page {page} loaded. Total makers so far: {len(COMPANIES_CACHE)}")
                        # Periodically persist progress to disk
                        if page % 3 == 0:
                            save_cached_companies(COMPANIES_CACHE)
                    page += 1
                else:
                    print(f"[BACKGROUND SYNC] Stopped at page {page} with status {r.status_code if r else 'None'}")
                    break
            except Exception as err:
                print(f"[BACKGROUND SYNC] Error on page {page}: {err}")
                break
                
        if all_companies:
            COMPANIES_CACHE = sorted(list(all_companies))
            save_cached_companies(COMPANIES_CACHE)
            print(f"[BACKGROUND SYNC] Successfully synced {len(COMPANIES_CACHE)} makers to disk!")
    except Exception as e:
        print(f"[BACKGROUND SYNC] Error during sync: {e}")
    finally:
        SYNC_IN_PROGRESS = False

@app.on_event("startup")
def startup_event():
    # If the cache is only the seed list (< 500 makers), start background sync automatically
    if len(COMPANIES_CACHE) < 500:
        thread = threading.Thread(target=background_sync_all_makers, daemon=True)
        thread.start()

@app.get("/api/companies")
def get_companies(background_tasks: BackgroundTasks):
    global COMPANIES_CACHE
    
    # Trigger background sync if fewer than 500 makers are in cache
    if len(COMPANIES_CACHE) < 500 and not SYNC_IN_PROGRESS:
        background_tasks.add_task(background_sync_all_makers)

    # Return immediately from cache without delay
    if COMPANIES_CACHE:
        return COMPANIES_CACHE

    loaded = load_cached_companies()
    if loaded:
        return loaded

    raise HTTPException(status_code=500, detail="Vahan API is currently unreachable. Please try again later.")

@app.get("/api/companies/sync")
def trigger_companies_sync(background_tasks: BackgroundTasks):
    """Endpoint to trigger full sync of all 1,800+ makers in background."""
    if not SYNC_IN_PROGRESS:
        background_tasks.add_task(background_sync_all_makers)
        return {"status": "started", "current_count": len(COMPANIES_CACHE)}
    return {"status": "already_running", "current_count": len(COMPANIES_CACHE)}

@app.get("/api/rtos/{stateCode}")
def get_rtos(stateCode: str):
    if stateCode in RTO_CACHE:
        return RTO_CACHE[stateCode]
        
    try:
        r = safe_request_get(f"https://analytics.parivahan.gov.in/analytics/json_rtos?stateCode={stateCode}", timeout=10)
        if r and r.status_code == 200:
            data = r.json()
            RTO_CACHE[stateCode] = data
            return data
        return []
    except Exception as e:
        print(f"[RTOS] Error fetching RTOs for {stateCode}: {e}")
        return []

@app.post("/api/data/compare")
def get_company_data_compare(payload: FilterPayload):
    if not payload.companies:
        raise HTTPException(status_code=400, detail="No companies selected")

    cache_key = json.dumps(payload.dict(), sort_keys=True)
    if cache_key in QUERY_CACHE:
        return QUERY_CACHE[cache_key]

    aggregated_results = {}
    
    # Strictly sequential execution: one company at a time, one endpoint at a time
    for company in payload.companies:
        aggregated_results[company] = {}
        
        # 1. Dashboard Count (sequential)
        url = f"{BASE_URL}/vahan/registration/dashboardcount"
        params = get_base_params(payload)
        params["vehicleMakers[]"] = company
        params["viewModes"] = "registration"
        
        try:
            r = safe_request_get(url, params=params, timeout=15)
            if r and r.status_code == 200:
                aggregated_results[company]["Dashboard Count"] = r.json()
            else:
                aggregated_results[company]["Dashboard Count"] = {"raw": r.text[:500] if r else "No response"}
        except Exception as e:
            aggregated_results[company]["Dashboard Count"] = {"error": str(e)}

        # 2. Sequential Endpoints (Yearly Trend, Month Wise, Top 5, Fuel, Class, Status)
        for name, path in ENDPOINTS.items():
            url = f"{BASE_URL}{path}"
            params = get_base_params(payload)
            
            if name == "Month Wise (Duration)":
                params["calendarType"] = 3
                params["timePeriod"] = 2
                params["vehicleMakers[]"] = company
            else:
                params["vehicleMakers"] = company
                
            try:
                r = safe_request_get(url, params=params, timeout=15)
                if r and r.status_code == 200:
                    aggregated_results[company][name] = r.json()
                else:
                    aggregated_results[company][name] = {"raw": r.text[:500] if r else "No response"}
            except Exception as e:
                aggregated_results[company][name] = {"error": str(e)}
                
    # Cache query result
    QUERY_CACHE[cache_key] = aggregated_results
    return aggregated_results

@app.post("/api/data/city-rto-breakdown")
def get_city_rto_breakdown(payload: RtoBreakdownPayload):
    """
    Fetches Month-Wise breakdown for each RTO in the selected city.
    Strictly sequential across all RTOs and companies.
    """
    cache_key = f"city_rto_{json.dumps(payload.dict(), sort_keys=True)}"
    if cache_key in QUERY_CACHE:
        return QUERY_CACHE[cache_key]

    result = {}
    url = f"{BASE_URL}/vahandashboard/durationWiseRegistrationTable"
    base_params = get_base_params(payload)
    base_params["calendarType"] = 3
    base_params["timePeriod"] = 2
    
    # Strictly sequential: one RTO, then one company at a time
    for rto in payload.rtos:
        rto_name = rto.get("rtoName")
        rto_code = rto.get("rtoCode")
        
        result[rto_name] = {}
        
        for company in payload.companies:
            params = base_params.copy()
            params["rtoCode"] = rto_code
            params["vehicleMakers[]"] = company
            
            try:
                r = safe_request_get(url, params=params, timeout=15)
                if r and r.status_code == 200:
                    result[rto_name][company] = r.json()
                else:
                    result[rto_name][company] = []
            except Exception as e:
                print(f"[RTO BREAKDOWN] Error fetching RTO {rto_name} for {company}: {e}")
                result[rto_name][company] = []
                
    QUERY_CACHE[cache_key] = result
    return result
