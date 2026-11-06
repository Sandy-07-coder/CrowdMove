from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    role: str

    model_config = {"from_attributes": True}


class SmartCardOut(BaseModel):
    id: int
    card_number: str
    balance: float
    is_active: bool
    passenger: UserOut

    model_config = {"from_attributes": True}


class TransactionOut(BaseModel):
    id: int
    amount: float
    type: str
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class BusStopOut(BaseModel):
    id: int
    name: str
    stop_order: int
    latitude: float
    longitude: float
    estimated_waiting: int

    model_config = {"from_attributes": True}


class BusRouteOut(BaseModel):
    id: int
    route_number: str
    name: str
    source: str
    destination: str
    stops: list[BusStopOut] = []

    model_config = {"from_attributes": True}


class BusOut(BaseModel):
    id: int
    bus_number: str
    route_id: int
    total_capacity: int
    seated_capacity: int
    current_passengers: int
    boarded_count: int
    alighted_count: int
    current_stop_index: int
    latitude: float
    longitude: float
    status: str
    is_active: bool
    crowd_status: str = ""
    occupancy_percent: float = 0

    model_config = {"from_attributes": True}


class BusDetailOut(BusOut):
    route: Optional[BusRouteOut] = None
    driver: Optional[UserOut] = None


class ScanRequest(BaseModel):
    card_number: str
    bus_id: int
    action: str  # board or alight
    stop_id: Optional[int] = None


class ScanResponse(BaseModel):
    success: bool
    message: str
    current_passengers: int
    fare: float = 0
    new_balance: Optional[float] = None
    bus_id: Optional[int] = None


class AlertOut(BaseModel):
    id: int
    type: str
    severity: str
    message: str
    bus_id: Optional[int]
    route_id: Optional[int]
    is_resolved: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RechargeRequest(BaseModel):
    card_number: str
    amount: float


class DashboardStats(BaseModel):
    total_buses: int
    active_buses: int
    total_passengers: int
    overcrowded_buses: int
    approaching_capacity: int
    total_routes: int
