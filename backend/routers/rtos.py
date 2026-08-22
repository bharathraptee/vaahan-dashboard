from fastapi import APIRouter
from typing import Dict, Any
from client import safe_request_get

router = APIRouter(prefix="/api/rtos", tags=["rtos"])

RTO_CACHE: Dict[str, Any] = {}

@router.get("/{stateCode}")
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
