from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import json
from config import BASE_URL, ENDPOINTS
from models import FilterPayload, RtoBreakdownPayload, get_base_params
from client import safe_request_get

router = APIRouter(prefix="/api/data", tags=["analytics"])

QUERY_CACHE: Dict[str, Any] = {}

@router.post("/compare")
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

@router.post("/city-rto-breakdown")
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
