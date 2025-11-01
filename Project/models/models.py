from pydantic import BaseModel 
from typing import List, Optional

class Auth(BaseModel):
    code: str