from database import SessionLocal, engine, Base
import models
from auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Clear existing
db.query(models.Alert).delete()
db.query(models.Reading).delete()
db.query(models.Session).delete()
db.query(models.Patient).delete()
db.query(models.User).delete()
db.commit()

# Clinician
clinician = models.User(
    email="doctor@vitals.com",
    name="Dr. Priya Sharma",
    hashed_password=hash_password("doctor123"),
    role="clinician"
)
db.add(clinician)
db.flush()

# Patient 1
p1_user = models.User(
    email="patient1@vitals.com",
    name="Arjun Mehta",
    hashed_password=hash_password("patient123"),
    role="patient"
)
db.add(p1_user)
db.flush()

p1 = models.Patient(
    user_id=p1_user.id,
    age=34,
    gender="Male",
    condition="Hypertension",
    assigned_to=clinician.id
)
db.add(p1)

# Patient 2
p2_user = models.User(
    email="patient2@vitals.com",
    name="Sneha Rao",
    hashed_password=hash_password("patient123"),
    role="patient"
)
db.add(p2_user)
db.flush()

p2 = models.Patient(
    user_id=p2_user.id,
    age=28,
    gender="Female",
    condition="Anxiety",
    assigned_to=clinician.id
)
db.add(p2)

db.commit()
print("✅ Seeded: doctor@vitals.com / doctor123")
print("✅ Seeded: patient1@vitals.com / patient123")
print("✅ Seeded: patient2@vitals.com / patient123")
db.close()