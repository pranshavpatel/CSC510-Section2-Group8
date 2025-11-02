from pydantic import BaseModel 
from typing import List, Optional

class UserDetails(BaseModel):
    user_id: str
    