from fastapi import FastAPI,HTTPException,Depends
from pydantic import BaseModel
from database import SessionLocal,engine
from sqlalchemy.orm import Session
from models import Product


import databaseModels


app=FastAPI()

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
def get_product_by_id(id:int):
     for product in products:
          if product.id==id:
               return product
     return "Not found"


@app.post("/")
def add_product(product:Product):
     products.append(product)
     return ("message",
             "succesfully added ")

@app.put("/products/{id}")
def update_products(id: int, product: Product):
    for i in range(len(products)):
        if products[i].id == id:
            products[i] = product
            return {
                "message": "Product updated successfully",
                "product": products[i]
            }

    raise HTTPException(status_code=404, detail="Product not found")

@app.delete("/products/{id}")
def delete_products(id:int):
     for i in range(len(products)):
          if products[i].id==id:
               del products[i]
               return("product successfully removed")
     return "not removed"
          