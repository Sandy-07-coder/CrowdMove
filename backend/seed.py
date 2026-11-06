import json
from sqlalchemy.orm import Session
from auth_utils import hash_password
from models import User, SmartCard, BusRoute, BusStop, Bus, Festival, MetroStation


def seed_database(db: Session, force: bool = False):
    if not force and db.query(User).first():
        return

    # Clear existing if forced
    if force:
        db.query(SmartCard).delete()
        db.query(BusStop).delete()
        db.query(Bus).delete()
        db.query(BusRoute).delete()
        db.query(Festival).delete()
        db.query(MetroStation).delete()
        db.query(User).delete()
        db.commit()

    admin = User(name="MTC Central Transit Controller", email="admin@seerpayanam.in", phone="9876543210",
                 password_hash=hash_password("test123"), role="admin")
    db.add(admin)

    drivers_data = [
        ("Rajesh Kumar (Badge #D51192)", "rajesh@seerpayanam.in", "9876543211"),
        ("Suresh Babu (Badge #D48012)", "suresh@seerpayanam.in", "9876543212"),
        ("Murugan S (Badge #D15904)", "murugan@seerpayanam.in", "9876543213"),
        ("Karthik R (Badge #D57901)", "karthik@seerpayanam.in", "9876543214"),
        ("Senthil V (Badge #D51009)", "senthil@seerpayanam.in", "9876543215"),
        ("Dhanush M (Badge #D66021)", "dhanush@seerpayanam.in", "9876543216"),
        ("Prabhu K (Badge #D11405)", "prabhu@seerpayanam.in", "9876543217"),
        ("Vignesh A (Badge #D01802)", "vignesh@seerpayanam.in", "9876543218"),
        ("Arjun N (Badge #D02107)", "arjun@seerpayanam.in", "9876543219"),
        ("Manoj P (Badge #D07015)", "manoj@seerpayanam.in", "9876543220"),
        ("Saravanan T (Badge #D01208)", "saravanan@seerpayanam.in", "9876543221"),
        ("Anbazhagan M (Badge #D00503)", "anbu@seerpayanam.in", "9876543222"),
    ]
    drivers = []
    for name, email, phone in drivers_data:
        d = User(name=name, email=email, phone=phone,
                 password_hash=hash_password("test123"), role="driver")
        db.add(d)
        drivers.append(d)

    conductor = User(name="Deepa Krishnan (Conductor #OP-9821)", email="conductor@seerpayanam.in", phone="9000000009",
                     password_hash=hash_password("test123"), role="conductor")
    db.add(conductor)

    passengers_data = [
        ("Priya Muthukumar (Smart Pass)", "priya@gmail.com", "9000000001"),
        ("Arun Karthik (Commuter)", "arun@gmail.com", "9000000002"),
        ("Divya Sundaram (Student Pass)", "divya@gmail.com", "9000000003"),
        ("Vikram Raman (Metro Feeder)", "vikram@gmail.com", "9000000004"),
        ("Lakshmi Narayanan (Senior)", "lakshmi@gmail.com", "9000000005"),
        ("Ganesh Thangavel (Suburban)", "ganesh@gmail.com", "9000000006"),
        ("Meena Padmanabhan (Daily)", "meena@gmail.com", "9000000007"),
        ("Ravi Velu (IT Corridor)", "ravi@gmail.com", "9000000008"),
        ("Kumar Swaminathan (Commuter)", "kumar@gmail.com", "9000000010"),
    ]
    passengers = []
    for name, email, phone in passengers_data:
        p = User(name=name, email=email, phone=phone,
                 password_hash=hash_password("test123"), role="passenger")
        db.add(p)
        passengers.append(p)

    db.flush()

    for i, p in enumerate(passengers):
        # Tamil Nadu Government Smart Transit Card Number Format
        card_num = f"TN-MTC-2026-{i + 1:04d}"
        card = SmartCard(
            passenger_id=p.id,
            card_number=card_num,
            balance=500.0,
            is_active=True
        )
        db.add(card)

    # Routes derived directly from Theme 4 MTC Shapefiles & ETM March 2026 logs
    routes_data = [
        {
            "route_number": "159",
            "name": "Vallalar Nagar to Thiruverkadu via Koyambedu (High-Overcrowding Pilot)",
            "source": "Vallalar Nagar",
            "destination": "Thiruverkadu",
            "distance": 22.5,
            "stops": [
                ("Thiruvottiyur B.T", 13.1570, 80.3000),
                ("Vallalar Nagar", 13.1090, 80.2810),
                ("Choolai P.O", 13.0910, 80.2690),
                ("Dasaprakash", 13.0820, 80.2580),
                ("Aminjikarai", 13.0710, 80.2290),
                ("M.G.R. Koyambedu (CMBT Metro)", 13.0694, 80.2002),
                ("Maduravoyal", 13.0630, 80.1710),
                ("Thiruverkadu", 13.0720, 80.1260),
            ]
        },
        {
            "route_number": "48C",
            "name": "Ayanavaram to M.G.R. Koyambedu (Metro Feeder Corridor)",
            "source": "Ayanavaram B.T",
            "destination": "M.G.R. Koyambedu",
            "distance": 9.7,
            "stops": [
                ("Ayanavaram B.T", 13.0990, 80.2370),
                ("Sayani / Ayanavaram", 13.0965, 80.2340),
                ("Nathamuni Talkies", 13.0930, 80.2220),
                ("Villivakkam", 13.1060, 80.2080),
                ("Anna Nagar West", 13.0900, 80.1950),
                ("Thirumangalam Metro", 13.0858, 80.2005),
                ("M.G.R. Koyambedu (CMBT)", 13.0694, 80.2002),
            ]
        },
        {
            "route_number": "579C",
            "name": "Red Hills to Chennai Central (Suburban Overlap Corridor)",
            "source": "Red Hills",
            "destination": "Chennai Central",
            "distance": 21.0,
            "stops": [
                ("Red Hills Bus Stand", 13.1980, 80.1960),
                ("Kavangarai", 13.1720, 80.2030),
                ("Puzhal Camp", 13.1550, 80.2110),
                ("Kolathur", 13.1240, 80.2180),
                ("Perambur Church", 13.1090, 80.2410),
                ("Pulianthope Police Station", 13.0980, 80.2640),
                ("Chennai Central (Metro/Rail)", 13.0836, 80.2753),
            ]
        },
        {
            "route_number": "51X",
            "name": "Velachery to Kilambakkam KCBT via Tambaram East",
            "source": "Velachery B.T",
            "destination": "KCBT Kilambakkam",
            "distance": 26.5,
            "stops": [
                ("Velachery B.T (MRTS)", 12.9815, 80.2180),
                ("Kaiveli", 12.9690, 80.2060),
                ("Narayanapuram", 12.9460, 80.1880),
                ("Medavakkam Koot Road", 12.9230, 80.1840),
                ("S.I.V.E.T College", 12.9200, 80.1550),
                ("Tambaram East", 12.9249, 80.1278),
                ("Perungalathur", 12.9050, 80.0980),
                ("KCBT - Kilambakkam Terminus", 12.8710, 80.0750),
            ]
        },
        {
            "route_number": "66",
            "name": "Poonamallee to Tambaram West (West-South Radial)",
            "source": "Poonamallee B.T",
            "destination": "Tambaram West",
            "distance": 24.0,
            "stops": [
                ("Poonamallee B.T", 13.0480, 80.0950),
                ("Kumananchavadi", 13.0430, 80.1180),
                ("Iyyappanthangal Metro", 13.0360, 80.1410),
                ("Porur Junction", 13.0385, 80.1568),
                ("Kundrathur Murugan Temple", 12.9980, 80.0970),
                ("Anakaputhur", 12.9850, 80.1270),
                ("Pammal", 12.9710, 80.1340),
                ("Tambaram West", 12.9249, 80.1278),
            ]
        },
        {
            "route_number": "114",
            "name": "Red Hills to M.G.R. Koyambedu CMBT",
            "source": "Red Hills",
            "destination": "M.G.R. Koyambedu",
            "distance": 18.0,
            "stops": [
                ("Red Hills", 13.1980, 80.1960),
                ("Surapet", 13.1510, 80.1780),
                ("Pudur", 13.1320, 80.1820),
                ("Ambattur OT", 13.1143, 80.1548),
                ("Thirumangalam", 13.0858, 80.2005),
                ("M.G.R. Koyambedu", 13.0694, 80.2002),
            ]
        },
        {
            "route_number": "1C",
            "name": "Parry's Corner to T. Nagar",
            "source": "Parry's Corner",
            "destination": "T. Nagar",
            "distance": 8.5,
            "stops": [
                ("Parry's Corner", 13.0827, 80.2707),
                ("High Court Metro", 13.0878, 80.2785),
                ("Chennai Central", 13.0836, 80.2753),
                ("Egmore Station", 13.0732, 80.2609),
                ("Nungambakkam", 13.0569, 80.2425),
                ("Kodambakkam", 13.0520, 80.2280),
                ("T. Nagar Bus Terminus", 13.0418, 80.2341),
            ]
        },
        {
            "route_number": "5B",
            "name": "Broadway to Adyar Depot",
            "source": "Broadway",
            "destination": "Adyar Depot",
            "distance": 12.0,
            "stops": [
                ("Broadway", 13.0878, 80.2785),
                ("Chepauk Stadium", 13.0627, 80.2823),
                ("Triplicane", 13.0580, 80.2772),
                ("Mylapore Tank", 13.0368, 80.2676),
                ("Mandaveli", 13.0270, 80.2620),
                ("Adyar Signal", 13.0067, 80.2565),
                ("Adyar Depot", 12.9990, 80.2530),
            ]
        },
        {
            "route_number": "12G",
            "name": "CMBT to Tambaram Sanatorium via Guindy",
            "source": "CMBT Koyambedu",
            "destination": "Tambaram Sanatorium",
            "distance": 23.5,
            "stops": [
                ("CMBT Koyambedu", 13.0694, 80.2002),
                ("Ashok Nagar Metro", 13.0382, 80.2120),
                ("Saidapet", 13.0220, 80.2218),
                ("Guindy Metro / Rail", 13.0067, 80.2206),
                ("Alandur Interchange", 12.9955, 80.2059),
                ("Chromepet", 12.9516, 80.1419),
                ("Tambaram Sanatorium", 12.9360, 80.1340),
            ]
        },
        {
            "route_number": "18A",
            "name": "Koyambedu to Thiruvanmiyur via Vadapalani & T. Nagar",
            "source": "Koyambedu",
            "destination": "Thiruvanmiyur",
            "distance": 20.0,
            "stops": [
                ("Koyambedu CMBT", 13.0694, 80.1948),
                ("Vadapalani Metro", 13.0516, 80.2122),
                ("Ashok Nagar", 13.0382, 80.2120),
                ("T. Nagar Panagal Park", 13.0418, 80.2341),
                ("Alwarpet", 13.0336, 80.2508),
                ("Mylapore Luz", 13.0368, 80.2676),
                ("Besant Nagar", 13.0002, 80.2670),
                ("Thiruvanmiyur Bus Stand", 12.9830, 80.2694),
            ]
        },
        {
            "route_number": "21H",
            "name": "Chennai Central to OMR Siruseri IT Corridor",
            "source": "Chennai Central",
            "destination": "Siruseri IT Park",
            "distance": 28.0,
            "stops": [
                ("Chennai Central", 13.0836, 80.2753),
                ("Egmore Suburban", 13.0732, 80.2609),
                ("Saidapet", 13.0220, 80.2218),
                ("Guindy Industrial Estate", 13.0067, 80.2206),
                ("Velachery Checkpost", 12.9815, 80.2180),
                ("Sholinganallur Junction", 12.9010, 80.2279),
                ("Navalur", 12.8450, 80.2268),
                ("Siruseri IT Park", 12.8230, 80.2199),
            ]
        },
        {
            "route_number": "M70",
            "name": "Tondiarpet to Chennai Airport Express",
            "source": "Tondiarpet",
            "destination": "Chennai Airport",
            "distance": 24.0,
            "stops": [
                ("Tondiarpet", 13.1130, 80.2880),
                ("Parry's Corner", 13.0827, 80.2707),
                ("Chennai Central", 13.0836, 80.2753),
                ("Egmore", 13.0732, 80.2609),
                ("Nungambakkam", 13.0569, 80.2425),
                ("Guindy", 13.0067, 80.2206),
                ("Alandur", 12.9955, 80.2059),
                ("Tirusulam Suburban", 12.9792, 80.1736),
                ("Chennai Airport Metro", 12.9941, 80.1709),
            ]
        },
    ]

    all_buses = []
    for i, rd in enumerate(routes_data):
        route = BusRoute(
            route_number=rd["route_number"],
            name=rd["name"],
            source=rd["source"],
            destination=rd["destination"],
            total_distance_km=rd["distance"],
        )
        db.add(route)
        db.flush()

        for j, (stop_name, lat, lng) in enumerate(rd["stops"]):
            stop = BusStop(name=stop_name, route_id=route.id, stop_order=j,
                           latitude=lat, longitude=lng, estimated_waiting=0)
            db.add(stop)

        # 3 buses per route: 2 active, 1 standby in depot for dispatch recommendations
        capacities = [(55, 32), (60, 36), (50, 30)]
        for k in range(3):
            cap, seated = capacities[k % len(capacities)]
            bus = Bus(
                bus_number=f"TN01-N-{rd['route_number']}-{k + 1:02d}",
                route_id=route.id,
                driver_id=drivers[i % len(drivers)].id if k == 0 else None,
                total_capacity=cap,
                seated_capacity=seated,
                current_passengers=0,
                current_stop_index=0,
                latitude=rd["stops"][0][1],
                longitude=rd["stops"][0][2],
                status="active" if k < 2 else "depot",
                is_active=k < 2,
            )
            db.add(bus)
            all_buses.append(bus)

    festivals = [
        Festival(name="Pongal Festival", date="2027-01-14", demand_multiplier=2.5,
                 affected_routes=json.dumps(["159", "51X", "579C", "12G", "18A", "66"]),
                 description="Tamil harvest festival — massive outbound travel from CMBT & Kilambakkam"),
        Festival(name="Deepavali", date="2026-11-14", demand_multiplier=2.2,
                 affected_routes=json.dumps(["1C", "18A", "12G", "48C", "21H", "159"]),
                 description="Festival of lights — major shopping surges at T. Nagar, Broadway & CMBT"),
        Festival(name="Tamil New Year (Puthandu)", date="2027-04-14", demand_multiplier=1.8,
                 affected_routes=json.dumps(["159", "48C", "1C", "5B", "M70"]),
                 description="Tamil New Year celebrations — heavy temple travel and beach events"),
        Festival(name="Ayudha Pooja & Vijayadashami", date="2026-10-21", demand_multiplier=1.9,
                 affected_routes=json.dumps(["51X", "66", "114", "12G", "579C"]),
                 description="Special pooja travel — factory and commercial corridor surges"),
        Festival(name="Panguni Uthiram (Mylapore Kapaleeshwarar)", date="2027-03-24", demand_multiplier=2.0,
                 affected_routes=json.dumps(["5B", "18A", "1C", "21H"]),
                 description="Grand Temple Car festival — extreme crowding across Mylapore & Mandaveli"),
    ]
    db.add_all(festivals)

    metro_stations = [
        # Chennai Metro Blue Line (Wimco Nagar to Airport via Central)
        MetroStation(name="Wimco Nagar Metro", station_type="metro", line="Blue Line", latitude=13.1515, longitude=80.3053),
        MetroStation(name="Tiruvottiyur Metro", station_type="metro", line="Blue Line", latitude=13.1570, longitude=80.3000),
        MetroStation(name="Washermanpet Metro", station_type="metro", line="Blue Line", latitude=13.1186, longitude=80.2817),
        MetroStation(name="High Court Metro", station_type="metro", line="Blue Line", latitude=13.0878, longitude=80.2785),
        MetroStation(name="Chennai Central Metro Interchange", station_type="metro", line="Blue Line", latitude=13.0836, longitude=80.2750),
        MetroStation(name="Government Estate Metro", station_type="metro", line="Blue Line", latitude=13.0730, longitude=80.2710),
        MetroStation(name="LIC Metro", station_type="metro", line="Blue Line", latitude=13.0630, longitude=80.2680),
        MetroStation(name="Thousand Lights Metro", station_type="metro", line="Blue Line", latitude=13.0560, longitude=80.2560),
        MetroStation(name="AG-DMS Metro", station_type="metro", line="Blue Line", latitude=13.0450, longitude=80.2510),
        MetroStation(name="Teynampet Metro", station_type="metro", line="Blue Line", latitude=13.0380, longitude=80.2470),
        MetroStation(name="Nandanam Metro", station_type="metro", line="Blue Line", latitude=13.0300, longitude=80.2380),
        MetroStation(name="Saidapet Metro", station_type="metro", line="Blue Line", latitude=13.0220, longitude=80.2280),
        MetroStation(name="Guindy Metro Interchange", station_type="metro", line="Blue Line", latitude=13.0067, longitude=80.2200),
        MetroStation(name="Alandur Metro Hub", station_type="metro", line="Blue Line", latitude=12.9955, longitude=80.2050),
        MetroStation(name="Chennai Airport Metro", station_type="metro", line="Blue Line", latitude=12.9830, longitude=80.1760),
        # Chennai Metro Green Line (CMBT Koyambedu to St. Thomas Mount via Central)
        MetroStation(name="CMBT Koyambedu Metro Hub", station_type="metro", line="Green Line", latitude=13.0694, longitude=80.2002),
        MetroStation(name="Thirumangalam Metro", station_type="metro", line="Green Line", latitude=13.0858, longitude=80.2005),
        MetroStation(name="Anna Nagar Tower Metro", station_type="metro", line="Green Line", latitude=13.0850, longitude=80.2101),
        MetroStation(name="Shenoy Nagar Metro", station_type="metro", line="Green Line", latitude=13.0790, longitude=80.2250),
        MetroStation(name="Arumbakkam Metro", station_type="metro", line="Green Line", latitude=13.0700, longitude=80.2110),
        MetroStation(name="Vadapalani Metro", station_type="metro", line="Green Line", latitude=13.0516, longitude=80.2122),
        MetroStation(name="Ashok Nagar Metro", station_type="metro", line="Green Line", latitude=13.0382, longitude=80.2120),
        MetroStation(name="Ekkattuthangal Metro", station_type="metro", line="Green Line", latitude=13.0170, longitude=80.2060),
        MetroStation(name="St. Thomas Mount Metro", station_type="metro", line="Green Line", latitude=13.0070, longitude=80.1980),
        # Chennai Suburban Railway (Beach-Tambaram & Beach-Arakkonam Lines)
        MetroStation(name="Chennai Beach Terminal", station_type="suburban", line="Beach-Tambaram", latitude=13.0900, longitude=80.2900),
        MetroStation(name="Chennai Fort", station_type="suburban", line="Beach-Tambaram", latitude=13.0840, longitude=80.2870),
        MetroStation(name="Chennai Park Suburban", station_type="suburban", line="Beach-Tambaram", latitude=13.0790, longitude=80.2610),
        MetroStation(name="Egmore Suburban Junction", station_type="suburban", line="Beach-Tambaram", latitude=13.0732, longitude=80.2609),
        MetroStation(name="Chetpet Suburban", station_type="suburban", line="Beach-Tambaram", latitude=13.0710, longitude=80.2440),
        MetroStation(name="Nungambakkam Suburban", station_type="suburban", line="Beach-Tambaram", latitude=13.0569, longitude=80.2425),
        MetroStation(name="Kodambakkam Suburban", station_type="suburban", line="Beach-Tambaram", latitude=13.0520, longitude=80.2280),
        MetroStation(name="Mambalam (T. Nagar)", station_type="suburban", line="Beach-Tambaram", latitude=13.0380, longitude=80.2230),
        MetroStation(name="Saidapet Suburban", station_type="suburban", line="Beach-Tambaram", latitude=13.0220, longitude=80.2218),
        MetroStation(name="Guindy Suburban", station_type="suburban", line="Beach-Tambaram", latitude=13.0067, longitude=80.2206),
        MetroStation(name="St. Thomas Mount Suburban", station_type="suburban", line="Beach-Tambaram", latitude=13.0010, longitude=80.1990),
        MetroStation(name="Pallavaram Suburban", station_type="suburban", line="Beach-Tambaram", latitude=12.9667, longitude=80.1500),
        MetroStation(name="Chromepet Suburban", station_type="suburban", line="Beach-Tambaram", latitude=12.9516, longitude=80.1419),
        MetroStation(name="Tambaram Sanatorium", station_type="suburban", line="Beach-Tambaram", latitude=12.9360, longitude=80.1340),
        MetroStation(name="Tambaram Suburban Terminal", station_type="suburban", line="Beach-Tambaram", latitude=12.9249, longitude=80.1278),
        MetroStation(name="Perambur Suburban Junction", station_type="suburban", line="Beach-Arakkonam", latitude=13.1070, longitude=80.2324),
        MetroStation(name="Villivakkam Suburban", station_type="suburban", line="Beach-Arakkonam", latitude=13.1060, longitude=80.2080),
        MetroStation(name="Ambattur Suburban", station_type="suburban", line="Beach-Arakkonam", latitude=13.1143, longitude=80.1548),
        MetroStation(name="Avadi Suburban Junction", station_type="suburban", line="Beach-Arakkonam", latitude=13.1145, longitude=80.1010),
    ]
    db.add_all(metro_stations)

    db.commit()
    print(f"TN-ITIS Seeded: 1 Admin, {len(drivers)} Drivers, {len(passengers)} Passengers with TN Smart Passes, "
          f"{len(routes_data)} MTC Corridors, {len(all_buses)} Buses, {len(festivals)} Festivals, "
          f"{len(metro_stations)} Metro & Suburban Stations.")


if __name__ == "__main__":
    from database import SessionLocal
    db = SessionLocal()
    seed_database(db, force=True)
    db.close()
