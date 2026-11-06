import datetime
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import SmartCard, Transaction, Bus, BoardingRecord, BusStop, User
from schemas import SmartCardOut, TransactionOut, ScanRequest, ScanResponse, RechargeRequest
from ws_manager import manager

router = APIRouter(prefix="/api/passengers", tags=["passengers"])

BASE_FARE = 10.0


class HardwareTapRequest(BaseModel):
    card_uid: str
    bus_number: str
    stop_id: int | None = None
    terminal_device_id: str = "ETM-POS-01"


class DepotRechargeRequest(BaseModel):
    card_number: str
    amount: float
    depot_code: str = "AY"
    operator_id: str = "OP-9821"


@router.get("/card/{passenger_id}", response_model=SmartCardOut)
def get_card(passenger_id: int, db: Session = Depends(get_db)):
    card = db.query(SmartCard).filter(SmartCard.passenger_id == passenger_id).first()
    if not card:
        user = db.query(User).get(passenger_id)
        if user:
            card_number = f"TN-MTC-PASS-{passenger_id:04d}"
            card = SmartCard(
                card_number=card_number,
                passenger_id=passenger_id,
                balance=250.0,
                is_active=True,
            )
            db.add(card)
            db.commit()
            db.refresh(card)

            # Add welcome credit transaction
            txn = Transaction(
                card_id=card.id,
                amount=250.0,
                type="credit",
                description="Govt. of Tamil Nadu Initial Transit Allowance",
            )
            db.add(txn)
            db.commit()
            db.refresh(card)
        else:
            raise HTTPException(status_code=404, detail="Passenger not found")
    return SmartCardOut.model_validate(card)


@router.get("/transactions/{card_id}", response_model=list[TransactionOut])
def get_transactions(card_id: int, db: Session = Depends(get_db)):
    txns = (db.query(Transaction)
            .filter(Transaction.card_id == card_id)
            .order_by(Transaction.created_at.desc())
            .limit(50).all())
    return [TransactionOut.model_validate(t) for t in txns]


@router.post("/scan", response_model=ScanResponse)
async def scan_card(req: ScanRequest, db: Session = Depends(get_db)):
    card = db.query(SmartCard).filter(SmartCard.card_number == req.card_number).first()
    if not card:
        return ScanResponse(success=False, message="Card not found", current_passengers=0)
    if not card.is_active:
        return ScanResponse(success=False, message="Smart Card is inactive", current_passengers=0)

    bus = db.query(Bus).get(req.bus_id)
    if not bus:
        return ScanResponse(success=False, message="Bus not found", current_passengers=0)

    if req.action == "board":
        if bus.current_passengers >= bus.total_capacity:
            return ScanResponse(success=False, message="Bus is at operational capacity",
                                current_passengers=bus.current_passengers, new_balance=round(card.balance, 2), bus_id=bus.id)
        if card.balance < BASE_FARE:
            return ScanResponse(success=False, message=f"Insufficient balance (₹{card.balance:.2f}). Recharge at depot.",
                                current_passengers=bus.current_passengers, new_balance=round(card.balance, 2), bus_id=bus.id)

        bus.current_passengers += 1
        bus.boarded_count += 1
        card.balance = round(card.balance - BASE_FARE, 2)

        db.add(Transaction(card_id=card.id, amount=BASE_FARE, type="debit",
                           description=f"Boarded {bus.bus_number}"))
        db.add(BoardingRecord(passenger_id=card.passenger_id, bus_id=bus.id,
                              stop_id=req.stop_id, action="board", fare=BASE_FARE))
        db.commit()

        # Immediate Non-blocking WebSocket broadcast
        pct = (bus.current_passengers / bus.total_capacity * 100) if bus.total_capacity > 0 else 0
        crowd = "green" if pct < 50 else "yellow" if pct < 75 else "orange" if pct < 90 else "red"
        asyncio.create_task(manager.broadcast("bus_single_update", {
            "bus_id": bus.id,
            "bus_number": bus.bus_number,
            "current_passengers": bus.current_passengers,
            "occupancy_percent": round(pct, 1),
            "crowd_status": crowd,
            "card_number": card.card_number,
            "new_balance": card.balance,
            "action": "board"
        }))

        return ScanResponse(success=True, message=f"Boarding validated! ₹{BASE_FARE:.2f} deducted. Bal: ₹{card.balance:.2f}",
                            current_passengers=bus.current_passengers, fare=BASE_FARE,
                            new_balance=card.balance, bus_id=bus.id)

    elif req.action == "alight":
        if bus.current_passengers > 0:
            bus.current_passengers -= 1
        bus.alighted_count += 1

        db.add(BoardingRecord(passenger_id=card.passenger_id, bus_id=bus.id,
                              stop_id=req.stop_id, action="alight"))
        db.commit()

        # Immediate Non-blocking WebSocket broadcast
        pct = (bus.current_passengers / bus.total_capacity * 100) if bus.total_capacity > 0 else 0
        crowd = "green" if pct < 50 else "yellow" if pct < 75 else "orange" if pct < 90 else "red"
        asyncio.create_task(manager.broadcast("bus_single_update", {
            "bus_id": bus.id,
            "bus_number": bus.bus_number,
            "current_passengers": bus.current_passengers,
            "occupancy_percent": round(pct, 1),
            "crowd_status": crowd,
            "card_number": card.card_number,
            "new_balance": card.balance,
            "action": "alight"
        }))

        return ScanResponse(success=True, message="Alighting recorded successfully",
                            current_passengers=bus.current_passengers, fare=0,
                            new_balance=card.balance, bus_id=bus.id)

    return ScanResponse(success=False, message="Invalid action", current_passengers=0)


@router.post("/recharge")
def recharge_card(req: RechargeRequest, db: Session = Depends(get_db)):
    card = db.query(SmartCard).filter(SmartCard.card_number == req.card_number).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    if req.amount <= 0 or req.amount > 5000:
        raise HTTPException(status_code=400, detail="Invalid recharge amount (₹1 - ₹5,000)")

    card.balance += req.amount
    db.add(Transaction(card_id=card.id, amount=req.amount, type="credit",
                       description=f"Recharge (Government Depot / UPI): +₹{req.amount:.2f}"))
    db.commit()
    return {"success": True, "new_balance": card.balance}


# =====================================================================
# Dedicated Hardware Reader & Depot POS Integration APIs
# Designed so future physical turnstiles / ETMs call the exact same APIs
# =====================================================================

@router.get("/smartcard/{card_number}")
def verify_smart_card_hardware(card_number: str, db: Session = Depends(get_db)):
    """Fast smart card lookup (<50ms) for physical bus turnstiles and ETM scanners."""
    card = db.query(SmartCard).filter(SmartCard.card_number == card_number).first()
    if not card:
        return {"valid": False, "status": "UNKNOWN_CARD", "message": "Card not recognized"}
    return {
        "valid": True,
        "card_number": card.card_number,
        "is_active": card.is_active,
        "balance": card.balance,
        "passenger_id": card.passenger_id,
        "passenger_name": card.passenger.name if card.passenger else "MTC Commuter",
        "fare_category": "Standard Prepaid Smart Pass"
    }


@router.post("/smartcard/tap-in")
async def physical_hardware_tap_in(req: HardwareTapRequest, db: Session = Depends(get_db)):
    """Physical RFID reader tap-in event on boarding."""
    bus = db.query(Bus).filter(Bus.bus_number == req.bus_number).first()
    if not bus:
        raise HTTPException(status_code=404, detail=f"Bus {req.bus_number} not registered")

    card = db.query(SmartCard).filter(SmartCard.card_number == req.card_uid).first()
    if not card:
        return {"authorized": False, "gate_status": "LOCKED", "reason": "CARD_NOT_FOUND"}
    if not card.is_active:
        return {"authorized": False, "gate_status": "LOCKED", "reason": "CARD_INACTIVE"}
    if bus.current_passengers >= bus.total_capacity:
        return {"authorized": False, "gate_status": "LOCKED", "reason": "BUS_FULL"}
    if card.balance < BASE_FARE:
        return {"authorized": False, "gate_status": "LOCKED", "reason": "INSUFFICIENT_BALANCE", "balance": card.balance}

    bus.current_passengers += 1
    bus.boarded_count += 1
    card.balance -= BASE_FARE

    db.add(Transaction(card_id=card.id, amount=BASE_FARE, type="debit",
                       description=f"Physical Tap-in: {bus.bus_number} [{req.terminal_device_id}]"))
    db.add(BoardingRecord(passenger_id=card.passenger_id, bus_id=bus.id,
                          stop_id=req.stop_id, action="board", fare=BASE_FARE))
    db.commit()

    pct = (bus.current_passengers / bus.total_capacity * 100) if bus.total_capacity > 0 else 0
    crowd = "green" if pct < 50 else "yellow" if pct < 75 else "orange" if pct < 90 else "red"
    asyncio.create_task(manager.broadcast("bus_single_update", {
        "bus_id": bus.id,
        "bus_number": bus.bus_number,
        "current_passengers": bus.current_passengers,
        "occupancy_percent": round(pct, 1),
        "crowd_status": crowd,
        "card_number": card.card_number,
        "new_balance": card.balance,
        "action": "board"
    }))

    return {
        "authorized": True,
        "gate_status": "OPEN",
        "fare_deducted": BASE_FARE,
        "remaining_balance": card.balance,
        "current_bus_occupancy": bus.current_passengers,
        "bus_capacity": bus.total_capacity,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }


@router.post("/smartcard/tap-out")
async def physical_hardware_tap_out(req: HardwareTapRequest, db: Session = Depends(get_db)):
    """Physical RFID reader tap-out event on alighting."""
    bus = db.query(Bus).filter(Bus.bus_number == req.bus_number).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")

    card = db.query(SmartCard).filter(SmartCard.card_number == req.card_uid).first()
    if not card:
        return {"authorized": False, "reason": "CARD_NOT_FOUND"}

    if bus.current_passengers > 0:
        bus.current_passengers -= 1
    bus.alighted_count += 1

    db.add(BoardingRecord(passenger_id=card.passenger_id, bus_id=bus.id,
                          stop_id=req.stop_id, action="alight"))
    db.commit()

    pct = (bus.current_passengers / bus.total_capacity * 100) if bus.total_capacity > 0 else 0
    crowd = "green" if pct < 50 else "yellow" if pct < 75 else "orange" if pct < 90 else "red"
    asyncio.create_task(manager.broadcast("bus_single_update", {
        "bus_id": bus.id,
        "bus_number": bus.bus_number,
        "current_passengers": bus.current_passengers,
        "occupancy_percent": round(pct, 1),
        "crowd_status": crowd,
        "action": "alight"
    }))

    return {
        "authorized": True,
        "current_bus_occupancy": bus.current_passengers,
        "message": "Journey completed successfully"
    }


@router.post("/smartcard/depot-recharge")
def depot_recharge_counter(req: DepotRechargeRequest, db: Session = Depends(get_db)):
    """Government bus depot counter recharge transaction."""
    card = db.query(SmartCard).filter(SmartCard.card_number == req.card_number).first()
    if not card:
        raise HTTPException(status_code=404, detail="Smart card not found")

    card.balance += req.amount
    db.add(Transaction(card_id=card.id, amount=req.amount, type="credit",
                       description=f"Depot Counter Recharge [{req.depot_code}] via Op {req.operator_id}"))
    db.commit()
    return {
        "success": True,
        "card_number": card.card_number,
        "recharged_amount": req.amount,
        "current_balance": card.balance,
        "receipt_number": f"REC-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    }
