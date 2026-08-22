from fastapi import APIRouter, HTTPException, BackgroundTasks
import services.companies_service as cs

router = APIRouter(prefix="/api/companies", tags=["companies"])

@router.get("")
@router.get("/")
def get_companies(background_tasks: BackgroundTasks):
    # Return immediately from cache without delay
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
