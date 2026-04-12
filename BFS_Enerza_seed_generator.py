"""
BFS Enerza — Complete Seed Data Generator
==========================================
Populates ALL 48 tables with realistic Indian CGD/utility data.
Run: python seed_data.py
Output: seed_data.sql (PostgreSQL-compatible INSERT statements)
        seed_data_summary.txt (counts per table)

Scale:
  20,000 customers  |  20,200 premises  |  20,000 accounts
  22,000 service connections (some customers have 2 utilities)
  22,000 meters + installations
  88,000 meter readings (4 months × 22k connections)
  88,000 bills (4 billing cycles)
  72,000 payment orders  |  25 CNG stations  |  120,000 CNG sales
  50 API partners  |  500K+ audit records (sampled to 10k)
"""

import random, math, hashlib, uuid
from datetime import date, timedelta, datetime

random.seed(42)

# ─── helpers ─────────────────────────────────────────────────────────────────
def q(v):
    """Quote a value for SQL."""
    if v is None: return "NULL"
    if isinstance(v, bool): return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float)): return str(v)
    if isinstance(v, date): return f"'{v}'"
    s = str(v).replace("'", "''")
    return f"'{s}'"

def ins(table, cols, rows):
    """Generate INSERT statements in batches of 500."""
    out = []
    col_str = ", ".join(cols)
    for i in range(0, len(rows), 500):
        batch = rows[i:i+500]
        vals = ",\n  ".join("(" + ", ".join(q(c) for c in r) + ")" for r in batch)
        out.append(f"INSERT INTO {table} ({col_str}) VALUES\n  {vals}\nON CONFLICT DO NOTHING;")
    return "\n\n".join(out)

# ─── reference data ───────────────────────────────────────────────────────────
FIRST = ['Ramesh','Priya','Suresh','Anita','Mahesh','Kavita','Rajesh','Sunita',
         'Vikram','Deepa','Nilesh','Meena','Girish','Jyoti','Rakesh','Pooja',
         'Dinesh','Rekha','Haresh','Smita','Bhavesh','Hiral','Chirag','Nisha',
         'Paresh','Leena','Vijay','Usha','Sanjay','Heena','Kiran','Varsha',
         'Alpesh','Manju','Hitesh','Geeta','Jayesh','Aarti','Manish','Kalpana',
         'Ashok','Pushpa','Yogesh','Ritu','Naresh','Sonal','Devang','Shilpa',
         'Mitesh','Neha','Amrish','Bhavna','Chetan','Daksha','Esha','Farhan',
         'Gopi','Harsha','Ishaan','Juhi','Kamlesh','Lata','Mohan','Nalini',
         'Om','Parth','Quresh','Ravi','Sarita','Tarun','Uma','Varsha','Wasim',
         'Xena','Yash','Zara','Aditya','Bharati','Chandresh','Dipti','Ekta']
LAST = ['Shah','Patel','Desai','Mehta','Joshi','Modi','Trivedi','Raval','Bhatt',
        'Parikh','Kapoor','Sharma','Verma','Gupta','Singh','Pandya','Soni',
        'Thakkar','Dave','Vyas','Kulkarni','Patil','Pawar','More','Jadhav',
        'Shinde','Kadam','Powar','Gaikwad','Salve','Reddy','Rao','Naidu',
        'Kumar','Murthy','Pillai','Nair','Iyer','Menon','Krishnan','Agarwal',
        'Bansal','Chopra','Dhawan','Fernandes','Goel','Hora','Irani','Juneja']

CITIES = {
    'Ahmedabad': {'state':'Gujarat','areas':['AHM-WEST','AHM-EAST','AHM-NORTH','AHM-SOUTH','AHM-CENTRAL'],
                  'pincodes':['380001','380006','380007','380008','380009','380013','380015','380051','380052','380058']},
    'Surat':     {'state':'Gujarat','areas':['SUR-NORTH','SUR-SOUTH','SUR-EAST','SUR-WEST'],
                  'pincodes':['395001','395002','395003','395004','395005','395006','395007','395010']},
    'Vadodara':  {'state':'Gujarat','areas':['VAD-CENTRAL','VAD-EAST','VAD-WEST','VAD-NORTH'],
                  'pincodes':['390001','390002','390003','390004','390005','390006','390007','390020']},
    'Gandhinagar':{'state':'Gujarat','areas':['GAN-NORTH','GAN-SOUTH','GAN-EAST'],
                   'pincodes':['382010','382020','382021','382023','382024','382030']},
    'Rajkot':    {'state':'Gujarat','areas':['RAJ-CENTRAL','RAJ-EAST','RAJ-WEST'],
                  'pincodes':['360001','360002','360003','360004','360005','360007']},
    'Pune':      {'state':'Maharashtra','areas':['PUN-CENTRAL','PUN-EAST','PUN-WEST','PUN-NORTH'],
                  'pincodes':['411001','411002','411004','411005','411007','411015','411016','411028']},
    'Nagpur':    {'state':'Maharashtra','areas':['NAG-CENTRAL','NAG-EAST','NAG-WEST'],
                  'pincodes':['440001','440002','440003','440004','440005','440006','440010']},
    'Indore':    {'state':'Madhya Pradesh','areas':['IND-CENTRAL','IND-EAST','IND-WEST'],
                  'pincodes':['452001','452002','452003','452006','452007','452010','452011']},
}
ALL_CITIES = list(CITIES.keys())

STREETS = ['MG Road','Station Road','Ring Road','Satellite Road','Navrangpura Road',
           'CG Road','Ashram Road','SP Ring Road','Paldi Road','Vastrapur Road',
           'Maninagar Road','Bopal Road','Gota Road','Thaltej Road','Chandkheda Road',
           'Civil Road','University Road','Bodakdev Road','Anand Nagar Road','Jodhpur Road',
           'Law Garden Road','Ambawadi Road','Gurukul Road','Prahlad Nagar Road','Shyamal Road',
           'Vejalpur Road','Juhapura Road','Nikol Road','Vastral Road','Bavla Road']

SOCIETIES = ['Shanti Nagar','Green Valley','Rajkamal Society','Shivam Flats','Swami Krupa',
             'Saraswati Park','Ganesh Complex','Laxmi Nagar','Radhe Complex','Krishna Society',
             'Om Shanti Apartments','Suvidha Complex','Sundaram Society','Vrundavan Flats',
             'Royal Enclave','Silver Heights','Golden Residency','Anand Nagar','Heritage Park',
             'Evergreen Society','New Horizon','Sunrise Complex','Tulip Gardens','Palm Grove',
             'Emerald Heights','Diamond Residency','Pearl Apartments','Sapphire Tower','Ruby Park',
             'Topaz Society']

METER_MAKES = ['Elster','Itron','Landis+Gyr','Honeywell','Secure','L&T','HPL','Genus','Holley','Wasion']
METER_MODELS_GAS  = ['G4 Diaphragm','G6 Diaphragm','G10 Diaphragm','G16 Rotary','G25 Rotary','G40 Turbine']
METER_MODELS_ELEC = ['EM4M','EM3P','SM210','SM230','SM310','DT200','DT300','ST-100','ST-200','PMAX-60']
METER_MODELS_WATER= ['WM-15','WM-20','WM-25','WM-32','WM-40','WM-50','DN15','DN20','DN25','DN32']

VEHICLE_TYPES = [
    ('VEH-001','Private Car (CNG)',      'PRIVATE_CAR',    8.0,  False),
    ('VEH-002','Auto Rickshaw',          'AUTO_RICKSHAW',  3.5,  True),
    ('VEH-003','CNG Bus (Large)',        'BUS_LARGE',      50.0, True),
    ('VEH-004','CNG Bus (Mini)',         'BUS_MINI',       25.0, True),
    ('VEH-005','CNG Truck (LCV)',        'TRUCK_LCV',      15.0, True),
    ('VEH-006','CNG Truck (HCV)',        'TRUCK_HCV',      30.0, True),
    ('VEH-007','Private SUV (CNG)',      'PRIVATE_SUV',    12.0, False),
    ('VEH-008','Taxi/Cab (CNG)',         'TAXI',           8.0,  True),
    ('VEH-009','Government Vehicle',     'GOVT_VEHICLE',   10.0, True),
    ('VEH-010','Two-Wheeler (CNG)',      'TWO_WHEELER',    1.5,  False),
]

BANKS = ['HDFC Bank','ICICI Bank','SBI','Axis Bank','Kotak Bank','Yes Bank','IDFC Bank','IndusInd Bank']
PAYMENT_MODES = ['UPI','CARD','NET_BANKING','CASH','CHEQUE','NACH','BBPS']

NOTIF_EVENTS = ['BILL_GENERATED','PAYMENT_SUCCESS','PAYMENT_FAILED','DUE_REMINDER',
                'OVERDUE_ALERT','DISCONNECTION_WARNING','RECONNECTION_COMPLETE',
                'READING_SUBMITTED','SERVICE_REQUEST_UPDATE','KYC_VERIFIED',
                'OTP_LOGIN','NEW_CONNECTION_APPROVED','SUBSIDY_CREDIT']

SR_TYPES = [
    ('SRT-001','Billing','Incorrect Bill Amount',   48, 'HIGH',   'Billing'),
    ('SRT-002','Billing','Bill Not Received',        24, 'MEDIUM', 'Billing'),
    ('SRT-003','Billing','Duplicate Bill',           24, 'MEDIUM', 'Billing'),
    ('SRT-004','Metering','Meter Not Working',        4,  'HIGH',   'Operations'),
    ('SRT-005','Metering','Meter Reading Dispute',   48, 'MEDIUM', 'Operations'),
    ('SRT-006','Metering','Meter Replacement',        72, 'LOW',    'Operations'),
    ('SRT-007','Connection','Gas Leak',              1,  'CRITICAL','Emergency'),
    ('SRT-008','Connection','No Gas Supply',          4,  'HIGH',   'Operations'),
    ('SRT-009','Connection','New Connection Request',168,'LOW',    'Operations'),
    ('SRT-010','Connection','Disconnection Request', 48, 'MEDIUM', 'Operations'),
    ('SRT-011','Payment','Refund Request',            72, 'HIGH',   'Finance'),
    ('SRT-012','Payment','Payment Not Reflecting',   24, 'HIGH',   'Finance'),
    ('SRT-013','KYC','Document Update',              48, 'MEDIUM', 'Operations'),
    ('SRT-014','General','Address Change',            72, 'LOW',    'Operations'),
    ('SRT-015','General','Feedback / Complaint',      72, 'LOW',    'Customer Care'),
]

API_PARTNER_TYPES = ['BBPS_AGENT','PAYMENT_AGGREGATOR','GOVT_PORTAL','ENTERPRISE_ERP',
                     'INSURANCE_PARTNER','BANK_INTEGRATION','MOBILE_APP','FIELD_APP']

# ─── ID generators ────────────────────────────────────────────────────────────
def uid(prefix, n, width=6): return f"{prefix}{str(n).zfill(width)}"

# ─── fixed seed password hash (bcrypt of 'Enerza@2026') ──────────────────────
BCRYPT_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeSSdMuQk9HQHJMzMZKXYHrKK'

print("Generating seed data for all 48 tables...")

sections = []

# ═══════════════════════════════════════════════════════════════════════════════
# 1. SYSTEM USERS (50 back-office staff)
# ═══════════════════════════════════════════════════════════════════════════════
ROLES = ['SUPER_ADMIN','ADMIN','OPERATIONS','BILLING','FINANCE','IT','READ_ONLY']
DEPTS = ['IT','Operations','Billing','Finance','Customer Care','Compliance']
system_users = []
for i in range(1, 51):
    role = ROLES[0] if i == 1 else random.choice(ROLES[1:])
    fn = random.choice(FIRST); ln = random.choice(LAST)
    system_users.append((
        uid('USR', i, 8),
        f"user{i:04d}",
        f"user{i:04d}@bfsenerza.in",
        f"{fn} {ln}",
        BCRYPT_HASH,
        role,
        random.choice(DEPTS),
        True,
        date(2024, 1, 1) + timedelta(days=random.randint(0, 400)),
        date(2024, 1, 15) + timedelta(days=random.randint(0, 400)),
    ))

SU_COLS = ['user_id','username','email','full_name','hashed_password','role',
           'department','is_active','last_login','created_on']
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append("-- 1. SYSTEM USERS")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('system_users', SU_COLS, system_users))

SU_IDS = [r[0] for r in system_users]

# ═══════════════════════════════════════════════════════════════════════════════
# 2. CGD AREAS (30 areas across 8 cities)
# ═══════════════════════════════════════════════════════════════════════════════
cgd_areas = []
area_id_map = {}  # area_id -> city
n = 1
for city, info in CITIES.items():
    for area_code in info['areas']:
        aid = f"AREA{n:04d}"
        cgd_areas.append((
            aid, f"{city} - {area_code}", city, city, info['state'],
            area_code[:3], 'GAS_PNG', 'ACTIVE',
            random.choice(SU_IDS), date(2020, 1, 1)
        ))
        area_id_map[aid] = {'city': city, 'state': info['state'],
                            'pincodes': info['pincodes'], 'code': area_code}
        n += 1

AREA_COLS = ['area_id','area_name','city','district','state','zone',
             'utility_type','status','created_by','created_on']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 2. CGD AREAS")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('cgd_areas', AREA_COLS, cgd_areas))

ALL_AREA_IDS = [r[0] for r in cgd_areas]

# ═══════════════════════════════════════════════════════════════════════════════
# 3. ROUTES (80 routes — ~2-3 per area)
# ═══════════════════════════════════════════════════════════════════════════════
routes = []
route_id_map = {}  # route_id -> area_id
for i, aid in enumerate(ALL_AREA_IDS):
    for j in range(random.randint(2, 3)):
        rid = f"RTE{(len(routes)+1):04d}"
        routes.append((
            rid, aid, f"Route {aid[-4:]}-{j+1:02d}",
            f"CYC-{random.randint(1,4):02d}",
            f"READER{random.randint(1,20):03d}",
            'ACTIVE', date(2020, 6, 1)
        ))
        route_id_map[rid] = aid

RTE_COLS = ['route_id','area_id','route_name','cycle_group','reader_id','status','effective_from']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 3. ROUTES")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('routes', RTE_COLS, routes))

ALL_ROUTE_IDS = [r[0] for r in routes]

# ═══════════════════════════════════════════════════════════════════════════════
# 4. GRID ZONES (40)
# ═══════════════════════════════════════════════════════════════════════════════
grid_zones = []
for i, aid in enumerate(ALL_AREA_IDS[:20]):
    city = area_id_map[aid]['city']
    grid_zones.append((
        f"GZ{(i+1):04d}", f"{city} Grid Zone {i+1}",
        aid, random.choice(['11kV','33kV','66kV','110kV']),
        f"{city} Electricity Distribution Co.", 'ACTIVE'
    ))

GZ_COLS = ['zone_id','zone_name','area_id','voltage_level','distribution_company','status']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 4. GRID ZONES")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('grid_zones', GZ_COLS, grid_zones))

# ═══════════════════════════════════════════════════════════════════════════════
# 5. WATER SUPPLY ZONES (25)
# ═══════════════════════════════════════════════════════════════════════════════
water_zones = []
for i, aid in enumerate(ALL_AREA_IDS[:25]):
    city = area_id_map[aid]['city']
    water_zones.append((
        f"WSZ{(i+1):04d}", f"{city} Water Zone {i+1}",
        aid, f"WTP-{city[:3].upper()}-{i+1:02d}",
        random.choice([8, 12, 16, 20, 24]), 'ACTIVE'
    ))

WSZ_COLS = ['supply_zone_id','zone_name','area_id','treatment_plant_id','supply_hours_per_day','status']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 5. WATER SUPPLY ZONES")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('water_supply_zones', WSZ_COLS, water_zones))

WSZ_IDS = [r[0] for r in water_zones]

# ═══════════════════════════════════════════════════════════════════════════════
# 6. CONSUMER SEGMENTS (12)
# ═══════════════════════════════════════════════════════════════════════════════
segments = [
    ('SEG-001','Domestic PNG',         'GAS_PNG',     'Residential piped gas',     '{"building_type":"RESIDENTIAL"}'),
    ('SEG-002','Commercial PNG',       'GAS_PNG',     'Commercial/hotel/restaurant','{"building_type":"COMMERCIAL"}'),
    ('SEG-003','Industrial PNG',       'GAS_PNG',     'Industrial manufacturing',   '{"load_min_scm_day":50}'),
    ('SEG-004','CNG Private',          'GAS_CNG',     'Private vehicle CNG',        '{"vehicle_type":"PRIVATE"}'),
    ('SEG-005','CNG Commercial',       'GAS_CNG',     'Commercial fleet CNG',       '{"vehicle_type":"COMMERCIAL"}'),
    ('SEG-006','Domestic Electricity', 'ELECTRICITY', 'Residential electricity',    '{"load_max_kw":10}'),
    ('SEG-007','Commercial Electricity','ELECTRICITY','Commercial electricity',     '{"load_min_kw":10}'),
    ('SEG-008','Industrial Electricity','ELECTRICITY','Industrial power',           '{"load_min_kw":100}'),
    ('SEG-009','Domestic Water',       'WATER',       'Residential water supply',   '{"pipe_max_mm":25}'),
    ('SEG-010','Commercial Water',     'WATER',       'Commercial water supply',    '{"pipe_min_mm":25}'),
    ('SEG-011','BPL Domestic PNG',     'GAS_PNG',     'Below poverty line domestic','{"bpl_flag":true}'),
    ('SEG-012','Bulk PNG',             'GAS_PNG',     'Bulk gas for apartments',    '{"min_connections":10}'),
]
SEG_COLS = ['segment_id','segment_name','utility_type','description','eligibility_rules']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 6. CONSUMER SEGMENTS")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('consumer_segments', SEG_COLS, [(r[0],r[1],r[2],r[3],r[4],'ACTIVE') for r in segments]))

SEG_COLS2 = ['segment_id','segment_name','utility_type','description','eligibility_rules','status']
# Fix segments to include status
seg_rows = [(r[0],r[1],r[2],r[3],r[4],'ACTIVE') for r in segments]
sections[-1] = ins('consumer_segments', SEG_COLS2, seg_rows)

SEG_IDS_PNG  = ['SEG-001','SEG-002','SEG-003','SEG-011','SEG-012']
SEG_IDS_ELEC = ['SEG-006','SEG-007','SEG-008']
SEG_IDS_WATER= ['SEG-009','SEG-010']
SEG_IDS_CNG  = ['SEG-004','SEG-005']

# ═══════════════════════════════════════════════════════════════════════════════
# 7. PRESSURE BANDS (8)
# ═══════════════════════════════════════════════════════════════════════════════
pressure_bands = [
    ('PB-001','Low Pressure (Domestic)',    0.001, 0.05,  'DOMESTIC',    'MPa'),
    ('PB-002','Medium Pressure A',          0.05,  0.4,   'COMMERCIAL',  'MPa'),
    ('PB-003','Medium Pressure B',          0.4,   4.0,   'INDUSTRIAL',  'MPa'),
    ('PB-004','High Pressure',              4.0,   70.0,  'TRANSMISSION','MPa'),
    ('PB-005','CNG Station Inlet',          15.0,  25.0,  'CNG',         'MPa'),
    ('PB-006','CNG Cascade',                200.0, 250.0, 'CNG_CASCADE', 'bar'),
    ('PB-007','Very Low Pressure',          0.0001,0.001, 'DOMESTIC_LP', 'MPa'),
    ('PB-008','Industrial High',            4.0,   15.0,  'INDUSTRIAL_H','MPa'),
]
PB_COLS = ['band_id','band_name','min_pressure','max_pressure','usage_class','uom','status']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 7. PRESSURE BANDS")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('pressure_bands', PB_COLS, [r + ('ACTIVE',) for r in pressure_bands]))

PB_IDS_DOM = ['PB-001','PB-007']
PB_IDS_COM = ['PB-002']
PB_IDS_IND = ['PB-003','PB-008']

# ═══════════════════════════════════════════════════════════════════════════════
# 8. TAX MASTER (10 tax codes)
# ═══════════════════════════════════════════════════════════════════════════════
taxes = [
    ('TAX-001','GST 5%  (PNG Domestic)',        'Central+State', 5.00,  'Piped Natural Gas domestic',  date(2017,7,1),  None),
    ('TAX-002','GST 18% (Commercial Gas)',       'Central+State', 18.00, 'Commercial/Industrial gas',   date(2017,7,1),  None),
    ('TAX-003','GST 18% (Meter Rent)',           'Central+State', 18.00, 'Electricity meter rent',      date(2017,7,1),  None),
    ('TAX-004','Electricity Duty 15%',           'State',         15.00, 'Gujarat electricity duty',    date(2020,4,1),  None),
    ('TAX-005','Water Tax 5%',                   'Municipal',      5.00, 'Municipal water cess',        date(2021,4,1),  None),
    ('TAX-006','GST 5%  (CNG)',                  'Central+State',  5.00, 'Compressed Natural Gas',      date(2017,7,1),  None),
    ('TAX-007','Environment Cess 1%',            'State',          1.00, 'Gujarat env cess on gas',     date(2022,4,1),  None),
    ('TAX-008','Infrastructure Development Levy','Municipal',       2.00, 'IDL on new connections',      date(2021,4,1),  None),
    ('TAX-009','GST 12% (CNG Commercial)',       'Central+State', 12.00, 'CNG commercial fleet',        date(2020,4,1),  None),
    ('TAX-010','Electricity Duty 10% (Domestic)','State',         10.00, 'Gujarat domestic elec duty',  date(2020,4,1),  None),
]
TAX_COLS = ['tax_id','tax_name','jurisdiction','tax_rate','applicability',
            'effective_from','effective_to','status']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 8. TAX MASTER")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('tax_master', TAX_COLS, [r + ('ACTIVE',) for r in taxes]))

# ═══════════════════════════════════════════════════════════════════════════════
# 9. BILL CYCLES (4)
# ═══════════════════════════════════════════════════════════════════════════════
bill_cycles = [
    ('CYC-001','Monthly Cycle 1 (8th read)',  'Day 5  of month', 'Day 8  of month', 'Day 28 of month', 20, 'ACTIVE'),
    ('CYC-002','Monthly Cycle 2 (15th read)', 'Day 12 of month', 'Day 15 of month', 'Day 5  next',     20, 'ACTIVE'),
    ('CYC-003','Monthly Cycle 3 (22nd read)', 'Day 19 of month', 'Day 22 of month', 'Day 12 next',     20, 'ACTIVE'),
    ('CYC-004','Quarterly Cycle',             'Day 1  of quarter','Day 5  of quarter','Day 25 of month',25, 'ACTIVE'),
]
CYC_COLS = ['cycle_id','cycle_name','read_date_rule','bill_date_rule',
            'due_date_rule','grace_days','status']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 9. BILL CYCLES")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('bill_cycles', CYC_COLS, bill_cycles))

CYC_IDS = [r[0] for r in bill_cycles]

# ═══════════════════════════════════════════════════════════════════════════════
# 10. RATE PLANS (15)
# ═══════════════════════════════════════════════════════════════════════════════
rate_plans = [
    ('RP-GAS-DOM-01', 'Domestic PNG Slab Rate',    'GAS_PNG',     'SEG-001', date(2023,4,1), None,           'MONTHLY',    'ACTIVE', SU_IDS[0], date(2023,4,1)),
    ('RP-GAS-DOM-02', 'BPL PNG Subsidised Rate',   'GAS_PNG',     'SEG-011', date(2023,4,1), None,           'MONTHLY',    'ACTIVE', SU_IDS[0], date(2023,4,1)),
    ('RP-GAS-COM-01', 'Commercial PNG Flat Rate',  'GAS_PNG',     'SEG-002', date(2023,4,1), None,           'MONTHLY',    'ACTIVE', SU_IDS[0], date(2023,4,1)),
    ('RP-GAS-IND-01', 'Industrial PNG Rate',       'GAS_PNG',     'SEG-003', date(2023,4,1), None,           'MONTHLY',    'ACTIVE', SU_IDS[0], date(2023,4,1)),
    ('RP-GAS-BULK-01','Bulk PNG Rate',              'GAS_PNG',     'SEG-012', date(2023,4,1), None,           'MONTHLY',    'ACTIVE', SU_IDS[0], date(2023,4,1)),
    ('RP-CNG-PVT-01', 'CNG Private Vehicle',       'GAS_CNG',     'SEG-004', date(2023,4,1), None,           'PER_FILL',   'ACTIVE', SU_IDS[0], date(2023,4,1)),
    ('RP-CNG-COM-01', 'CNG Commercial Fleet',      'GAS_CNG',     'SEG-005', date(2023,4,1), None,           'PER_FILL',   'ACTIVE', SU_IDS[0], date(2023,4,1)),
    ('RP-ELEC-DOM-01','Domestic Electricity Slab', 'ELECTRICITY', 'SEG-006', date(2023,4,1), None,           'MONTHLY',    'ACTIVE', SU_IDS[0], date(2023,4,1)),
    ('RP-ELEC-COM-01','Commercial Electricity',    'ELECTRICITY', 'SEG-007', date(2023,4,1), None,           'MONTHLY',    'ACTIVE', SU_IDS[0], date(2023,4,1)),
    ('RP-ELEC-IND-01','Industrial Electricity',    'ELECTRICITY', 'SEG-008', date(2023,4,1), None,           'MONTHLY',    'ACTIVE', SU_IDS[0], date(2023,4,1)),
    ('RP-WATER-DOM-01','Domestic Water Slab',      'WATER',       'SEG-009', date(2023,4,1), None,           'MONTHLY',    'ACTIVE', SU_IDS[0], date(2023,4,1)),
    ('RP-WATER-COM-01','Commercial Water',         'WATER',       'SEG-010', date(2023,4,1), None,           'MONTHLY',    'ACTIVE', SU_IDS[0], date(2023,4,1)),
    ('RP-GAS-DOM-OLD','Old Domestic PNG Rate',     'GAS_PNG',     'SEG-001', date(2021,4,1), date(2023,3,31),'MONTHLY',    'INACTIVE',SU_IDS[0],date(2021,4,1)),
    ('RP-ELEC-DOM-OLD','Old Domestic Elec Rate',   'ELECTRICITY', 'SEG-006', date(2021,4,1), date(2023,3,31),'MONTHLY',    'INACTIVE',SU_IDS[0],date(2021,4,1)),
    ('RP-GAS-CNG-OLD','Old CNG Rate',              'GAS_CNG',     'SEG-004', date(2021,4,1), date(2023,3,31),'PER_FILL',   'INACTIVE',SU_IDS[0],date(2021,4,1)),
]
RP_COLS = ['rate_plan_id','plan_name','utility_type','segment_id','effective_from',
           'effective_to','billing_freq','status','created_by','created_on']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 10. RATE PLANS")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('rate_plans', RP_COLS, rate_plans))

# ═══════════════════════════════════════════════════════════════════════════════
# 11. CHARGE COMPONENTS (60 components across rate plans)
# ═══════════════════════════════════════════════════════════════════════════════
charge_components = []
cc_idx = 1

def cc(plan_id, name, ctype, rate, posting, sf=None, st=None, tax_id=None):
    global cc_idx
    row = (f"CC{cc_idx:05d}", plan_id, name, ctype, 'SCM' if 'PNG' in plan_id or 'CNG' in plan_id else ('kWh' if 'ELEC' in plan_id else 'KL'),
           rate, posting or 'UTIL_CHARGE', sf, st, tax_id, 'ACTIVE')
    cc_idx += 1
    return row

# RP-GAS-DOM-01
charge_components += [
    cc('RP-GAS-DOM-01','Fixed Monthly Charge',     'FIXED',    120.00, 'GAS_FIXED'),
    cc('RP-GAS-DOM-01','Variable Slab 1 (0-10 SCM)','VARIABLE', 30.00,'GAS_ENERGY', 0, 10),
    cc('RP-GAS-DOM-01','Variable Slab 2 (10-30 SCM)','VARIABLE',35.00,'GAS_ENERGY',10, 30),
    cc('RP-GAS-DOM-01','Variable Slab 3 (>30 SCM)', 'VARIABLE', 42.00,'GAS_ENERGY',30, None),
    cc('RP-GAS-DOM-01','GST @ 5%',                  'TAX',       0.05, 'TAX_GST',   None, None, 'TAX-001'),
]
# RP-GAS-DOM-02 (BPL)
charge_components += [
    cc('RP-GAS-DOM-02','Fixed Monthly Charge (BPL)', 'FIXED',    60.00,'GAS_FIXED'),
    cc('RP-GAS-DOM-02','Variable (0-8 SCM) BPL',     'VARIABLE', 20.00,'GAS_ENERGY',0,8),
    cc('RP-GAS-DOM-02','Variable (>8 SCM) BPL',      'VARIABLE', 30.00,'GAS_ENERGY',8,None),
    cc('RP-GAS-DOM-02','GST @ 5%',                   'TAX',       0.05,'TAX_GST',None,None,'TAX-001'),
]
# RP-GAS-COM-01
charge_components += [
    cc('RP-GAS-COM-01','Fixed Monthly Charge',  'FIXED',    350.00,'GAS_FIXED'),
    cc('RP-GAS-COM-01','Variable Charge',       'VARIABLE',  38.00,'GAS_ENERGY',0,None),
    cc('RP-GAS-COM-01','GST @ 18%',             'TAX',        0.18,'TAX_GST',None,None,'TAX-002'),
]
# RP-GAS-IND-01
charge_components += [
    cc('RP-GAS-IND-01','Fixed Monthly Demand Charge','FIXED',  2000.00,'GAS_FIXED'),
    cc('RP-GAS-IND-01','Variable Charge',            'VARIABLE',  32.00,'GAS_ENERGY',0,None),
    cc('RP-GAS-IND-01','GST @ 18%',                  'TAX',        0.18,'TAX_GST',None,None,'TAX-002'),
    cc('RP-GAS-IND-01','Environment Cess 1%',         'TAX',        0.01,'TAX_CESS',None,None,'TAX-007'),
]
# RP-CNG-PVT-01
charge_components += [
    cc('RP-CNG-PVT-01','CNG Retail Price',  'VARIABLE', 80.00,'CNG_RETAIL',0,None),
    cc('RP-CNG-PVT-01','GST @ 5%',          'TAX',       0.05,'TAX_GST',None,None,'TAX-006'),
]
# RP-CNG-COM-01
charge_components += [
    cc('RP-CNG-COM-01','CNG Fleet Price',   'VARIABLE', 75.00,'CNG_FLEET',0,None),
    cc('RP-CNG-COM-01','GST @ 12%',          'TAX',      0.12,'TAX_GST',None,None,'TAX-009'),
]
# RP-ELEC-DOM-01
charge_components += [
    cc('RP-ELEC-DOM-01','Meter Rent',                'FIXED',    45.00,'ELEC_METER_RENT'),
    cc('RP-ELEC-DOM-01','Energy Slab 1 (0-100 kWh)', 'VARIABLE',  3.50,'ELEC_ENERGY',0,100),
    cc('RP-ELEC-DOM-01','Energy Slab 2 (101-300 kWh)','VARIABLE', 5.00,'ELEC_ENERGY',100,300),
    cc('RP-ELEC-DOM-01','Energy Slab 3 (>300 kWh)',  'VARIABLE',  7.50,'ELEC_ENERGY',300,None),
    cc('RP-ELEC-DOM-01','Electricity Duty 10%',      'TAX',        0.10,'TAX_ELEC_DUTY',None,None,'TAX-010'),
    cc('RP-ELEC-DOM-01','GST 18% on Meter Rent',     'TAX',        0.18,'TAX_GST',None,None,'TAX-003'),
]
# RP-ELEC-COM-01
charge_components += [
    cc('RP-ELEC-COM-01','Demand Charge',             'FIXED',   500.00,'ELEC_DEMAND'),
    cc('RP-ELEC-COM-01','Energy Charge',             'VARIABLE',  6.50,'ELEC_ENERGY',0,None),
    cc('RP-ELEC-COM-01','Electricity Duty 15%',      'TAX',        0.15,'TAX_ELEC_DUTY',None,None,'TAX-004'),
    cc('RP-ELEC-COM-01','GST 18% on Fixed',          'TAX',        0.18,'TAX_GST',None,None,'TAX-003'),
]
# RP-WATER-DOM-01
charge_components += [
    cc('RP-WATER-DOM-01','Fixed Water Charge',       'FIXED',    80.00,'WATER_FIXED'),
    cc('RP-WATER-DOM-01','Water Slab 1 (0-10 KL)',  'VARIABLE',   8.00,'WATER_VOLUME',0,10),
    cc('RP-WATER-DOM-01','Water Slab 2 (>10 KL)',   'VARIABLE',  14.00,'WATER_VOLUME',10,None),
    cc('RP-WATER-DOM-01','Water Tax 5%',             'TAX',        0.05,'TAX_WATER',None,None,'TAX-005'),
]
# RP-WATER-COM-01
charge_components += [
    cc('RP-WATER-COM-01','Fixed Water Charge',  'FIXED',   200.00,'WATER_FIXED'),
    cc('RP-WATER-COM-01','Water Volume Charge', 'VARIABLE', 18.00,'WATER_VOLUME',0,None),
    cc('RP-WATER-COM-01','Water Tax 5%',         'TAX',      0.05,'TAX_WATER',None,None,'TAX-005'),
]

CC_COLS = ['component_id','rate_plan_id','component_name','component_type','uom',
           'rate','posting_class','slab_from','slab_to','tax_id','status']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 11. CHARGE COMPONENTS")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('charge_components', CC_COLS, charge_components))

# ═══════════════════════════════════════════════════════════════════════════════
# 12. PAYMENT CHANNELS (8)
# ═══════════════════════════════════════════════════════════════════════════════
payment_channels = [
    ('CHAN-001','UPI / PhonePe',     'UPI',         'PhonePe',   False,'ACTIVE'),
    ('CHAN-002','UPI / GPay',        'UPI',         'Google Pay',False,'ACTIVE'),
    ('CHAN-003','BBPS Portal',       'BBPS',        'NPCI BBPS', False,'ACTIVE'),
    ('CHAN-004','Debit/Credit Card', 'CARD',        'Razorpay',  True, 'ACTIVE'),
    ('CHAN-005','Net Banking',       'NET_BANKING',  'Razorpay',  False,'ACTIVE'),
    ('CHAN-006','Cash Counter',      'CASH',        'Internal',  False,'ACTIVE'),
    ('CHAN-007','NACH / ECS Mandate','NACH',        'NPCI NACH', False,'ACTIVE'),
    ('CHAN-008','Cheque / DD',       'CHEQUE',      'Internal',  False,'ACTIVE'),
]
CHAN_COLS = ['channel_id','channel_name','channel_type','provider',
             'convenience_fee_flag','status']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 12. PAYMENT CHANNELS")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('payment_channels', CHAN_COLS, payment_channels))

CHAN_IDS = [r[0] for r in payment_channels]

# ═══════════════════════════════════════════════════════════════════════════════
# 13. PAYMENT GATEWAYS (4)
# ═══════════════════════════════════════════════════════════════════════════════
payment_gateways = [
    ('GW-001','Razorpay',   'RZPKEY1234567890','https://api.razorpay.com/v1/webhooks','PRODUCTION','T+2','ACTIVE'),
    ('GW-002','PayU',       'PAYUKEY1234567890','https://info.payu.in/merchant/postservice','PRODUCTION','T+2','ACTIVE'),
    ('GW-003','BBPS-NPCI',  'BBPS-ENZ-00001',  'https://www.billpay.npci.org.in/api/webhook','PRODUCTION','T+1','ACTIVE'),
    ('GW-004','Sandbox',    'SANDBOX_KEY_001',  'http://localhost:8000/test/webhook',           'SANDBOX',  'T+1','ACTIVE'),
]
GW_COLS = ['gateway_id','provider','merchant_id','callback_url','environment','settlement_cycle','status']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 13. PAYMENT GATEWAYS")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('payment_gateways', GW_COLS, payment_gateways))

GW_IDS = [r[0] for r in payment_gateways[:3]]

# ═══════════════════════════════════════════════════════════════════════════════
# 14. VEHICLE CATEGORIES (10)
# ═══════════════════════════════════════════════════════════════════════════════
VC_COLS = ['category_id','category_name','vehicle_type','fuel_capacity_kg','commercial_flag','status']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 14. VEHICLE CATEGORIES")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('vehicle_categories', VC_COLS, [r + ('ACTIVE',) for r in VEHICLE_TYPES]))

VC_IDS = [r[0] for r in VEHICLE_TYPES]

# ═══════════════════════════════════════════════════════════════════════════════
# 15. CNG STATIONS (25)
# ═══════════════════════════════════════════════════════════════════════════════
CNG_STATION_NAMES = [
    'Navrangpura CNG Station','Satellite Road CNG','CG Road Filling Point',
    'Thaltej Crossing CNG','Bopal-Ambli CNG','Gota Highway CNG',
    'Chandkheda CNG Station','Nikol CNG Point','Vastral Road CNG',
    'Maninagar CNG Station','Surat Ring Road CNG','Adajan CNG Station',
    'Varachha Road CNG','Katargam CNG Point','Dumas Road CNG',
    'Vadodara Akota CNG','Sayajiganj CNG Station','Alkapuri CNG Point',
    'Gandhinagar Sector 11 CNG','Gandhinagar Sector 28 CNG',
    'Rajkot Kalawad Road CNG','Rajkot Race Course CNG',
    'Pune Hadapsar CNG','Pune Kothrud CNG','Nagpur Wardha Road CNG',
]
cng_stations = []
city_list = list(CITIES.keys())
for i, name in enumerate(CNG_STATION_NAMES):
    city = city_list[i % len(city_list)]
    info = CITIES[city]
    area = random.choice(ALL_AREA_IDS[:len(ALL_AREA_IDS)//2])
    cng_stations.append((
        f"CNG{(i+1):04d}", name, area,
        f"{random.randint(1,500)} {random.choice(STREETS)}, {city}",
        city, info['state'],
        random.choice(['Reciprocating','Screw','Centrifugal']),
        random.randint(4, 16),
        date(2018, 1, 1) + timedelta(days=random.randint(0, 1500)),
        'ACTIVE'
    ))

CNG_COLS = ['station_id','station_name','area_id','address','city','state',
            'compressor_type','dispenser_count','operational_since','status']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 15. CNG STATIONS")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('cng_stations', CNG_COLS, cng_stations))

CNG_STATION_IDS = [r[0] for r in cng_stations]

# ═══════════════════════════════════════════════════════════════════════════════
# 16. NOTIFICATION TEMPLATES (26 templates)
# ═══════════════════════════════════════════════════════════════════════════════
notif_templates = []
channels = ['SMS','EMAIL','PUSH']
for i, event in enumerate(NOTIF_EVENTS):
    for ch in channels:
        tid = f"TMPL{(len(notif_templates)+1):04d}"
        subj = f"[Enerza] {event.replace('_',' ').title()}" if ch == 'EMAIL' else None
        body = f"Dear {{customer_name}}, your {event.lower().replace('_',' ')} notification. Ref: {{ref_id}}. Call 1800-123-4567 for help. -BFS Enerza"
        notif_templates.append((
            tid, ch, event, 'en', subj, body, True,
            date(2024, 1, 1)
        ))

NT_COLS = ['template_id','channel','event_type','language','subject','body_template','active','created_on']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 16. NOTIFICATION TEMPLATES")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('notif_templates', NT_COLS, notif_templates))

TMPL_IDS = [r[0] for r in notif_templates]

# ═══════════════════════════════════════════════════════════════════════════════
# 17. SERVICE REQUEST TYPES (15)
# ═══════════════════════════════════════════════════════════════════════════════
SRT_COLS = ['type_id','category','subcategory','sla_hours','priority','department',
            'escalation_matrix','status']
srt_rows = [(r[0],r[1],r[2],r[3],r[4],r[5],'{"L1":"Supervisor","L2":"Manager","L3":"Director"}','ACTIVE')
            for r in SR_TYPES]
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 17. SERVICE REQUEST TYPES")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('service_request_types', SRT_COLS, srt_rows))

SRT_IDS = [r[0] for r in SR_TYPES]

# ═══════════════════════════════════════════════════════════════════════════════
# 18. API PARTNERS (50)
# ═══════════════════════════════════════════════════════════════════════════════
api_partners = []
partner_names = [
    'PhonePe Payments','Google Pay India','Razorpay Pvt Ltd','PayU India','HDFC PayZapp',
    'SBI YONO','Axis Mobile','Kotak Net Banking','ICICI iMobile','IndusInd IndusMobile',
    'BBPS NPCI Integration','BillDesk','CCAvenue','PayTM Payments Bank','JusPay',
    'Ministry of Petroleum Portal','UIDAI Aadhaar Auth','GSTN e-Filing','PNGRB Portal','State Gas Auth',
    'IGL API Connect','MGL Digital','GAIL Gas Portal','Gujarat Gas ERP','Adani Gas API',
    'SAP Integration Hub','Oracle ERP Connector','Tally Enterprise','Zoho CRM Link','Salesforce Bridge',
    'HDFC Bank API','ICICI Direct','Kotak Corporate API','Axis Business Connect','SBI Corporate Net',
    'SMS Gateway Textlocal','SMS Gateway Twilio','Firebase Notifications','APNs Certificate','FCM Enterprise',
    'Amazon SES Email','SendGrid Email','Mailchimp Integration','Postmark API','SparkPost API',
    'AWS S3 Storage','Azure Blob Storage','Google Cloud Storage','Cloudflare CDN','Akamai CDN',
]
for i, name in enumerate(partner_names):
    pid = f"PART{(i+1):05d}"
    ptype = random.choice(API_PARTNER_TYPES)
    api_partners.append((
        pid, name, ptype,
        f"{name} (Registered Entity)",
        f"api{i+1:04d}@{name.lower().replace(' ','')[:15]}.com",
        f"9{random.randint(100000000,999999999)}",
        random.choice(['NEFT','RTGS','UPI']),
        date(2022, 1, 1) + timedelta(days=random.randint(0, 700)),
        'ACTIVE'
    ))

AP_COLS = ['partner_id','partner_name','partner_type','legal_name','contact_email',
           'contact_mobile','settlement_mode','onboarded_on','status']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 18. API PARTNERS")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('api_partners', AP_COLS, api_partners))

PARTNER_IDS = [r[0] for r in api_partners]

# ═══════════════════════════════════════════════════════════════════════════════
# 19. API ENDPOINT CATALOG (20)
# ═══════════════════════════════════════════════════════════════════════════════
api_endpoints = [
    ('EP-001','FETCH_BILL',     '/api/v1/bills/fetch',     'FETCH_BILL',     'GET',  'OAUTH2', True,  'v1'),
    ('EP-002','PAY_BILL',       '/api/v1/payments',        'PAYMENT',        'POST', 'OAUTH2', True,  'v1'),
    ('EP-003','BILL_STATUS',    '/api/v1/bills/status',    'STATUS_CHECK',   'GET',  'API_KEY',True,  'v1'),
    ('EP-004','CUSTOMER_INFO',  '/api/v1/customers',       'MASTER_DATA',    'GET',  'OAUTH2', True,  'v1'),
    ('EP-005','METER_READING',  '/api/v1/readings',        'FIELD_CAPTURE',  'POST', 'JWT',    True,  'v1'),
    ('EP-006','SERVICE_REQUEST','/api/v1/service-requests','SR_CREATE',      'POST', 'OAUTH2', True,  'v1'),
    ('EP-007','CONNECTION_DETAIL','/api/v1/connections',   'MASTER_DATA',    'GET',  'API_KEY',True,  'v1'),
    ('EP-008','PAYMENT_HISTORY','/api/v1/payments/history','REPORTING',      'GET',  'OAUTH2', True,  'v1'),
    ('EP-009','CONSUMPTION_HIST','/api/v1/consumption',   'ANALYTICS',      'GET',  'OAUTH2', True,  'v1'),
    ('EP-010','OTP_TRIGGER',    '/api/v1/auth/otp',        'AUTH',           'POST', 'API_KEY',True,  'v1'),
    ('EP-011','KYC_VERIFY',     '/api/v1/kyc/verify',      'KYC',            'POST', 'OAUTH2', True,  'v1'),
    ('EP-012','REFUND_REQUEST', '/api/v1/payments/refund', 'REFUND',         'POST', 'OAUTH2', True,  'v1'),
    ('EP-013','DISCONN_STATUS', '/api/v1/connections/status','STATUS_CHECK', 'GET',  'API_KEY',True,  'v1'),
    ('EP-014','BATCH_BILL',     '/api/v1/billing/batch',   'BATCH_PROCESS',  'POST', 'JWT',    False, 'v1'),
    ('EP-015','MIS_DASHBOARD',  '/api/v1/reports/summary', 'REPORTING',      'GET',  'OAUTH2', True,  'v1'),
    ('EP-016','WEBHOOK_REGISTER','/api/v1/webhooks',       'WEBHOOK',        'POST', 'OAUTH2', True,  'v1'),
    ('EP-017','RATE_INQUIRY',   '/api/v1/rates',           'MASTER_DATA',    'GET',  'API_KEY',True,  'v1'),
    ('EP-018','CNG_PRICE',      '/api/v1/cng/price',       'CNG_PRICING',    'GET',  'API_KEY',True,  'v1'),
    ('EP-019','NOTIFICATION_SEND','/api/v1/notifications', 'NOTIFICATION',   'POST', 'JWT',    False, 'v1'),
    ('EP-020','AUDIT_LOG',      '/api/v1/audit',           'COMPLIANCE',     'GET',  'JWT',    True,  'v1'),
]
EP_COLS = ['endpoint_id','endpoint_code','endpoint_path','operation_type',
           'request_method','auth_type','sync_flag','version','status']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 19. API ENDPOINT CATALOG")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('api_endpoint_catalog', EP_COLS, [r + ('ACTIVE',) for r in api_endpoints]))

EP_IDS = [r[0] for r in api_endpoints]

# ═══════════════════════════════════════════════════════════════════════════════
# 20. API CREDENTIALS (50)
# ═══════════════════════════════════════════════════════════════════════════════
api_creds = []
for pid in PARTNER_IDS:
    cid = f"CRED{pid[4:]}"
    api_creds.append((
        cid, pid,
        f"client_{pid.lower()}_{uuid.uuid4().hex[:8]}",
        f"vault/secrets/api/{pid.lower()}/secret",
        date(2025, 1, 1) + timedelta(days=random.randint(0, 730)),
        '["10.0.0.0/8","172.16.0.0/12"]',
        None,
        date(2024, 1, 1) + timedelta(days=random.randint(0, 400)),
    ))

AC_COLS = ['credential_id','partner_id','client_id','secret_ref',
           'token_expiry','ip_whitelist','cert_ref','last_rotated']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 20. API CREDENTIALS")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('api_credentials', AC_COLS, api_creds))

# ═══════════════════════════════════════════════════════════════════════════════
# 21. API ENDPOINT MAPPINGS (100 — each partner gets 2 endpoints)
# ═══════════════════════════════════════════════════════════════════════════════
api_mappings = []
for i, pid in enumerate(PARTNER_IDS):
    eps = random.sample(EP_IDS, 2)
    for ep in eps:
        api_mappings.append((
            f"MAP{(len(api_mappings)+1):06d}", pid, ep, True,
            date(2022, 6, 1) + timedelta(days=random.randint(0, 400))
        ))

AEM_COLS = ['mapping_id','partner_id','endpoint_id','enabled','effective_from']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 21. API ENDPOINT MAPPINGS")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('api_endpoint_mappings', AEM_COLS, api_mappings))

# ═══════════════════════════════════════════════════════════════════════════════
# 22. API RATE LIMITS (50)
# ═══════════════════════════════════════════════════════════════════════════════
api_rate_limits = []
for pid in PARTNER_IDS:
    api_rate_limits.append((
        f"RL{pid[4:]}",  pid,
        random.choice([60, 120, 300, 600]),
        random.choice([10, 20, 50]),
        random.choice([5000, 10000, 15000, 30000]),
        random.choice(['FIXED_WINDOW','SLIDING_WINDOW','TOKEN_BUCKET']),
        'ACTIVE'
    ))

ARL_COLS = ['limit_id','partner_id','requests_per_min','burst_limit','timeout_ms','retry_policy','status']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 22. API RATE LIMITS")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('api_rate_limits', ARL_COLS, api_rate_limits))

# ═══════════════════════════════════════════════════════════════════════════════
# 23. API ERROR CODES (20)
# ═══════════════════════════════════════════════════════════════════════════════
api_errors = [
    ('ERR-001',400,'Invalid request parameters',        False,'VALIDATION', 'Check required fields and data types'),
    ('ERR-002',401,'Authentication failed',             True, 'AUTH',       'Refresh token and retry'),
    ('ERR-003',403,'Insufficient permissions',          False,'AUTH',       'Request additional scopes'),
    ('ERR-004',404,'Resource not found',                False,'NOT_FOUND',  'Verify the resource ID'),
    ('ERR-005',409,'Duplicate request detected',        False,'BUSINESS',   'Check idempotency key'),
    ('ERR-006',422,'Business rule violation',           False,'BUSINESS',   'Review the error detail message'),
    ('ERR-007',429,'Rate limit exceeded',               True, 'RATE_LIMIT', 'Wait and retry with backoff'),
    ('ERR-008',500,'Internal server error',             True, 'SYSTEM',     'Retry after 30 seconds'),
    ('ERR-009',503,'Service unavailable',               True, 'SYSTEM',     'Check service status page'),
    ('ERR-010',504,'Gateway timeout',                   True, 'NETWORK',    'Retry with idempotency key'),
    ('ERR-011',400,'Bill already paid',                 False,'BUSINESS',   'Check bill status before payment'),
    ('ERR-012',400,'Invalid meter reading',             False,'VALIDATION', 'Consumption cannot be negative'),
    ('ERR-013',400,'Customer not active',               False,'BUSINESS',   'Verify KYC and account status'),
    ('ERR-014',400,'Connection suspended',              False,'BUSINESS',   'Clear dues before reconnect'),
    ('ERR-015',400,'Refund exceeds paid amount',        False,'BUSINESS',   'Refund amount ≤ paid amount'),
    ('ERR-016',400,'Invalid billing period',            False,'VALIDATION', 'Use YYYY-MM format'),
    ('ERR-017',400,'OTP expired',                       True, 'AUTH',       'Request new OTP'),
    ('ERR-018',400,'KYC not verified',                  False,'BUSINESS',   'Complete Aadhaar e-KYC first'),
    ('ERR-019',400,'Insufficient balance',              True, 'PAYMENT',    'Add funds and retry payment'),
    ('ERR-020',400,'Invalid rate plan',                 False,'BUSINESS',   'Rate plan not applicable to segment'),
]
AEC_COLS = ['error_code','http_status','message','retryable','category','resolution_hint']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 23. API ERROR CODES")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('api_error_codes', AEC_COLS, api_errors))

# ═══════════════════════════════════════════════════════════════════════════════
# 24. WEBHOOK SUBSCRIPTIONS (30)
# ═══════════════════════════════════════════════════════════════════════════════
wh_events = ['PAYMENT_SUCCESS','PAYMENT_FAILED','BILL_GENERATED','DISCONNECTION','RECONNECTION']
webhooks = []
for i, pid in enumerate(PARTNER_IDS[:30]):
    event = wh_events[i % len(wh_events)]
    webhooks.append((
        f"WH{(i+1):05d}", pid, event,
        f"https://api.{pid.lower()}.example.com/enerza/webhook/{event.lower()}",
        'HMAC_SHA256',
        f"vault/webhook-secrets/{pid.lower()}",
        3, True
    ))

WH_COLS = ['webhook_id','partner_id','event_type','target_url','signature_method',
           'secret_ref','retry_count','active']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 24. WEBHOOK SUBSCRIPTIONS")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('webhook_subscriptions', WH_COLS, webhooks))

# ═══════════════════════════════════════════════════════════════════════════════
# 25. CUSTOMERS (20,000)
# ═══════════════════════════════════════════════════════════════════════════════
print("  Generating 20,000 customers...")
CUST_TYPES = ['Individual'] * 85 + ['Commercial'] * 10 + ['Industrial'] * 3 + ['Institutional'] * 2
KYC_DIST   = ['VERIFIED'] * 80 + ['PENDING'] * 12 + ['REJECTED'] * 8
STATUS_DIST = ['ACTIVE'] * 82 + ['DRAFT'] * 10 + ['INACTIVE'] * 5 + ['BLOCKED'] * 3

customers = []
used_mobiles = set()
used_emails  = set()
start_date   = date(2019, 4, 1)

for i in range(1, 20001):
    fn = random.choice(FIRST); ln = random.choice(LAST)
    full = f"{fn} {random.choice(['R','S','M','K','H','A','V','N','D','P'])} {ln}"
    short = f"{fn[0]}.{ln}"
    ctype = random.choice(CUST_TYPES)
    kyc   = random.choice(KYC_DIST)
    status = 'ACTIVE' if kyc == 'VERIFIED' else random.choice(['DRAFT', 'INACTIVE'])
    status = random.choice(STATUS_DIST)

    # Unique mobile
    mobile = f"9{random.randint(100000000,999999999)}"
    while mobile in used_mobiles: mobile = f"9{random.randint(100000000,999999999)}"
    used_mobiles.add(mobile)

    email = f"{fn.lower()}{i}@{random.choice(['gmail','yahoo','outlook','rediffmail','hotmail'])}.com"
    pan   = f"{''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ',k=5))}{random.randint(1000,9999)}{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}"
    aadhaar = f"XXXX XXXX {random.randint(1000,9999)}"
    eff_from = start_date + timedelta(days=random.randint(0, 1800))
    creator  = random.choice(SU_IDS)

    customers.append((
        uid('CUST', i, 8), full, short, ctype,
        kyc, pan, aadhaar, None,
        mobile, email, status,
        eff_from, None,
        creator, eff_from, creator, None
    ))

CUST_COLS = ['customer_id','full_name','short_name','customer_type','kyc_status',
             'pan_ref','aadhaar_ref','passport_ref','mobile','email','status',
             'effective_from','effective_to','created_by','created_on','changed_by','changed_on']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 25. CUSTOMERS (20,000)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('customers', CUST_COLS, customers))

CUST_IDS = [r[0] for r in customers]

# ═══════════════════════════════════════════════════════════════════════════════
# 26. PREMISES (20,200 — a few customers have 2 premises)
# ═══════════════════════════════════════════════════════════════════════════════
print("  Generating 20,200 premises...")
BLDG_TYPES = ['APARTMENT','HOUSE','VILLA','BUNGALOW','ROW_HOUSE',
              'COMMERCIAL_SHOP','OFFICE','FACTORY','RESTAURANT','HOTEL']
OCC_TYPES  = ['OWNER','TENANT','SOCIETY','COMPANY_OWNED']

premises = []
for i in range(1, 20201):
    cust_idx = i - 1 if i <= 20000 else random.randint(0, 999)  # last 200 = extra premises
    cid = CUST_IDS[cust_idx]
    city = random.choice(ALL_CITIES)
    info = CITIES[city]
    area_id = random.choice([aid for aid, d in area_id_map.items() if d['city'] == city] or ALL_AREA_IDS)
    pincode = random.choice(info['pincodes'])
    flat_no = f"{random.randint(1,20)}{random.choice(['A','B','C','',''])}/{random.randint(1,50)}"
    society = random.choice(SOCIETIES)
    street  = random.choice(STREETS)

    premises.append((
        uid('PREM', i, 8), cid,
        f"Flat {flat_no}, {society}",
        street, city, info['state'], pincode, area_id,
        round(random.uniform(22.9, 23.1), 6),  # Gujarat lat
        round(random.uniform(72.5, 72.8), 6),  # Gujarat lon
        random.choice(BLDG_TYPES), random.choice(OCC_TYPES),
        'ACTIVE', random.choice(SU_IDS),
        date(2019, 4, 1) + timedelta(days=random.randint(0, 1800))
    ))

PREM_COLS = ['premise_id','customer_id','address_line1','address_line2',
             'city','state','pincode','area_id','geo_lat','geo_lon',
             'building_type','occupancy_type','status','created_by','created_on']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 26. PREMISES (20,200)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('premises', PREM_COLS, premises))

PREM_IDS = [r[0] for r in premises]

# ═══════════════════════════════════════════════════════════════════════════════
# 27. ACCOUNTS (20,000)
# ═══════════════════════════════════════════════════════════════════════════════
print("  Generating 20,000 accounts...")
BILL_MODES = ['EMAIL','SMS','BOTH','PAPER']

accounts = []
for i in range(1, 20001):
    cid = CUST_IDS[i-1]
    pid = PREM_IDS[i-1]
    cycle = random.choice(CYC_IDS)
    eff   = customers[i-1][11]  # effective_from of customer
    creator = random.choice(SU_IDS)

    accounts.append((
        uid('ACCT', i, 8), cid, pid, cycle,
        random.choice(BILL_MODES), None,
        'ACTIVE', eff, None,
        creator, eff, creator, None
    ))

ACCT_COLS = ['account_id','customer_id','premise_id','cycle_id','bill_delivery_mode',
             'billing_address','status','effective_from','effective_to',
             'created_by','created_on','changed_by','changed_on']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 27. ACCOUNTS (20,000)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('accounts', ACCT_COLS, accounts))

ACCT_IDS = [r[0] for r in accounts]

# ═══════════════════════════════════════════════════════════════════════════════
# 28. SERVICE CONNECTIONS (22,000)
# Utility mix: 65% PNG, 15% Electricity, 10% Water, 10% dual (PNG+Elec)
# ═══════════════════════════════════════════════════════════════════════════════
print("  Generating 22,000 service connections...")
UTIL_WEIGHTS = ['GAS_PNG']*65 + ['ELECTRICITY']*15 + ['WATER']*10 + ['GAS_PNG']*10  # last 10 are duals

connections = []
conn_details_gas   = []
conn_details_elec  = []
conn_details_water = []

def get_seg(utility, ctype):
    if utility == 'GAS_PNG':
        if ctype == 'Industrial': return 'SEG-003'
        if ctype == 'Commercial': return 'SEG-002'
        return 'SEG-001'
    if utility == 'ELECTRICITY':
        if ctype == 'Industrial': return 'SEG-008'
        if ctype == 'Commercial': return 'SEG-007'
        return 'SEG-006'
    if utility == 'WATER':
        if ctype == 'Commercial': return 'SEG-010'
        return 'SEG-009'
    return 'SEG-004'

conn_idx = 1
# First 20,000 — one connection per account
for i in range(20000):
    acct  = ACCT_IDS[i]
    ctype = customers[i][3]
    util  = random.choice(UTIL_WEIGHTS)
    seg   = get_seg(util, ctype)
    cid   = uid('CONN', conn_idx, 8)
    start = accounts[i][7]
    status_choices = ['ACTIVE']*90 + ['SUSPENDED']*5 + ['TERMINATED']*5
    status = random.choice(status_choices)

    connections.append((
        cid, acct, util, seg,
        start, None, status,
        start if status == 'SUSPENDED' else None,
        None,
        'OVERDUE_BILL' if status == 'SUSPENDED' else None,
        random.choice(SU_IDS), start
    ))

    # Detail tables
    if util == 'GAS_PNG':
        conn_details_gas.append((
            cid, 'PNG',
            random.choice(PB_IDS_DOM if ctype == 'Individual' else PB_IDS_COM),
            f"REG{random.randint(100000,999999)}",
            random.choice(['Fisher R622','Elster B6','Pietro Fiorentini','Tartarini']),
            round(random.uniform(15.0, 50.0), 2)
        ))
    elif util == 'ELECTRICITY':
        conn_details_elec.append((
            cid,
            round(random.uniform(1.0 if ctype=='Individual' else 10.0, 10.0 if ctype=='Individual' else 100.0), 2),
            random.choice(['230V','415V','11kV']),
            '1-Phase' if ctype == 'Individual' else random.choice(['1-Phase','3-Phase']),
            seg,
            random.choice(['DGVCL','UGVCL','PGVCL','MGVCL'])
        ))
    elif util == 'WATER':
        conn_details_water.append((
            cid,
            random.choice([15.0, 20.0, 25.0, 32.0, 40.0]),
            random.choice(WSZ_IDS) if WSZ_IDS else None,
            random.choice(['Mechanical','Smart','Ultrasonic']),
            random.choice(['DOMESTIC','COMMERCIAL','GARDEN','INDUSTRIAL'])
        ))
    conn_idx += 1

# Next 2,000 — dual utility (PNG + electricity for commercial)
dual_accts = random.sample(range(20000), 2000)
for i in dual_accts[:2000]:
    acct  = ACCT_IDS[i]
    ctype = customers[i][3]
    cid   = uid('CONN', conn_idx, 8)
    start = accounts[i][7]
    util  = 'ELECTRICITY'
    seg   = get_seg(util, ctype)

    connections.append((
        cid, acct, util, seg,
        start, None, 'ACTIVE',
        None, None, None,
        random.choice(SU_IDS), start
    ))
    conn_details_elec.append((
        cid,
        round(random.uniform(5.0, 50.0), 2),
        '415V', '3-Phase', seg,
        random.choice(['DGVCL','UGVCL','PGVCL','MGVCL'])
    ))
    conn_idx += 1

CONN_COLS = ['connection_id','account_id','utility_type','segment_id','start_date',
             'end_date','status','disconnect_date','reconnect_date','disconnect_reason',
             'created_by','created_on']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 28. SERVICE CONNECTIONS (22,000)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('service_connections', CONN_COLS, connections))

GCD_COLS = ['connection_id','service_type','pressure_band_id','regulator_serial','regulator_type','inlet_size_mm']
sections.append("\n-- GAS CONNECTION DETAILS")
sections.append(ins('gas_conn_details', GCD_COLS, conn_details_gas))

ECD_COLS = ['connection_id','load_kw','supply_voltage','phase_type','tariff_category','distribution_company']
sections.append("\n-- ELECTRICITY CONNECTION DETAILS")
sections.append(ins('elec_conn_details', ECD_COLS, conn_details_elec))

WCD_COLS = ['connection_id','pipe_size_mm','supply_zone_id','meter_type','connection_purpose']
sections.append("\n-- WATER CONNECTION DETAILS")
sections.append(ins('water_conn_details', WCD_COLS, conn_details_water))

ALL_CONN_IDS = [r[0] for r in connections]

# ═══════════════════════════════════════════════════════════════════════════════
# 29. METERS (22,000 + 500 spares)
# ═══════════════════════════════════════════════════════════════════════════════
print("  Generating 22,500 meters...")
meters = []
meter_idx = 1
conn_to_meter = {}  # connection_id -> meter_id

for conn in connections:
    util = conn[2]
    mid  = uid('MTR', meter_idx, 8)
    sn   = f"SN{random.randint(10000000,99999999)}"
    if util == 'GAS_PNG':
        mtype = random.choice(['DIAPHRAGM','ROTARY','TURBINE','ULTRASONIC'])
        model = random.choice(METER_MODELS_GAS); uom = 'SCM'
    elif util == 'ELECTRICITY':
        mtype = random.choice(['SINGLE_PHASE','THREE_PHASE','SMART_AMI'])
        model = random.choice(METER_MODELS_ELEC); uom = 'kWh'
    else:
        mtype = random.choice(['MECHANICAL','ELECTROMAGNETIC','ULTRASONIC'])
        model = random.choice(METER_MODELS_WATER); uom = 'KL'

    meters.append((
        mid, sn, mtype, random.choice(METER_MAKES), model,
        random.choice(['G4','G6','G10','DN15','DN20','15A','30A','60A']),
        uom, util,
        date(2025, 1, 1) + timedelta(days=random.randint(180, 730)),
        'INSTALLED'
    ))
    conn_to_meter[conn[0]] = mid
    meter_idx += 1

# 500 spare meters
for i in range(500):
    util = random.choice(['GAS_PNG','ELECTRICITY','WATER'])
    mid  = uid('MTR', meter_idx, 8)
    meters.append((
        mid, f"SN{random.randint(10000000,99999999)}",
        'DIAPHRAGM' if util == 'GAS_PNG' else ('SINGLE_PHASE' if util == 'ELECTRICITY' else 'MECHANICAL'),
        random.choice(METER_MAKES),
        random.choice(METER_MODELS_GAS if util=='GAS_PNG' else METER_MODELS_ELEC if util=='ELECTRICITY' else METER_MODELS_WATER),
        random.choice(['G4','DN15','15A']),
        'SCM' if util=='GAS_PNG' else ('kWh' if util=='ELECTRICITY' else 'KL'),
        util,
        date(2025, 6, 1) + timedelta(days=random.randint(0, 365)),
        'IN_STOCK'
    ))
    meter_idx += 1

MTR_COLS = ['meter_id','serial_no','meter_type','make','model','size','uom',
            'utility_type','calibration_due','status']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 29. METERS (22,500)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('meters', MTR_COLS, meters))

# ═══════════════════════════════════════════════════════════════════════════════
# 30. METER INSTALLATIONS (22,000)
# ═══════════════════════════════════════════════════════════════════════════════
meter_installs = []
for conn in connections:
    cid = conn[0]
    mid = conn_to_meter[cid]
    inst_date = conn[3]  # start_date of connection
    seal = f"SEAL{random.randint(100000,999999)}"
    meter_installs.append((
        f"INST{cid[4:]}", mid, cid,
        inst_date, None, seal,
        'NEW_CONNECTION',
        f"TECH{random.randint(1000,9999)}"
    ))

MI_COLS = ['install_id','meter_id','connection_id','install_date','remove_date',
           'seal_no','reason','installed_by']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 30. METER INSTALLATIONS (22,000)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('meter_installations', MI_COLS, meter_installs))

# ═══════════════════════════════════════════════════════════════════════════════
# 31. METER READINGS (88,000 — 4 months of readings)
# ═══════════════════════════════════════════════════════════════════════════════
print("  Generating 88,000 meter readings...")
READING_MONTHS = [
    date(2025, 12, 8), date(2026, 1, 8), date(2026, 2, 8), date(2026, 3, 8)
]

# Avg monthly consumption by utility
AVG_CONSUMPTION = {
    'GAS_PNG':     {'Individual': 12.5, 'Commercial': 45.0, 'Industrial': 500.0, 'Institutional': 80.0},
    'ELECTRICITY': {'Individual': 180,  'Commercial': 600,  'Industrial': 5000,  'Institutional': 1200},
    'WATER':       {'Individual': 12.0, 'Commercial': 40.0, 'Industrial': 200.0, 'Institutional': 60.0},
}

route_conns = {}  # route_id -> [connection_ids]
for cid in ALL_CONN_IDS:
    rid = random.choice(ALL_ROUTE_IDS)
    route_conns.setdefault(rid, []).append(cid)

meter_readings = []
conn_prev_reading = {}  # connection_id -> (last_reading_value, last_date)
reading_idx = 1

# Initialize starting readings
for conn in connections:
    cid = conn[0]; util = conn[2]
    conn_prev_reading[cid] = (random.uniform(100, 5000), READING_MONTHS[0] - timedelta(days=31))

for rd_date in READING_MONTHS:
    for conn in connections:
        cid    = conn[0]
        util   = conn[2]
        ctype  = customers[int(cid[4:])-1][3] if int(cid[4:]) <= 20000 else 'Individual'
        avg    = AVG_CONSUMPTION.get(util, {}).get(ctype, 10)
        actual = max(0, random.gauss(avg, avg * 0.2))

        prev_val, _ = conn_prev_reading[cid]
        curr_val    = round(prev_val + actual, 3)
        consumption = round(curr_val - prev_val, 3)
        anomaly     = consumption > avg * 2.5
        rt          = random.choice(['ACTUAL']*92 + ['ESTIMATED']*8)
        status      = 'BILLED' if rd_date < READING_MONTHS[-1] else 'PENDING'
        rid         = random.choice(ALL_ROUTE_IDS)

        meter_readings.append((
            uid('RDG', reading_idx, 8),
            conn_to_meter[cid], cid, rid,
            rd_date, round(curr_val, 3), round(prev_val, 3),
            round(consumption, 3), rt, anomaly, status,
            rd_date
        ))
        conn_prev_reading[cid] = (curr_val, rd_date)
        reading_idx += 1

MR_COLS = ['reading_id','meter_id','connection_id','route_id','reading_date',
           'reading_value','prev_reading_value','consumption','reading_type',
           'anomaly_flag','status','created_on']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 31. METER READINGS (88,000)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('meter_readings', MR_COLS, meter_readings))

# ═══════════════════════════════════════════════════════════════════════════════
# 32. CNG SALES (120,000 — 25 stations × 160 days × ~30/day)
# ═══════════════════════════════════════════════════════════════════════════════
print("  Generating 120,000 CNG sales...")
cng_sales = []
sale_idx  = 1
cng_start = date(2025, 10, 1)

for station_id in CNG_STATION_IDS:
    for day in range(160):
        sale_date = cng_start + timedelta(days=day)
        n_sales   = random.randint(20, 50)
        for _ in range(n_sales):
            vc = random.choice(VC_IDS)
            qty = round(random.uniform(1.5, 12.0), 3)
            price = round(random.uniform(78.0, 85.0), 2)
            cng_sales.append((
                uid('CSALE', sale_idx, 8),
                station_id, vc, sale_date,
                qty, price, round(qty * price, 2),
                random.choice(['UPI','CASH','CARD','FLEET_CARD'])
            ))
            sale_idx += 1

CS_COLS = ['sale_id','station_id','category_id','sale_date',
           'quantity_scm','unit_price','amount','payment_mode']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 32. CNG SALES (~120,000)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('cng_sales', CS_COLS, cng_sales))

# ═══════════════════════════════════════════════════════════════════════════════
# 33. BILLS (88,000 — 4 billing periods × 22,000 connections)
# ═══════════════════════════════════════════════════════════════════════════════
print("  Generating 88,000 bills...")

BILLING_PERIODS = ['2025-12','2026-01','2026-02','2026-03']
BILL_DATES      = [date(2025,12,8), date(2026,1,8), date(2026,2,8), date(2026,3,8)]

RATE_PLAN_MAP = {
    ('GAS_PNG',  'Individual'):    ('RP-GAS-DOM-01', 120.0, 'SCM'),
    ('GAS_PNG',  'Commercial'):    ('RP-GAS-COM-01', 350.0, 'SCM'),
    ('GAS_PNG',  'Industrial'):    ('RP-GAS-IND-01', 2000.0,'SCM'),
    ('ELECTRICITY','Individual'):  ('RP-ELEC-DOM-01', 45.0, 'kWh'),
    ('ELECTRICITY','Commercial'):  ('RP-ELEC-COM-01', 500.0,'kWh'),
    ('WATER',    'Individual'):    ('RP-WATER-DOM-01', 80.0,'KL'),
    ('WATER',    'Commercial'):    ('RP-WATER-COM-01', 200.0,'KL'),
}

def calc_bill(util, ctype, consumption):
    """Simple slab calculation matching our rate plans."""
    key = (util, ctype if ctype in ['Commercial','Industrial'] else 'Individual')
    plan_id, fixed, uom = RATE_PLAN_MAP.get(key, ('RP-GAS-DOM-01', 120.0, 'SCM'))
    net = fixed

    if util == 'GAS_PNG':
        if ctype in ['Commercial','Industrial']:
            net += consumption * (38.0 if ctype=='Commercial' else 32.0)
            tax  = round(net * 0.18, 2)
        else:
            s1 = min(consumption, 10)
            s2 = max(0, min(consumption - 10, 20))
            s3 = max(0, consumption - 30)
            net += s1*30 + s2*35 + s3*42
            tax  = round(net * 0.05, 2)
    elif util == 'ELECTRICITY':
        if ctype == 'Commercial':
            net += consumption * 6.50
            tax  = round(net * 0.15, 2)
        else:
            s1 = min(consumption, 100); s2 = max(0, min(consumption-100,200)); s3 = max(0,consumption-300)
            net += s1*3.5 + s2*5.0 + s3*7.5
            tax  = round(net * 0.10, 2)
    elif util == 'WATER':
        s1 = min(consumption, 10); s2 = max(0, consumption - 10)
        net += s1*8.0 + s2*14.0
        tax  = round(net * 0.05, 2)
    else:
        net += consumption * 80.0
        tax  = round(net * 0.05, 2)

    net = round(net, 2)
    return plan_id, round(net, 2), round(tax, 2), uom

bills      = []
bill_lines = []
bill_idx   = 1
line_idx   = 1

# Build reading lookup: (connection_id, period) -> consumption
reading_lookup = {}
for rdg in meter_readings:
    key = (rdg[2], rdg[4].strftime('%Y-%m'))
    reading_lookup[key] = rdg[7]  # consumption

for period_idx, (period, bill_date) in enumerate(zip(BILLING_PERIODS, BILL_DATES)):
    due_date = bill_date + timedelta(days=20)
    is_last  = (period == BILLING_PERIODS[-1])

    for conn in connections:
        cid   = conn[0]
        acct  = conn[1]
        util  = conn[2]
        ctype = customers[int(cid[4:])-1][3] if int(cid[4:]) <= 20000 else 'Individual'

        # Skip suspended/terminated for billing
        if conn[6] in ('TERMINATED',): continue

        consumption = reading_lookup.get((cid, period), None)
        if consumption is None:
            consumption = round(random.uniform(5, 50), 3)

        plan_id, net, tax, uom = calc_bill(util, ctype, consumption)

        # Arrears from previous period (10% of bills have arrears)
        arrears = round(random.uniform(200, 800), 2) if random.random() < 0.10 else 0.0
        late_fee = round(arrears * 0.015, 2) if arrears > 0 else 0.0
        total = round(net + tax + arrears + late_fee, 2)

        # Payment status distribution
        if period != BILLING_PERIODS[-1]:  # past periods
            pay_choice = random.random()
            if pay_choice < 0.75:
                paid = total; balance = 0; status = 'PAID'
            elif pay_choice < 0.88:
                paid = round(total * random.uniform(0.3, 0.8), 2); balance = round(total-paid,2); status = 'PARTIALLY_PAID'
            elif pay_choice < 0.95:
                paid = 0; balance = total; status = 'OVERDUE'
            else:
                paid = 0; balance = total; status = 'GENERATED'
        else:  # current period
            pay_choice = random.random()
            if pay_choice < 0.30:
                paid = total; balance = 0; status = 'PAID'
            elif pay_choice < 0.45:
                paid = round(total * random.uniform(0.3, 0.8), 2); balance = round(total-paid,2); status = 'PARTIALLY_PAID'
            else:
                paid = 0; balance = total; status = 'GENERATED'

        bid = uid('BILL', bill_idx, 10)
        bills.append((
            bid, acct, cid, random.choice(CYC_IDS), plan_id,
            period, bill_date, due_date,
            round(consumption, 3), uom,
            net, tax, 0.0, arrears, late_fee,
            total, paid, balance, status,
            None, random.choice(SU_IDS), bill_date
        ))

        # Bill lines (fixed + variable + tax)
        bill_lines.append((
            uid('BL', line_idx, 10), bid, None,
            'Fixed Monthly Charge', None, 0.0,
            round(net * 0.3, 2), 'CHARGE'
        ))
        line_idx += 1
        bill_lines.append((
            uid('BL', line_idx, 10), bid, None,
            f'Variable Charge ({consumption:.2f} {uom})',
            round(consumption, 3), round(net / max(consumption, 0.1), 4),
            round(net * 0.7, 2), 'CHARGE'
        ))
        line_idx += 1
        bill_lines.append((
            uid('BL', line_idx, 10), bid, None,
            'Tax / GST', None, 0.0, tax, 'TAX'
        ))
        line_idx += 1
        if arrears > 0:
            bill_lines.append((
                uid('BL', line_idx, 10), bid, None,
                'Previous Balance Arrears', None, 0.0, arrears, 'ARREARS'
            ))
            line_idx += 1

        bill_idx += 1

BILL_COLS = ['bill_id','account_id','connection_id','cycle_id','rate_plan_id',
             'billing_period','bill_date','due_date','consumption','uom',
             'net_amount','tax_amount','subsidy_amount','arrears_amount','late_fee',
             'total_amount','paid_amount','balance_amount','status',
             'reversed_by','generated_by','generated_on']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 33. BILLS (~88,000)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('bills', BILL_COLS, bills))

BL_COLS = ['line_id','bill_id','component_id','description','quantity','rate','amount','line_type']
sections.append("\n-- BILL LINES (~320,000)")
sections.append(ins('bill_lines', BL_COLS, bill_lines))

BILL_IDS = [r[0] for r in bills]

# ═══════════════════════════════════════════════════════════════════════════════
# 34. PAYMENT ORDERS (~72,000 — paid bills get payment orders)
# ═══════════════════════════════════════════════════════════════════════════════
print("  Generating payment orders...")
pay_orders   = []
gateway_txns = []
settlements  = []
order_idx    = 1
txn_idx      = 1

for bill in bills:
    if bill[16] == 0: continue  # no payments
    bid     = bill[0]
    acct    = bill[1]
    paid    = bill[16]
    status  = bill[18]

    chan  = random.choice(CHAN_IDS)
    gw    = random.choice(GW_IDS)
    conv  = round(paid * 0.002, 2) if chan == 'CHAN-004' else 0.0
    total = round(paid + conv, 2)
    oid   = f"ORD{order_idx:012d}"
    pay_date = bill[6] + timedelta(days=random.randint(0, 18))

    pay_orders.append((
        oid, bid, acct, chan, gw,
        paid, conv, total,
        'SUCCESS', pay_date, pay_date,
        f"GW{random.randint(100000000,999999999)}"
    ))

    gateway_txns.append((
        f"GTXN{txn_idx:010d}", oid, None,
        f"GREF{random.randint(100000000,999999999)}",
        'SUCCESS', '00', pay_date, pay_date
    ))

    order_idx += 1; txn_idx += 1

PO_COLS = ['order_id','bill_id','account_id','channel_id','gateway_id',
           'amount','convenience_fee','total_charged','status',
           'initiated_at','completed_at','gateway_ref']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 34. PAYMENT ORDERS (~72,000)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('payment_orders', PO_COLS, pay_orders))

GT_COLS = ['txn_id','order_id','settlement_id','gateway_ref',
           'gateway_status','response_code','response_at','settled_at']
sections.append("\n-- GATEWAY TRANSACTIONS")
sections.append(ins('gateway_txns', GT_COLS, gateway_txns))

# 4 monthly settlements
for m, month in enumerate(['2025-12','2026-01','2026-02','2026-03']):
    stl_id  = f"STL{month.replace('-','')}"
    gw      = GW_IDS[0]
    gross   = round(sum(r[7] for r in pay_orders if r[9] and r[9].strftime('%Y-%m') == month), 2)
    fee     = round(gross * 0.002, 2)
    n_match = sum(1 for r in pay_orders if r[9] and r[9].strftime('%Y-%m') == month)
    settlements.append((
        stl_id, gw, date(int(month[:4]), int(month[5:]), 28),
        gross, fee, round(gross - fee, 2), n_match, 0, 'RECONCILED'
    ))

STL_COLS = ['settlement_id','gateway_id','settlement_date','gross_amount',
            'fee_deducted','net_amount','matched_count','exception_count','status']
sections.append("\n-- SETTLEMENTS")
sections.append(ins('settlements', STL_COLS, settlements))

# ═══════════════════════════════════════════════════════════════════════════════
# 35. SUSPENSE RECORDS (200 unmatched payments)
# ═══════════════════════════════════════════════════════════════════════════════
suspense = []
for i in range(200):
    suspense.append((
        f"SUSP{i+1:06d}", None,
        random.choice(['UNKNOWN_ORDER','AMOUNT_MISMATCH','DUPLICATE_PAYMENT','INVALID_ACCOUNT']),
        round(random.uniform(200, 5000), 2),
        random.choice(['OPEN']*70 + ['RESOLVED']*30),
        f"USER{random.randint(1,50):04d}" if random.random() > 0.7 else None,
        None,
        date(2025, 10, 1) + timedelta(days=random.randint(0, 180))
    ))

SUSP_COLS = ['suspense_id','txn_id','reason','amount','resolution_status',
             'resolved_by','resolved_at','created_at']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 35. SUSPENSE RECORDS (200)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('suspense_records', SUSP_COLS, suspense))

# ═══════════════════════════════════════════════════════════════════════════════
# 36. REFUNDS (500)
# ═══════════════════════════════════════════════════════════════════════════════
paid_orders = [r[0] for r in pay_orders[:500]]
refunds = []
for i, oid in enumerate(paid_orders[:500]):
    refunds.append((
        f"RFD{i+1:08d}", oid,
        random.choice(['OVERPAYMENT','BILL_REVISED','DUPLICATE_PAYMENT','WRONG_ACCOUNT']),
        round(random.uniform(50, 500), 2),
        random.choice(['INITIATED','SUCCESS','FAILED']),
        f"USER{random.randint(1,50):04d}",
        date(2025, 10, 1) + timedelta(days=random.randint(0, 180)),
        None
    ))

RF_COLS = ['refund_id','order_id','reason_code','amount','status',
           'initiated_by','initiated_at','completed_at']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 36. REFUNDS (500)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('refunds', RF_COLS, refunds))

# ═══════════════════════════════════════════════════════════════════════════════
# 37. APP USERS (15,000 — 75% of customers have the app)
# ═══════════════════════════════════════════════════════════════════════════════
print("  Generating app users and mobile data...")
app_user_customers = random.sample(range(20000), 15000)

app_users     = []
app_devices   = []
app_links     = []
app_sessions  = []

for idx in app_user_customers:
    cust    = customers[idx]
    auid    = f"APPU{idx+1:08d}"
    reg_date = cust[11] + timedelta(days=random.randint(30, 365))
    last_login = reg_date + timedelta(days=random.randint(0, 300))

    app_users.append((
        auid, cust[0],
        cust[8],  # mobile
        cust[9],  # email
        True,     # otp_verified
        BCRYPT_HASH,  # mpin_hash (generic)
        True,     # mpin_set
        'ACTIVE',
        reg_date, last_login
    ))

    # Device
    os_type = random.choice(['ANDROID','ANDROID','IOS'])
    dev_id  = f"DEV{idx+1:08d}"
    app_devices.append((
        dev_id, auid, os_type,
        random.choice(['13','14','15','12']) if os_type == 'ANDROID' else random.choice(['16','17','15']),
        random.choice(['3.2.1','3.3.0','3.4.2','3.1.5']),
        f"FCM_{uuid.uuid4().hex[:32]}",
        uuid.uuid4().hex,
        True, reg_date
    ))

    # Account link
    app_links.append((
        f"LNK{idx+1:08d}", auid, ACCT_IDS[idx],
        'OWNER', reg_date, 'ACTIVE'
    ))

    # Sessions (last 5 sessions)
    for s in range(3):
        sess_start = last_login - timedelta(days=s*7)
        app_sessions.append((
            f"SESS{(idx*3+s+1):010d}", auid, dev_id,
            sess_start, sess_start + timedelta(hours=random.randint(1, 4)),
            'CLOSED', f"49.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}"
        ))

AU_COLS = ['app_user_id','customer_id','mobile','email','otp_verified',
           'mpin_hash','mpin_set','status','registered_at','last_login_at']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 37. APP USERS (15,000)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('app_users', AU_COLS, app_users))

AD_COLS = ['device_id','app_user_id','os_type','os_version','app_version',
           'push_token','device_fingerprint','active','registered_at']
sections.append("\n-- APP DEVICES (15,000)")
sections.append(ins('app_devices', AD_COLS, app_devices))

AAL_COLS = ['link_id','app_user_id','account_id','ownership_type','linked_at','status']
sections.append("\n-- APP ACCOUNT LINKS (15,000)")
sections.append(ins('app_account_links', AAL_COLS, app_links))

AS_COLS = ['session_id','app_user_id','device_id','started_at','ended_at','session_status','ip_address']
sections.append("\n-- APP SESSIONS (45,000)")
sections.append(ins('app_sessions', AS_COLS, app_sessions))

APP_USER_IDS = [r[0] for r in app_users]

# ═══════════════════════════════════════════════════════════════════════════════
# 38. APP NOTIFICATIONS (30,000 — 2 per app user)
# ═══════════════════════════════════════════════════════════════════════════════
app_notifications = []
for i, au in enumerate(app_users[:15000]):
    auid = au[0]
    for j in range(2):
        tmpl = random.choice(TMPL_IDS)
        bill = random.choice(BILL_IDS) if random.random() > 0.4 else None
        sent = au[9] - timedelta(days=random.randint(0, 60))
        read = random.random() > 0.35
        app_notifications.append((
            f"NOTIF{(i*2+j+1):08d}", auid, tmpl, bill,
            f"Your utility update. Amount: ₹{random.randint(200,2000)}.",
            random.choice(['PUSH','SMS']),
            sent, read, sent + timedelta(minutes=random.randint(5,1440)) if read else None
        ))

AN_COLS = ['notif_id','app_user_id','template_id','bill_id','message',
           'channel','sent_at','read_flag','read_at']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 38. APP NOTIFICATIONS (30,000)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('app_notifications', AN_COLS, app_notifications))

# ═══════════════════════════════════════════════════════════════════════════════
# 39. APP SERVICE REQUESTS (10,000)
# ═══════════════════════════════════════════════════════════════════════════════
app_service_requests = []
SR_STATUS = ['OPEN','IN_PROGRESS','RESOLVED','CLOSED','CANCELLED']
for i in range(10000):
    auid  = random.choice(APP_USER_IDS)
    au_idx = APP_USER_IDS.index(auid)
    acct  = app_links[au_idx][2]
    stype = random.choice(SRT_IDS)
    created = date(2025, 4, 1) + timedelta(days=random.randint(0, 340))
    status  = random.choice(SR_STATUS)
    resolved = created + timedelta(days=random.randint(1, 7)) if status in ('RESOLVED','CLOSED') else None
    app_service_requests.append((
        f"SR{(i+1):08d}", auid, acct, stype,
        f"Customer reported {stype} issue. Ref #{random.randint(10000,99999)}.",
        None,  # attachments_ref
        status,
        f"AGENT{random.randint(1000,9999)}",
        created, resolved
    ))

ASR_COLS = ['request_id','app_user_id','account_id','type_id','description',
            'attachments_ref','status','assigned_to','created_at','resolved_at']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 39. APP SERVICE REQUESTS (10,000)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('app_service_requests', ASR_COLS, app_service_requests))

# ═══════════════════════════════════════════════════════════════════════════════
# 40. API TRANSACTIONS (10,000 sampled)
# ═══════════════════════════════════════════════════════════════════════════════
api_transactions = []
for i in range(10000):
    pid = random.choice(PARTNER_IDS)
    ep  = random.choice(EP_IDS)
    ts  = date(2025, 10, 1) + timedelta(days=random.randint(0, 180))
    ok  = random.random() > 0.05
    api_transactions.append((
        f"ATXN{(i+1):010d}", pid, ep,
        f"COR-{uuid.uuid4().hex[:12]}",
        ts, random.randint(50, 2000),
        '200' if ok else random.choice(['400','401','429','500']),
        None if ok else random.choice(['ERR-001','ERR-002','ERR-007','ERR-008']),
        None,
        random.choice(BILL_IDS) if random.random() > 0.6 else None
    ))

AT_COLS = ['api_txn_id','partner_id','endpoint_id','correlation_id',
           'request_time','response_ms','status_code','error_code',
           'payload_ref','bill_id']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 40. API TRANSACTIONS (10,000 sampled)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('api_transactions', AT_COLS, api_transactions))

# ═══════════════════════════════════════════════════════════════════════════════
# 41. AUDIT LOG (10,000 sampled)
# ═══════════════════════════════════════════════════════════════════════════════
audit_actions  = ['CREATE','UPDATE','APPROVE','REJECT','DELETE','VIEW']
audit_tables   = ['customers','accounts','service_connections','bills',
                  'payment_orders','rate_plans','meters','app_users']
audit_logs = []
for i in range(10000):
    tbl = random.choice(audit_tables)
    if tbl == 'customers':    rec = random.choice(CUST_IDS)
    elif tbl == 'bills':      rec = random.choice(BILL_IDS)
    elif tbl == 'accounts':   rec = random.choice(ACCT_IDS)
    else: rec = f"REC{random.randint(100000,999999)}"

    audit_logs.append((
        i+1, random.choice(SU_IDS), tbl, rec,
        random.choice(audit_actions),
        '{"status":"DRAFT"}' if random.random() > 0.5 else None,
        '{"status":"ACTIVE"}' if random.random() > 0.5 else None,
        f"192.168.{random.randint(1,254)}.{random.randint(1,254)}",
        date(2024, 4, 1) + timedelta(days=random.randint(0, 700))
    ))

AL_COLS = ['log_id','user_id','table_name','record_id','action',
           'old_values','new_values','ip_address','created_on']
sections.append("\n-- ═══════════════════════════════════════════════════════")
sections.append("-- 41. AUDIT LOG (10,000 sampled)")
sections.append("-- ═══════════════════════════════════════════════════════")
sections.append(ins('audit_log', AL_COLS, audit_logs))

# ═══════════════════════════════════════════════════════════════════════════════
# WRITE OUTPUT FILE
# ═══════════════════════════════════════════════════════════════════════════════
header = """-- ════════════════════════════════════════════════════════════════════════════
-- BFS ENERZA — COMPLETE SEED DATA
-- Generated for all 48 tables
-- Run against PostgreSQL after: alembic upgrade head
-- ════════════════════════════════════════════════════════════════════════════
SET session_replication_role = replica;  -- disable FK checks during load
BEGIN;

"""
footer = """
COMMIT;
SET session_replication_role = DEFAULT;  -- re-enable FK checks
-- Seed data load complete.
"""

output_path = '/home/claude/seed_data.sql'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(header)
    f.write("\n\n".join(sections))
    f.write(footer)

# Summary
summary = f"""
BFS Enerza Seed Data Summary
=============================
System Users:          {len(system_users):>10,}
CGD Areas:             {len(cgd_areas):>10,}
Routes:                {len(routes):>10,}
Grid Zones:            {len(grid_zones):>10,}
Water Supply Zones:    {len(water_zones):>10,}
Consumer Segments:     {len(segments):>10,}
Pressure Bands:        {len(pressure_bands):>10,}
Tax Master:            {len(taxes):>10,}
Bill Cycles:           {len(bill_cycles):>10,}
Rate Plans:            {len(rate_plans):>10,}
Charge Components:     {len(charge_components):>10,}
Payment Channels:      {len(payment_channels):>10,}
Payment Gateways:      {len(payment_gateways):>10,}
Vehicle Categories:    {len(VEHICLE_TYPES):>10,}
CNG Stations:          {len(cng_stations):>10,}
Notif Templates:       {len(notif_templates):>10,}
Service Req Types:     {len(SR_TYPES):>10,}
API Partners:          {len(api_partners):>10,}
API Endpoint Catalog:  {len(api_endpoints):>10,}
API Credentials:       {len(api_creds):>10,}
API Endpoint Mappings: {len(api_mappings):>10,}
API Rate Limits:       {len(api_rate_limits):>10,}
API Error Codes:       {len(api_errors):>10,}
Webhook Subscriptions: {len(webhooks):>10,}
──────────────────────────────
CUSTOMERS:             {len(customers):>10,}
PREMISES:              {len(premises):>10,}
ACCOUNTS:              {len(accounts):>10,}
SERVICE CONNECTIONS:   {len(connections):>10,}
  Gas details:         {len(conn_details_gas):>10,}
  Electricity details: {len(conn_details_elec):>10,}
  Water details:       {len(conn_details_water):>10,}
METERS:                {len(meters):>10,}
METER INSTALLATIONS:   {len(meter_installs):>10,}
METER READINGS:        {len(meter_readings):>10,}
CNG SALES:             {len(cng_sales):>10,}
BILLS:                 {len(bills):>10,}
BILL LINES:            {len(bill_lines):>10,}
PAYMENT ORDERS:        {len(pay_orders):>10,}
GATEWAY TXNS:          {len(gateway_txns):>10,}
SETTLEMENTS:           {len(settlements):>10,}
SUSPENSE RECORDS:      {len(suspense):>10,}
REFUNDS:               {len(refunds):>10,}
──────────────────────────────
APP USERS:             {len(app_users):>10,}
APP DEVICES:           {len(app_devices):>10,}
APP ACCOUNT LINKS:     {len(app_links):>10,}
APP SESSIONS:          {len(app_sessions):>10,}
APP NOTIFICATIONS:     {len(app_notifications):>10,}
APP SERVICE REQUESTS:  {len(app_service_requests):>10,}
API TRANSACTIONS:      {len(api_transactions):>10,}
AUDIT LOG:             {len(audit_logs):>10,}
──────────────────────────────
TOTAL ROWS:            {
    len(system_users) + len(cgd_areas) + len(routes) + len(grid_zones) +
    len(water_zones) + len(segments) + len(pressure_bands) + len(taxes) +
    len(bill_cycles) + len(rate_plans) + len(charge_components) +
    len(payment_channels) + len(payment_gateways) + len(VEHICLE_TYPES) +
    len(cng_stations) + len(notif_templates) + len(SR_TYPES) +
    len(api_partners) + len(api_endpoints) + len(api_creds) +
    len(api_mappings) + len(api_rate_limits) + len(api_errors) + len(webhooks) +
    len(customers) + len(premises) + len(accounts) + len(connections) +
    len(conn_details_gas) + len(conn_details_elec) + len(conn_details_water) +
    len(meters) + len(meter_installs) + len(meter_readings) + len(cng_sales) +
    len(bills) + len(bill_lines) + len(pay_orders) + len(gateway_txns) +
    len(settlements) + len(suspense) + len(refunds) +
    len(app_users) + len(app_devices) + len(app_links) + len(app_sessions) +
    len(app_notifications) + len(app_service_requests) +
    len(api_transactions) + len(audit_logs):>10,}
"""

with open('/home/claude/seed_data_summary.txt', 'w') as f:
    f.write(summary)

print(summary)
print(f"\nOutput: {output_path}")
print(f"File size: {round(len(open(output_path).read()) / 1024 / 1024, 1)} MB")
