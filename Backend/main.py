import pandas as pd
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
from utils.unique_identifier_funcs import normalize_mobile_number, parse_children_ages, generate_unique_identifier
from utils.helpers import  calculate_expected_savings, update_compliance_score, update_activity_points,calculate_monthly_scores
from datetime import datetime

# Initialize Firebase
cred = credentials.Certificate("creds.json")  # Update path
firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI(title="Cariya Wallet API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    mobile_number: str
    password: str

class UserRegistration(BaseModel):
    first_name: str
    surname: str
    mobile_number: str
    num_children: int
    ages_of_children_per_birth_order: str

class MonthlyActivity(BaseModel):
    activity: str
    partner: str
    month: int  # Month number (1-12)

class SavingsEntry(BaseModel):
    amount: float
    month: int  # Mo


async def get_db():
    """Dependency to provide Firestore client."""
    return db


@app.post("/register")
async def register_user(user_data: UserRegistration):
    """Register a new user and store their details in Firestore."""
    try:
        # Validate and normalize inputs
        mobile_normalized = normalize_mobile_number(user_data.mobile_number)
        ages = parse_children_ages(user_data.ages_of_children_per_birth_order)

        if len(ages) != user_data.num_children:
            raise HTTPException(status_code=400, detail="Number of children does not match ages provided")

        generated_id = generate_unique_identifier(
            user_data.first_name, user_data.surname, mobile_normalized, user_data.num_children, user_data.ages_of_children_per_birth_order
        )

        # Check for duplicates
        mobile_query = db.collection('users').where('mobile_number', '==', mobile_normalized).get()
        if mobile_query:
            raise HTTPException(status_code=400, detail=f"Mobile number {mobile_normalized} is already registered")

        id_query = db.collection('users').document(generated_id).get()
        if id_query.exists:
            raise HTTPException(status_code=400, detail=f"User with ID {generated_id} already exists")


        # Prepare user data for Firestore
        user_data_dict = {
            "first_name": user_data.first_name,
            "surname": user_data.surname,
            "mobile_number": mobile_normalized,
            "num_children": user_data.num_children,
            "ages_of_children_per_birth_order": ages,
            "generated_id": generated_id,
            'activity_points': 0,
            "savings": 0.0,
            "milestone_score": 0,
            "compliance_score": 0
        }

        # Store user in Firestore
        db.collection('users').document(generated_id).set(user_data_dict)
        return {"message": "User registered successfully", "generated_id": generated_id}

    except HTTPException as e:
        raise e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/login")
async def login_user(login_data: LoginRequest, db: firestore.Client = Depends(get_db)):
    try:
        mobile_normalized = normalize_mobile_number(login_data.mobile_number)
        user_query = db.collection('users').where('mobile_number', '==', mobile_normalized).get()
        if not user_query:
            raise HTTPException(status_code=401, detail="Invalid mobile number or password")
        
        user_doc = user_query[0]
        user = user_doc.to_dict()
        # Add password verification logic here (e.g., check hashed password)
        # For now, assume password is valid
        return {
            "message": "Login successful",
            "user_id": user['generated_id'],
            "token": "dummy-token"  # Replace with actual token generation
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
@app.get("/users/{unique_id}")
async def get_user_info(unique_id: str, db: firestore.Client = Depends(get_db)):
    """Retrieve user information."""
    try:
        doc = db.collection('users').document(unique_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail=f"No user found with unique identifier {unique_id}")
        
        user = doc.to_dict()
        total_savings = 0
        monthly_data = {}
        savings_docs = db.collection('users').document(unique_id).collection('monthly_savings').get()
        for s_doc in savings_docs:
            month_key = s_doc.id
            s_data = s_doc.to_dict()
            total_savings += s_data['savings']
            monthly_data[month_key] = s_data

        return {
            "first_name": user['first_name'],
            "surname": user['surname'],
            "total_savings": total_savings,
            "monthly_data": monthly_data,
            "activity_points": user['activity_points'],
            "milestone_score": user['milestone_score'],
            "compliance_score": user['compliance_score']
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users/{unique_id}/savings")
async def update_savings(unique_id: str, amount: float, month: int = None, db: firestore.Client = Depends(get_db)):
    """Update monthly savings and calculate scores."""
    try:
        if amount < 0:
            raise HTTPException(status_code=400, detail="Savings amount cannot be negative")
        
        doc_ref = db.collection('users').document(unique_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail=f"No user found with unique identifier {unique_id}")
        
        user = doc.to_dict()
        expected_savings = calculate_expected_savings(user['num_children'])
        
        current_month = datetime.now().month if month is None else month
        if current_month > 4:  # Limit to April 2025
            current_month = 4
        month_key = f"{datetime.now().year}-{current_month:02d}"

        # Update monthly savings
        savings_ref = doc_ref.collection('monthly_savings').document(month_key)
        savings_doc = savings_ref.get()
        if savings_doc.exists:
            current_savings = savings_doc.to_dict()['savings']
        else:
            current_savings = 0
        
        new_savings = current_savings + amount
        milestone_score = 1 if new_savings >= expected_savings else 0
        savings_ref.set({
            'savings': new_savings,
            'milestone_score': milestone_score
        })

        # Update compliance score
        compliance_score = update_compliance_score(db, unique_id, current_month)
        doc_ref.update({'compliance_score': compliance_score})

        return {
            "message": f"Updated savings for {user['first_name']} {user['surname']} in {month_key}",
            "new_savings": new_savings,
            "expected_savings": expected_savings,
            "milestone_score": milestone_score,
            "compliance_score": f"{compliance_score}/8"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{unique_id}/compliance")
async def get_compliance(unique_id: str, db: firestore.Client = Depends(get_db)):
    """Get annual compliance score."""
    try:
        doc = db.collection('users').document(unique_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail=f"No user found with unique identifier {unique_id}")
        
        user = doc.to_dict()
        current_month = min(datetime.now().month, 4)  # Limit to April 2025
        max_compliance = current_month * 2  # 2 points per month
        return {
            "first_name": user['first_name'],
            "surname": user['surname'],
            "compliance_score": f"{user['compliance_score']}/{max_compliance}"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/users/{unique_id}/activities")
async def add_monthly_activity(unique_id: str, activity_data: MonthlyActivity, db: firestore.Client = Depends(get_db)):
    """Add a monthly activity for a user and update activity points."""
    try:
        user_ref = db.collection('users').document(unique_id)
        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail=f"No user found with unique identifier {unique_id}")

        if not 1 <= activity_data.month <= 12:
            raise HTTPException(status_code=400, detail="Month must be between 1 and 12")

        current_month = min(datetime.now().month, 4)  # Limit to April 2025
        if activity_data.month > current_month:
            raise HTTPException(status_code=400, detail=f"Cannot add activity for future month {activity_data.month}")

        month_key = f"{datetime.now().year}-{activity_data.month:02d}"
        activity_ref = user_ref.collection('monthly_activities').document(month_key)
        activity_ref.set({
            "activity": activity_data.activity,
            "partner": activity_data.partner,
            "activity_points": 1
        })

        activity_points = update_activity_points(db, unique_id, current_month)
        compliance_score = update_compliance_score(db, unique_id, current_month)

        return {
            "message": f"Activity added for month {month_key}",
            "activity_points": activity_points,
            "compliance_score": f"{compliance_score}/{current_month * 2}"
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/users/{unique_id}/savings")
async def add_savings(unique_id: str, savings_data: SavingsEntry, db: firestore.Client = Depends(get_db)):
    """Add savings for a user in the current month, allowing multiple installments."""
    try:
        # Validate user existence
        user_ref = db.collection('users').document(unique_id)
        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail=f"No user found with unique identifier {unique_id}")
        
        # Validate savings amount
        if savings_data.amount < 0:
            raise HTTPException(status_code=400, detail="Savings amount cannot be negative")
        
        user = user_doc.to_dict()
        expected_savings = calculate_expected_savings(user['num_children'])

        # Automatically determine the current month
        current_month = min(datetime.now().month, 4)  # Limit to April 2025 (as of May 2, 2025)
        month_key = f"{datetime.now().year}-{current_month:02d}"

        # Update monthly savings (accumulate if already exists)
        savings_ref = user_ref.collection('monthly_savings').document(month_key)
        savings_doc = savings_ref.get()
        if savings_doc.exists:
            current_savings = savings_doc.to_dict()['savings']
        else:
            current_savings = 0
        
        new_savings = current_savings + savings_data.amount
        milestone_score = 1 if new_savings >= expected_savings else 0
        savings_ref.set({
            'savings': new_savings,
            'milestone_score': milestone_score
        })

        # Update total savings in user document
        total_savings = user['savings'] + savings_data.amount
        user_ref.update({'savings': total_savings})

        # Recalculate compliance score
        compliance_score = update_compliance_score(db, unique_id, current_month)

        return {
            "message": f"Savings added for month {month_key}",
            "monthly_savings": new_savings,
            "total_savings": total_savings,
            "expected_savings": expected_savings,
            "milestone_score": milestone_score,
            "compliance_score": f"{compliance_score}/{current_month * 2}"
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    


@app.post("/calculate-scores")
async def calculate_scores(month: int = None, db: firestore.Client = Depends(get_db)):
    """Calculate and update milestone, activity, and compliance scores for all users."""
    try:
        result = calculate_monthly_scores(db, month)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    

@app.get("/donor-view")
async def donor_view(db: firestore.Client = Depends(get_db)):
    """Provide a view for donors to see all users' savings and contributions."""
    try:
        users = db.collection('users').get()
        if not users:
            return {"message": "No users found"}

        donor_data = []
        for user_doc in users:
            user = user_doc.to_dict()
            user_id = user_doc.id
            monthly_data = {}
            total_user_savings = 0
            total_donor_contributions = user.get('donor_contributions', 0.0)

            savings_docs = db.collection('users').document(user_id).collection('monthly_savings').get()
            for s_doc in savings_docs:
                month_key = s_doc.id
                s_data = s_doc.to_dict()
                user_savings = s_data.get('savings', 0.0)
                donor_contribution = s_data.get('donor_contribution', 0.0)
                total_user_savings += user_savings
                monthly_data[month_key] = {
                    "user_savings": user_savings,
                    "donor_contribution": donor_contribution
                }

            donor_data.append({
                "user_id": user_id,
                "first_name": user['first_name'],
                "surname": user['surname'],
                "total_savings": user.get('savings', 0.0),
                "total_user_savings": total_user_savings,
                "total_donor_contributions": total_donor_contributions,
                "monthly_data": monthly_data
            })

        return {"donor_view": donor_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)