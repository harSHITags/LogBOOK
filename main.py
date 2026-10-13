from fastapi import FastAPI,HTTPException
from pydantic import BaseModel
from database import SessionLocal,engine
import databaseModels


app=FastAPI()

databaseModels.Base.metadata.create_all(bind=engine)

class Product(BaseModel):
     id:int
     type:str
     description:str
     price:int
     quantity:int


products=[
    Product(id=1 ,type="mobile", description="Samsung" ,price="8999", quantity=377),
    Product(id=2, type="laptop", description="HP", price="45999", quantity=120),
    Product(id=3, type="tablet", description="Apple iPad", price="32999", quantity=85) ,
    Product(id=4, type="headphones", description="Boat", price="1499", quantity=250),
    Product(id=5, type="smartwatch", description="Noise", price="2499", quantity=175),
    Product(id=6, type="keyboard", description="Logitech", price="1999", quantity=90),
]

@app.get("/products")
def get_all_products():

      db=session()
      db.query()
      return products

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
          