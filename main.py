from fastapi import FastAPI,HTTPException,Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import SessionLocal,engine
from sqlalchemy.orm import Session
from models import Product,UserCreate,LoginRequest
import databaseModels
from pwdlib import PasswordHash
import os
from datetime import datetime, timedelta, timezone
import jwt
from dotenv import load_dotenv
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt.exceptions import InvalidTokenError
from sqlalchemy import func


load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
security = HTTPBearer(auto_error=False)

if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY is missing from .env")


password_hash = PasswordHash.recommended()


app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("STEP 1: Creating tables...")
databaseModels.Base.metadata.create_all(bind=engine)
print("STEP 2: Tables created")

class Product(BaseModel):
     id:int
     name:str
     description:str
     price:int
     quantity:int


products=[
    Product(id=1 ,name="mobile", description="Samsung" ,price="8999", quantity=377),
    Product(id=2, name="laptop", description="HP", price="45999", quantity=120),
    Product(id=3, name="tablet", description="Apple iPad", price="32999", quantity=85) ,
    Product(id=4, name="headphones", description="Boat", price="1499", quantity=250),
    Product(id=5, name="smartwatch", description="Noise", price="2499", quantity=175),
    Product(id=6, name="keyboard", description="Logitech", price="1999", quantity=90),
]


def get_db():
     db=SessionLocal()
     try:
         yield db
     finally:
         db.close()

def init_db():
      db=SessionLocal()

      count=db.query(databaseModels.Product).count()

      if count==0:

          for product in products:
               db.add(databaseModels.Product(**product.model_dump()))

      db.commit()

print("STEP 3: Initializing database...")
init_db()
print("STEP 4: Database initialized")


#Register endpoint
@app.post("/register")
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Check if username already exists
    existing_user = db.query(databaseModels.User).filter(
        databaseModels.User.username == user.username
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    # Check if email already exists
    existing_email = db.query(databaseModels.User).filter(
        databaseModels.User.email == user.email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash the password
    hashed_password = password_hash.hash(user.password)

    # Create the new user
    new_user = databaseModels.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email
    }

#Token generation
def create_access_token(username: str):
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": username,
        "exp": expires_at
    }

    token = jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )

    return token


#Log IN Endpoints
@app.post("/login")
def login_user(
    user: LoginRequest,
    db: Session = Depends(get_db)
):
    # Find the user by username
    existing_user = db.query(databaseModels.User).filter(
        databaseModels.User.username == user.username
    ).first()

    # Reject invalid credentials
    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    # Compare entered password with stored hash
    password_is_correct = password_hash.verify(
        user.password,
        existing_user.hashed_password
    )

    if not password_is_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    access_token = create_access_token(existing_user.username) 

    return {
        "access_token": access_token,
        "token_type": "bearer"
        }

#current User
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    # Reject requests without a token
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials

    try:
        # Verify the token's signature and expiry
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )

        username = payload.get("sub")

        if not username:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Find the user associated with the token
    current_user = db.query(databaseModels.User).filter(
        databaseModels.User.username == username
    ).first()

    if current_user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return current_user

#current admin
def get_current_admin(
    current_user: databaseModels.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user

# Products EndPoints
@app.get("/products")
def get_all_products(
    db: Session = Depends(get_db),
    current_user: databaseModels.User = Depends(get_current_user)
):
    db_products = (
        db.query(databaseModels.Product)
        .filter(databaseModels.Product.user_id == current_user.id)
        .all()
    )

    return db_products


@app.get("/products/{id}")
def get_product_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: databaseModels.User = Depends(get_current_user)
):
    db_product = (
        db.query(databaseModels.Product)
        .filter(
            databaseModels.Product.id == id,
            databaseModels.Product.user_id == current_user.id
        )
        .first()
    )

    if db_product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return db_product


@app.post("/products")
def add_product(
    product: Product,
    db: Session = Depends(get_db),
    current_user: databaseModels.User = Depends(get_current_user)
):
    # Step 1: Find this user's highest product number
    last_number = db.query(
        func.max(databaseModels.Product.user_product_number)
    ).filter(
        databaseModels.Product.user_id == current_user.id
    ).scalar()

    # Step 2: Generate the next number for this user
    next_number = (last_number or 0) + 1

    # Step 3: Create the product
    new_product = databaseModels.Product(
        name=product.name,
        description=product.description,
        price=product.price,
        quantity=product.quantity,
        user_id=current_user.id,
        user_product_number=next_number
    )

    # Step 4: Save it to the database
    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


@app.put("/products/{id}")
def update_products(
    id: int,
    product: Product,
    db: Session = Depends(get_db),
    current_user: databaseModels.User = Depends(get_current_user)
):
    db_product = (
        db.query(databaseModels.Product)
        .filter(
            databaseModels.Product.id == id,
            databaseModels.Product.user_id == current_user.id
        )
        .first()
    )

    if db_product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    db_product.name = product.name
    db_product.description = product.description
    db_product.price = product.price
    db_product.quantity = product.quantity

    db.commit()
    db.refresh(db_product)

    return db_product



@app.delete("/products/{id}")
def delete_products(
    id: int,
    db: Session = Depends(get_db),
    current_user: databaseModels.User = Depends(get_current_admin)
):
    db_product = (
        db.query(databaseModels.Product)
        .filter(
            databaseModels.Product.id == id,
            databaseModels.Product.user_id == current_user.id
        )
        .first()
    )

    if db_product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    db.delete(db_product)
    db.commit()

    return {"message": "Product successfully removed"}
