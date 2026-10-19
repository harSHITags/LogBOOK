
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column,Integer,String,Float,ForeignKey

Base=declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)

class Product(Base):

    __tablename__="product"

    id=Column(Integer,primary_key=True,index=True)
    name=Column(String)
    description=Column(String)
    price=Column(Float)
    quantity=Column(Integer)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_product_number = Column(Integer, nullable=True)