from fastapi import APIRouter, Depends, HTTPException
from .auth import require_owner
from database.database import database

router = APIRouter()

@router.get("")
async def get_my_restaurant(user: dict = Depends(require_owner)):
    try:
        q = """
            SELECT name, address
            FROM restaurants
            WHERE owner_id = :user_id
        """
        row = await database.fetch_one(q, {"user_id": user["id"]})
        
        if not row:
            raise HTTPException(status_code=404, detail="No restaurant found for this owner")
         
        return dict(row)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch restaurant details: {str(e)}")
