from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from typing import Optional, Dict, List
import urllib.parse
from client import safe_request_get
import services.companies_service as cs

router = APIRouter(prefix="/api/companies", tags=["companies"])

# In-memory cache for live search queries to avoid repeated hits to Vahan
LIVE_MAKER_SEARCH_CACHE: Dict[str, List[str]] = {}

@router.get("")
@router.get("/")
def get_companies(
    background_tasks: BackgroundTasks,
    search: Optional[str] = Query(None, description="Search term matching official Vahan portal logic"),
    page: int = Query(0, ge=0),
    size: int = Query(25, ge=1, le=100)
):
    search_str = (search or "").strip()

    # 1. LIVE SEARCH MATCHING VAHAN PORTAL LOGIC EXACTLY
    if search_str:
        cache_key = f"{search_str.lower()}_{page}_{size}"
        if cache_key in LIVE_MAKER_SEARCH_CACHE:
            return LIVE_MAKER_SEARCH_CACHE[cache_key]

        # Call Vahan's exact internal lazy endpoint with search parameter
        url = f"https://analytics.parivahan.gov.in/analytics/publicdashboard/lazy/vehicle-makers?page={page}&size={size}&search={urllib.parse.quote(search_str)}"
        try:
            r = safe_request_get(url, timeout=12, max_attempts=2)
            if r and r.status_code == 200:
                data = r.json()
                if isinstance(data, list):
                    LIVE_MAKER_SEARCH_CACHE[cache_key] = data
                    return data
        except Exception as e:
            print(f"[SEARCH ERROR] Live maker query failed for '{search_str}': {e}")

        # Fallback to local cache if Vahan times out
        if cs.COMPANIES_CACHE:
            fallback = [c for c in cs.COMPANIES_CACHE if search_str.upper() in c.upper()][:size]
            return fallback

    # 2. DEFAULT / INITIAL LOAD: Return master cache
    if cs.COMPANIES_CACHE:
        return cs.COMPANIES_CACHE

    loaded = cs.load_cached_companies()
    if loaded:
        return loaded

    raise HTTPException(status_code=500, detail="Vahan API is currently unreachable. Please try again later.")

@router.get("/sync")
def trigger_companies_sync(background_tasks: BackgroundTasks):
    """Endpoint to trigger full sync of all makers in background."""
    if not cs.SYNC_IN_PROGRESS:
        background_tasks.add_task(cs.background_sync_all_makers)
        return {"status": "started", "current_count": len(cs.COMPANIES_CACHE)}
    return {"status": "already_running", "current_count": len(cs.COMPANIES_CACHE)}
