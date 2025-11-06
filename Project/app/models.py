from sqlalchemy import Column, String, Integer, Numeric, Boolean, Text, ForeignKey, Enum, TIMESTAMP, JSON, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import enum

Base = declarative_base()

class OrderStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    preparing = "preparing"
    ready = "ready"
    completed = "completed"
    cancelled = "cancelled"

class UserRole(str, enum.Enum):
    customer = "customer"
    staff = "staff"
    admin = "admin"

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    email = Column(Text, unique=True, nullable=False)
    name = Column(Text)
    role = Column(Enum(UserRole, name="user_role"), default=UserRole.customer)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Restaurant(Base):
    __tablename__ = "restaurants"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    name = Column(Text, nullable=False)
    address = Column(Text)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(TIMESTAMP, server_default=func.now())
    latitude = Column(Float, name="latitudes")
    longitude = Column(Float, name="longitudes")

class Meal(Base):
    __tablename__ = "meals"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    name = Column(Text, nullable=False)
    tags = Column(Text)
    base_price = Column(Numeric, nullable=False)
    quantity = Column(Integer)
    surplus_price = Column(Numeric)
    allergens = Column(Text)
    calories = Column(Integer)
    created_at = Column(TIMESTAMP, server_default=func.now())
    image_link = Column(String)

class Address(Base):
    __tablename__ = "addresses"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    label = Column(Text)
    line1 = Column(Text, nullable=False)
    line2 = Column(Text)
    city = Column(Text, nullable=False)
    state = Column(Text, nullable=False)
    zip = Column(Text, nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Cart(Base):
    __tablename__ = "carts"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

class CartItem(Base):
    __tablename__ = "cart_items"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    cart_id = Column(UUID(as_uuid=True), ForeignKey("carts.id"), nullable=False)
    meal_id = Column(UUID(as_uuid=True), ForeignKey("meals.id"), nullable=False)
    qty = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Order(Base):
    __tablename__ = "orders"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    status = Column(Enum(OrderStatus, name="order_status"), default=OrderStatus.pending)
    total = Column(Numeric, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    meal_id = Column(UUID(as_uuid=True), ForeignKey("meals.id"), nullable=False)
    qty = Column(Integer, nullable=False)
    price = Column(Numeric, nullable=False)

class OrderStatusEvent(Base):
    __tablename__ = "order_status_events"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    status = Column(Enum(OrderStatus, name="order_status"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

class RestaurantStaff(Base):
    __tablename__ = "restaurant_staff"
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    role = Column(Text)

class Mood(Base):
    __tablename__ = "moods"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    label = Column(Text)
    vector = Column(JSON)
    source = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

class UserPreference(Base):
    __tablename__ = "users_preferences"
    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    food_preferences = Column(JSON)
    other_preferences = Column(JSON)

class UserSpotifyAuthToken(Base):
    __tablename__ = "users_spotify_auth_tokens"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    access_token = Column(String)
    refresh_token = Column(String)
    expires_at = Column(Integer)

class SustainabilityMetric(Base):
    __tablename__ = "sustainability_metrics"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    food_saved_kg = Column(Numeric)
    co2_saved_kg = Column(Numeric)
    money_saved = Column(Numeric)
