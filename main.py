from fastapi import FastAPI,HTTPException,Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import SessionLocal,engine
from sqlalchemy.orm import Session
from models import Product
import databaseModels


app=FastAPI()

app.add_middleware(
     CORSMiddleware,
     allow_origins=["http://localhost:3000"],
     allow_methods=["*"]
)


databaseModels.Base.metadata.create_all(bind=engine)

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

init_db()

@app.get("/products")
def get_all_products(db:Session=Depends(get_db)):

    
    db_products=db.query(databaseModels.Product).all()

    return db_products

@app.get("/products/{id}")
def get_product_by_id(id:int, db:Session=Depends(get_db)):
    db_product=db.query(databaseModels.Product).filter(databaseModels.Product.id==id).first()
    if db_product.id:
        return db_product
    return "Not found"


@app.post("/products")
def add_product(product:Product, db:Session=Depends(get_db)):
     db.add(databaseModels.Product(**product.model_dump()))
     db.commit()
    
     return ("message",
             "succesfully added ")

@app.put("/products/{id}")
def update_products(id: int, product: Product,db:Session=Depends(get_db)):
    db_product=db.query(databaseModels.Product).filter(databaseModels.Product.id==id).first()
    if db_product:
         db_product.name=product.name
         db_product.description=product.description
         db_product.price=product.price
         db_product.quantity=product.quantity
         db.commit()
         return "product updated"

    raise HTTPException(status_code=404, detail="Product not found")

@app.delete("/products/{id}")
def delete_products(id:int ,db:Session=Depends(get_db)):
     db_product=db.query(databaseModels.Product).filter(databaseModels.Product.id==id).first()
     if db_product:
            db.delete(db_product)
            db.commit()
            return("product successfully removed")
     else:
            return "not removed"
          