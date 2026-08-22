import json
import os
import time
from config import CACHE_FILE
from client import safe_request_get

COMPANIES_CACHE = []
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

# Initialize cache on module import
load_cached_companies()

def save_cached_companies(companies_list):
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(companies_list, f, indent=2)
    except Exception as e:
        print(f"[CACHE] Error writing cache file: {e}")

def background_sync_all_makers():
    """
    Background worker that systematically fetches all pages of vehicle makers
    from Vahan without blocking users or triggering rate limits.
    """
    global COMPANIES_CACHE, SYNC_IN_PROGRESS
    if SYNC_IN_PROGRESS:
        return
    
    SYNC_IN_PROGRESS = True
    print("[BACKGROUND SYNC] Checking Vahan for new vehicle makers...")
    
    try:
        all_companies = set(COMPANIES_CACHE)
        initial_count = len(all_companies)
        page = 1
        max_pages = 150
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
                            print(f"[BACKGROUND SYNC] Completed scan at page {page}.")
                            break
                    else:
                        consecutive_empty = 0
                        all_companies.update(data)
                        COMPANIES_CACHE = sorted(list(all_companies))
                        if page % 5 == 0:
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
            new_added = len(COMPANIES_CACHE) - initial_count
            if new_added > 0:
                print(f"[AUTO-SYNC] Automatically detected & added {new_added} NEW makers! Total makers: {len(COMPANIES_CACHE)}")
            else:
                print(f"[AUTO-SYNC] All {len(COMPANIES_CACHE)} makers are up to date.")
    except Exception as e:
        print(f"[BACKGROUND SYNC] Error during sync: {e}")
    finally:
        SYNC_IN_PROGRESS = False

def periodic_auto_sync_loop():
    """
    Continuous background daemon running on Render:
    1. Runs full sync on startup.
    2. Wakes up every 12 hours to automatically detect and add new OEMs registered on Vahan.
    """
    while True:
        try:
            background_sync_all_makers()
        except Exception as e:
            print(f"[AUTO-SYNC] Error in periodic sync loop: {e}")
        # Sleep for 12 hours (12 * 3600 seconds) before checking for new companies again
        time.sleep(12 * 3600)
