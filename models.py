from pydantic import BaseModel,EmailStr


class Product(BaseModel):
    id:int
    name:str
    description:str
    price:float
    quantity:int

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class DescriptionRequest(BaseModel):
    name: str
    category: str

class InventoryAdviceRequest(BaseModel):
    low_stock_threshold: int = 5