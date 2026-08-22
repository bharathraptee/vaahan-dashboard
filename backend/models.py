from pydantic import BaseModel
from typing import List, Dict, Any

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
    """
    Transforms UI filter payload into Vahan query parameter dictionary.
    """
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
