from pydantic import BaseModel
from typing import List, Dict, Any, Union

class FilterPayload(BaseModel):
    companies: List[str]
    timeFilter: str = "As on Date"
    fromYear: int
    toYear: int
    stateCode: str
    rtoCode: int
    fuelType: Union[str, List[str]] = ""
    vehicleCategory: str

class RtoBreakdownPayload(FilterPayload):
    rtos: List[Dict[str, Any]]

def get_base_params(payload: FilterPayload):
    """
    Transforms UI filter payload into Vahan query parameter dictionary.
    """
    if isinstance(payload.fuelType, list):
        fuel_val = ",".join(payload.fuelType)
    else:
        fuel_val = str(payload.fuelType or "")

    params = {
        "fromYear": payload.fromYear,
        "toYear": payload.toYear,
        "stateCode": payload.stateCode,
        "vehicleClasses": "",
        "vehicleSubCategories": "",
        "vehicleEmissions": "",
        "vehicleFuels": fuel_val,
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
