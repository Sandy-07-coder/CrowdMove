from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt

from database import get_db
from models import User
from schemas import LoginRequest, LoginResponse, UserOut
from auth_utils import verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = "crowdmove-hackathon-secret-2024"
ALGORITHM = "HS256"


def create_token(user_id: int, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=24),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = db.query(User).get(int(payload["sub"]))
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    identifier = req.email.strip()
    
    # 1. Exact email match
    user = db.query(User).filter(User.email.ilike(identifier)).first()
    
    # 2. Domain swap: seerpayanam <-> crowdmove
    if not user:
        alt_domain = (identifier.replace("@seerpayanam.in", "@crowdmove.in")
                                .replace("@seerpayanam.com", "@crowdmove.in"))
        user = db.query(User).filter(User.email.ilike(alt_domain)).first()
    if not user:
        alt_domain2 = identifier.replace("@crowdmove.in", "@seerpayanam.in")
        user = db.query(User).filter(User.email.ilike(alt_domain2)).first()

    # 3. Look up by Smart Card Number (for commuters)
    if not user:
        from models import SmartCard
        card = db.query(SmartCard).filter(SmartCard.card_number.ilike(identifier)).first()
        if card and card.passenger:
            user = card.passenger

    # 4. Username prefix before '@' (e.g. 'admin', 'conductor', 'rajesh')
    if not user:
        prefix = identifier.split("@")[0].strip().lower()
        user = db.query(User).filter(User.email.ilike(f"{prefix}@%")).first()

    # 5. Look up by Badge number or role shortcuts
    if not user:
        ident_upper = identifier.upper()
        if any(k in ident_upper for k in ["ADMIN", "CONTROLLER"]):
            user = db.query(User).filter(User.role == "admin").first()
        elif any(k in ident_upper for k in ["CONDUCTOR", "OP-9821", "ETM", "DEEPA"]):
            user = db.query(User).filter(User.email.like("%conductor%")).first()
        elif any(k in ident_upper for k in ["DRIVER", "RAJESH", "D51192"]):
            user = db.query(User).filter(User.email.like("%rajesh%")).first()
        elif any(k in ident_upper for k in ["PRIYA", "PASSENGER", "COMMUTER"]):
            user = db.query(User).filter(User.email.like("%priya%")).first()
        elif ident_upper.startswith("D") and len(ident_upper) >= 4:
            user = db.query(User).filter(User.name.ilike(f"%{ident_upper}%")).first()

    # 6. Fallback: partial name match
    if not user:
        user = db.query(User).filter(User.name.ilike(f"%{identifier}%")).first()

    if not user:
        raise HTTPException(status_code=401, detail="Account or Smart Card ID not recognized")

    token = create_token(user.id, user.role)
    return LoginResponse(token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    return UserOut.model_validate(user)
