from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks # type: ignore
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials # type: ignore
from fastapi.responses import Response # type: ignore
from dotenv import load_dotenv # type: ignore
from starlette.middleware.cors import CORSMiddleware # type: ignore
from motor.motor_asyncio import AsyncIOMotorClient # type: ignore
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr # type: ignore
from typing import List, Optional
import uuid
from datetime import datetime, timedelta, timezone
import bcrypt # type: ignore
import jwt # type: ignore
from enum import Enum
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
from reportlab.lib.pagesizes import letter # type: ignore
from reportlab.pdfgen import canvas # type: ignore
from reportlab.lib.units import inch # type: ignore
import io
import base64
from bson import ObjectId # type: ignore
from fastapi.encoders import jsonable_encoder # type: ignore

from fastapi import Request
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    if request.url.path.startswith("/api/cars/") and request.method == "PUT":
        body = await request.body()
        print(f"=== PUT REQUEST DEBUG ===")
        print(f"URL: {request.url}")
        print(f"Headers: {dict(request.headers)}")
        print(f"Body: {body}")
        print(f"Body decoded: {body.decode() if body else 'Empty'}")
        print("========================")
    
    response = await call_next(request)
    return response

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

exp_time = datetime.fromtimestamp(1752572955)
print(f"Token expires at: {exp_time}")


security = HTTPBearer()

class UserRole(str, Enum):
    USER = "user"
    HOST = "host"

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Email Configuration
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "Rental <" + EMAIL_USER + ">")

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: UserRole
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True
    is_verified: bool = False
    verification_token: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class EmailVerificationRequest(BaseModel):
    token: str

class CarCreate(BaseModel):
    make: str
    model: str
    year: int
    color: str
    price_per_day: float
    description: str
    image_url: str
    location: str
    features: List[str] = []

class Car(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    host_id: str
    make: str
    model: str
    year: int
    color: str
    price_per_day: float
    description: str
    image_url: str
    location: str
    features: List[str] = []
    is_available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None  
    average_rating: float = 0.0
    total_reviews: int = 0

class BookingCreate(BaseModel):
    car_id: str
    start_date: datetime
    end_date: datetime
    total_amount: float
    driver_license: str  # Base64 encoded license image
    additional_notes: Optional[str] = None

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    car_id: str
    host_id: str
    start_date: datetime
    end_date: datetime
    total_amount: float
    driver_license: str
    additional_notes: Optional[str] = None
    status: BookingStatus = BookingStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
class BookingUpdate(BaseModel):
    status: BookingStatus

class ReviewCreate(BaseModel):
    car_id: str
    booking_id: str
    rating: int
    comment: str

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    car_id: str
    booking_id: str
    rating: int
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RoleChangeRequest(BaseModel):
    new_role: UserRole

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

def convert_objectid_to_str(data):
    """Convert ObjectId to string in nested data structures"""
    if isinstance(data, ObjectId):
        return str(data)
    elif isinstance(data, dict):
        return {key: convert_objectid_to_str(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_objectid_to_str(item) for item in data]
    else:
        return data
    
def generate_otp() -> str:
    return str(secrets.randbelow(1000000)).zfill(6)

# Email Functions
def send_email(to_email: str, subject: str, html_content: str, text_content: str = None):
    """Send email using SMTP"""
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = EMAIL_FROM
        msg['To'] = to_email

        # Create the HTML part
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)

        # Create text part if provided
        if text_content:
            text_part = MIMEText(text_content, 'plain')
            msg.attach(text_part)

        # Send the email
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {str(e)}")
        return False

def send_verification_email(user_email: str, user_name: str, verification_token: str):
    """Send email verification email"""
    subject = "Welcome to CarShare - Verify Your Email"
    
    frontend_url = os.getenv("FRONTEND_URL", "https://bfc66c37-bf72-4fd6-92b1-57ed99211b84.preview.emergentagent.com")
    verification_link = f"{frontend_url}?verify={verification_token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - CarShare</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">CarShare</h1>
                <p style="color: #e8f0fe; margin: 10px 0 0 0; font-size: 16px;">Your Car Rental Marketplace</p>
            </div>
            
            <div style="padding: 40px 30px;">
                <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Welcome to CarShare, {user_name}!</h2>
                
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Thank you for joining our car rental marketplace! To get started and ensure the security of your account, 
                    please verify your email address by clicking the button below.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_link}" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; 
                              font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                        Verify Email Address
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(user_email, subject, html_content)

def send_welcome_email(user_email: str, user_name: str, user_role: str):
    """Send welcome email after successful verification"""
    subject = f"Welcome to CarShare - Your {user_role.title()} Account is Ready!"
    
    role_specific_content = ""
    if user_role == "host":
        role_specific_content = """
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2e7d32; margin: 0 0 15px 0;">🚗 Ready to Start Hosting?</h3>
            <p style="color: #2e7d32; margin: 0; font-size: 14px;">
                As a host, you can now list your cars and start earning money! Log in to add your first vehicle 
                and join thousands of hosts already making money with CarShare.
            </p>
        </div>
        """
    else:
        role_specific_content = """
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1976d2; margin: 0 0 15px 0;">🔍 Ready to Find Your Perfect Car?</h3>
            <p style="color: #1976d2; margin: 0; font-size: 14px;">
                Explore our wide selection of vehicles from trusted local hosts. From daily commuters to 
                luxury cars for special occasions - find the perfect car for any need!
            </p>
        </div>
        """
    
    frontend_url = os.getenv("FRONTEND_URL", "https://bfc66c37-bf72-4fd6-92b1-57ed99211b84.preview.emergentagent.com")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CarShare</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎉 Welcome to CarShare!</h1>
                <p style="color: #e8f0fe; margin: 10px 0 0 0; font-size: 16px;">Your account is now verified and ready to use</p>
            </div>
            
            <div style="padding: 40px 30px;">
                <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hello {user_name}! 👋</h2>
                
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Congratulations! Your email has been successfully verified and your CarShare {user_role} account is now active. 
                    You're all set to start your car sharing journey with us!
                </p>
                
                {role_specific_content}
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{frontend_url}" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; 
                              font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                        Start Using CarShare
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(user_email, subject, html_content)

def send_booking_confirmation_email(user_email: str, user_name: str, booking_details: dict):
    """Send booking confirmation email"""
    subject = f"Booking Confirmed - {booking_details['car_make']} {booking_details['car_model']}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation - CarShare</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎉 Booking Confirmed!</h1>
                <p style="color: #e8f0fe; margin: 10px 0 0 0; font-size: 16px;">Your car rental is all set</p>
            </div>
            
            <div style="padding: 40px 30px;">
                <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hello {user_name}!</h2>
                
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Great news! Your booking has been confirmed. Here are your rental details:
                </p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #333333; margin: 0 0 15px 0;">Booking Details</h3>
                    <p style="margin: 5px 0;"><strong>Car:</strong> {booking_details['car_year']} {booking_details['car_make']} {booking_details['car_model']}</p>
                    <p style="margin: 5px 0;"><strong>Booking ID:</strong> {booking_details['booking_id']}</p>
                    <p style="margin: 5px 0;"><strong>Start Date:</strong> {booking_details['start_date']}</p>
                    <p style="margin: 5px 0;"><strong>End Date:</strong> {booking_details['end_date']}</p>
                    <p style="margin: 5px 0;"><strong>Total Amount:</strong> ${booking_details['total_amount']}</p>
                    <p style="margin: 5px 0;"><strong>Location:</strong> {booking_details['location']}</p>
                </div>
                
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                    Your host will contact you soon with pickup instructions. Have a great trip!
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(user_email, subject, html_content)

def send_thank_you_email(user_email: str, user_name: str, car_details: dict):
    """Send thank you email after booking completion"""
    subject = "Thank You for Using CarShare!"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You - CarShare</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Thank You! 🙏</h1>
                <p style="color: #e8f0fe; margin: 10px 0 0 0; font-size: 16px;">We hope you enjoyed your rental</p>
            </div>
            
            <div style="padding: 40px 30px;">
                <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hello {user_name}!</h2>
                
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Thank you for returning the {car_details['make']} {car_details['model']}! We hope you had a wonderful experience.
                </p>
                
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    We'd love to hear about your experience. Please consider leaving a review to help other renters.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="#" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; 
                              font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                        Leave a Review
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(user_email, subject, html_content)

def send_password_reset_email(user_email: str, user_name: str, otp: str):
    """Send password reset OTP email"""
    subject = "CarShare - Password Reset OTP"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Password Reset - CarShare</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🔐 Password Reset</h1>
                <p style="color: #e8f0fe; margin: 10px 0 0 0; font-size: 16px;">CarShare Security</p>
            </div>
            
            <div style="padding: 40px 30px;">
                <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hello {user_name}!</h2>
                
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    You requested a password reset for your CarShare account. Use the OTP below to reset your password:
                </p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <h3 style="color: #333333; margin: 0 0 10px 0;">Your OTP Code:</h3>
                    <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">{otp}</div>
                    <p style="color: #666666; margin: 10px 0 0 0; font-size: 14px;">This OTP will expire in 10 minutes</p>
                </div>
                
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                    If you didn't request this, please ignore this email or contact support if you have concerns.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(user_email, subject, html_content)

def parse_date(date_value):
    """Parse date from various formats (string, timestamp, datetime object)"""
    if isinstance(date_value, datetime):
        return date_value
    elif isinstance(date_value, (int, float)):
        # Assume it's a timestamp
        return datetime.fromtimestamp(date_value)
    elif isinstance(date_value, str):
        # Try ISO format with Z
        if date_value.endswith('Z'):
            return datetime.fromisoformat(date_value.replace('Z', '+00:00'))
        else:
            # Try other common formats
            try:
                return datetime.fromisoformat(date_value)
            except ValueError:
                # Try parsing as timestamp string
                try:
                    return datetime.fromtimestamp(float(date_value))
                except ValueError:
                    # Last resort: try common date formats
                    for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']:
                        try:
                            return datetime.strptime(date_value, fmt)
                        except ValueError:
                            continue
                    raise ValueError(f"Unable to parse date: {date_value}")
    else:
        raise ValueError(f"Unsupported date type: {type(date_value)}")
    
def check_email_typos(email: str) -> str:
    """Check for common email domain typos and suggest corrections"""
    common_domains = {
        'gmial.com': 'gmail.com',
        'gmai.com': 'gmail.com', 
        'yahooo.com': 'yahoo.com',
        'hotmial.com': 'hotmail.com',
        'outlok.com': 'outlook.com',
        'gmailcom': 'gmail.com'
    }
    
    domain = email.split('@')[1] if '@' in email else ''
    if domain in common_domains:
        suggested_email = email.replace(domain, common_domains[domain])
        raise HTTPException(
            status_code=400, 
            detail=f"Did you mean '{suggested_email}'? Please check your email address."
        )
    
    return email

# PDF Generation
def generate_booking_receipt(booking_data: dict, user_data: dict, car_data: dict) -> bytes:
    """Generate PDF receipt for booking"""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Header
    p.setFont("Helvetica-Bold", 24)
    p.drawString(50, height - 50, "CarShare")
    p.setFont("Helvetica", 14)
    p.drawString(50, height - 75, "Booking Receipt")
    
    # Booking details
    y_position = height - 120
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y_position, f"Booking ID: {booking_data['id']}")
    
    y_position -= 30
    p.setFont("Helvetica", 10)
    p.drawString(50, y_position, f"Date: {datetime.now().strftime('%B %d, %Y')}")
    
    y_position -= 40
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, y_position, "Customer Information")
    
    y_position -= 25
    p.setFont("Helvetica", 10)
    p.drawString(50, y_position, f"Name: {user_data['name']}")
    y_position -= 15
    p.drawString(50, y_position, f"Email: {user_data['email']}")
    y_position -= 15
    if user_data.get('phone'):
        p.drawString(50, y_position, f"Phone: {user_data['phone']}")
        y_position -= 15
    
    y_position -= 25
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, y_position, "Car Information")
    
    y_position -= 25
    p.setFont("Helvetica", 10)
    p.drawString(50, y_position, f"Car: {car_data['year']} {car_data['make']} {car_data['model']}")
    y_position -= 15
    p.drawString(50, y_position, f"Color: {car_data['color']}")
    y_position -= 15
    p.drawString(50, y_position, f"Location: {car_data['location']}")
    
    y_position -= 25
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, y_position, "Rental Details")
    
    y_position -= 25
    p.setFont("Helvetica", 10)
    
    # Use the robust date parsing function
    try:
        start_date = parse_date(booking_data['start_date'])
        end_date = parse_date(booking_data['end_date'])
    except ValueError as e:
        print(f"Date parsing error: {e}")
        # Fallback to current time if parsing fails
        start_date = datetime.now()
        end_date = datetime.now()
    
    p.drawString(50, y_position, f"Start Date: {start_date.strftime('%B %d, %Y %I:%M %p')}")
    y_position -= 15
    p.drawString(50, y_position, f"End Date: {end_date.strftime('%B %d, %Y %I:%M %p')}")
    y_position -= 15
    
    rental_days = (end_date - start_date).days + 1
    if rental_days <= 0:
        rental_days = 1  # Minimum 1 day rental
    
    p.drawString(50, y_position, f"Rental Duration: {rental_days} day(s)")
    y_position -= 15
    p.drawString(50, y_position, f"Daily Rate: ${car_data['price_per_day']}")
    
    y_position -= 30
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y_position, f"Total Amount: ${booking_data['total_amount']}")
    
    # Footer
    p.setFont("Helvetica", 8)
    p.drawString(50, 50, "Thank you for choosing CarShare!")
    p.drawString(50, 35, "For support, contact us at support@carshare.com")
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return buffer.read()
# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_verification_token() -> str:
    return secrets.token_urlsafe(32)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    user_obj = User(**user)
    if not user_obj.is_verified:
        raise HTTPException(status_code=403, detail="Email verification required")
    
    return user_obj

# Authentication Routes
@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate, background_tasks: BackgroundTasks):
    check_email_typos(user_data.email)
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    hashed_password = hash_password(user_data.password)
    verification_token = generate_verification_token()
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        phone=user_data.phone,
        is_verified=False,
        verification_token=verification_token
    )
    
    user_dict = user.model_dump()
    user_dict["password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Send verification email in background
    background_tasks.add_task(
        send_verification_email,
        user_data.email,
        user_data.name,
        verification_token
    )
    
    return {
        "message": "Registration successful! Please check your email to verify your account.",
        "email": user_data.email
    }

@api_router.post("/auth/verify-email")
async def verify_email(verification_data: EmailVerificationRequest, background_tasks: BackgroundTasks):
    user = await db.users.find_one({"verification_token": verification_data.token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    
    # Update user as verified
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "is_verified": True,
                "verification_token": None
            }
        }
    )
    
    # Send welcome email in background
    background_tasks.add_task(
        send_welcome_email,
        user["email"],
        user["name"],
        user["role"]
    )
    
    # Create access token
    user_obj = User(**user)
    user_obj.is_verified = True
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_obj.id}, expires_delta=access_token_expires
    )
    
    return {
        "message": "Email verified successfully! Welcome to CarShare!",
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_obj
    }

@api_router.post("/auth/resend-verification")
async def resend_verification(email_data: dict, background_tasks: BackgroundTasks):
    email = email_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("is_verified"):
        raise HTTPException(status_code=400, detail="Email is already verified")
    
    # Generate new verification token
    verification_token = generate_verification_token()
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"verification_token": verification_token}}
    )
    
    # Send verification email in background
    background_tasks.add_task(
        send_verification_email,
        user["email"],
        user["name"],
        verification_token
    )
    
    return {"message": "Verification email sent! Please check your inbox."}

@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    check_email_typos(user_credentials.email)
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    user_obj = User(**user)
    
    if not user_obj.is_verified:
        raise HTTPException(
            status_code=403, 
            detail="Please verify your email address before logging in. Check your inbox for the verification email."
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_obj.id}, expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.put("/auth/change-role")
async def change_role(role_data: RoleChangeRequest, current_user: User = Depends(get_current_user)):
    # Update user role
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"role": role_data.new_role}}
    )
    
    return {"message": f"Role changed to {role_data.new_role} successfully"}

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    check_email_typos(request.email)
    user = await db.users.find_one({"email": request.email})
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, you will receive a password reset OTP."}
    
    # Generate OTP and set expiry (10 minutes from now)
    otp = generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Update user with OTP and expiry
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "password_reset_otp": otp,
                "otp_expiry": otp_expiry
            }
        }
    )
    
    # Send OTP email in background
    background_tasks.add_task(
        send_password_reset_email,
        user["email"],
        user["name"],
        otp
    )
    
    return {"message": "If the email exists, you will receive a password reset OTP."}

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    check_email_typos(request.email)
    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or OTP")
    
    # Check if OTP exists and is not expired
    if (not user.get("password_reset_otp") or 
        not user.get("otp_expiry") or
        datetime.now(timezone.utc) > user["otp_expiry"]):
        raise HTTPException(status_code=400, detail="OTP has expired or is invalid")
    
    # Verify OTP
    if user["password_reset_otp"] != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Hash new password
    hashed_password = hash_password(request.new_password)
    
    # Update password and remove OTP fields
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {"password": hashed_password},
            "$unset": {"password_reset_otp": "", "otp_expiry": ""}
        }
    )
    
    return {"message": "Password reset successfully"}

@api_router.put("/profile", response_model=User)
async def update_profile(profile_data: UserProfile, current_user: User = Depends(get_current_user)):
    # Update user profile
    update_data = profile_data.model_dump(exclude_unset=True)
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_data}
    )
    
    # Return updated user
    updated_user = await db.users.find_one({"id": current_user.id})
    return User(**updated_user)

# Car Routes
@api_router.post("/cars", response_model=Car)
async def create_car(car_data: CarCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.HOST:
        raise HTTPException(status_code=403, detail="Only hosts can add cars")
    
    car = Car(**car_data.model_dump(), host_id=current_user.id)
    await db.cars.insert_one(car.model_dump())
    return car

@api_router.get("/cars", response_model=List[dict])
async def get_cars(location: Optional[str] = None):
    query = {"is_available": True}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    cars = await db.cars.find(query).to_list(1000)
    
    # Add reviews to each car
    cars_with_reviews = []
    for car in cars:
        car_obj = Car(**car)
        
        # Get reviews for this car
        reviews = await db.reviews.find({"car_id": car["id"]}).to_list(1000)
        
        # Get user names for reviews
        review_list = []
        for review in reviews:
            user = await db.users.find_one({"id": review["user_id"]})
            review_obj = Review(**review)
            review_dict = review_obj.model_dump()
            review_dict["user_name"] = user["name"] if user else "Anonymous"
            review_list.append(review_dict)
        
        car_dict = car_obj.dict()
        car_dict["reviews"] = review_list
        cars_with_reviews.append(car_dict)
    
    return cars_with_reviews

@api_router.get("/cars/{car_id}", response_model=dict)
async def get_car(car_id: str):
    car = await db.cars.find_one({"id": car_id})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    car_obj = Car(**car)
    
    # Get reviews for this car
    reviews = await db.reviews.find({"car_id": car_id}).to_list(1000)
    
    # Get user names for reviews
    review_list = []
    for review in reviews:
        user = await db.users.find_one({"id": review["user_id"]})
        review_obj = Review(**review)
        review_dict = review_obj.dict()
        review_dict["user_name"] = user["name"] if user else "Anonymous"
        review_list.append(review_dict)
    
    car_dict = car_obj.model_dump()
    car_dict["reviews"] = review_list
    
    return car_dict

@api_router.get("/my-cars", response_model=List[Car])
async def get_my_cars(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.HOST:
        raise HTTPException(status_code=403, detail="Only hosts can view their cars")
    
    cars = await db.cars.find({"host_id": current_user.id}).to_list(1000)
    return [Car(**car) for car in cars]

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.USER:
        raise HTTPException(status_code=403, detail="Only users can create bookings")
    
    # Check if car exists and is available
    car = await db.cars.find_one({"id": booking_data.car_id, "is_available": True})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found or not available")
    
    # Check for conflicting bookings
    conflicting_booking = await db.bookings.find_one({
        "car_id": booking_data.car_id,
        "status": {"$in": ["pending", "confirmed", "active"]},
        "$or": [
            {"start_date": {"$lte": booking_data.end_date, "$gte": booking_data.start_date}},
            {"end_date": {"$lte": booking_data.end_date, "$gte": booking_data.start_date}},
            {"start_date": {"$lte": booking_data.start_date}, "end_date": {"$gte": booking_data.end_date}}
        ]
    })
    
    if conflicting_booking:
        raise HTTPException(status_code=400, detail="Car is not available for selected dates")
    
    booking = Booking(
        **booking_data.dict(),
        user_id=current_user.id,
        host_id=car["host_id"],
        status=BookingStatus.CONFIRMED
    )
    
    # Convert ObjectId fields before inserting
    booking_dict = booking.mode_dump()
    booking_dict = convert_objectid_to_str(booking_dict)
    await db.bookings.insert_one(booking_dict)
    
    # Send booking confirmation email
    booking_details = {
        'booking_id': booking.id,
        'car_make': car['make'],
        'car_model': car['model'],
        'car_year': car['year'],
        'start_date': booking_data.start_date.strftime('%B %d, %Y'),
        'end_date': booking_data.end_date.strftime('%B %d, %Y'),
        'total_amount': booking_data.total_amount,
        'location': car['location']
    }
    
    background_tasks.add_task(
        send_booking_confirmation_email,
        current_user.email,
        current_user.name,
        booking_details
    )
    
    return booking

@api_router.get("/bookings")
async def get_my_bookings(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.USER:
        bookings = await db.bookings.find({"user_id": current_user.id}).to_list(1000)
        
        # Add car and host details for user bookings
        booking_list = []
        for booking in bookings:
            # Convert all ObjectIds to strings
            booking = convert_objectid_to_str(booking)
            
            car = await db.cars.find_one({"id": booking["car_id"]})
            host = await db.users.find_one({"id": booking["host_id"]})
            
            # Create booking dict without using Pydantic model
            booking_dict = booking.copy()
            
            # Handle car data - create a clean car object without ObjectId issues
            if car:
                booking_dict["car"] = {
                    "id": car["id"],
                    "brand": car.get("brand"),
                    "model": car.get("model"), 
                    "make": car.get("make"),  # Added make field
                    "year": car.get("year"),
                    "price_per_day": car.get("price_per_day"),
                    "location": car.get("location"),
                    "image_url": car.get("image_url"),
                }
            else:
                booking_dict["car"] = None
                
            # Handle host data - only include needed fields
            if host:
                booking_dict["host"] = {
                    "name": host["name"], 
                    "phone": host.get("phone")
                }
            else:
                booking_dict["host"] = None
                
            booking_list.append(booking_dict)
            
        return booking_list
        
    else:  # HOST
        bookings = await db.bookings.find({"host_id": current_user.id}).to_list(1000)
        
        # Add car and user details for host bookings
        booking_list = []
        for booking in bookings:
            # Convert all ObjectIds to strings
            booking = convert_objectid_to_str(booking)
            
            car = await db.cars.find_one({"id": booking["car_id"]})
            user = await db.users.find_one({"id": booking["user_id"]})
            
            # Create booking dict without using Pydantic model
            booking_dict = booking.copy()
            
            # Handle car data - create a clean car object without ObjectId issues
            if car:
                booking_dict["car"] = {
                    "id": car["id"],
                    "brand": car.get("brand"),
                    "model": car.get("model"),
                    "make": car.get("make"),  # Added make field
                    "year": car.get("year"),
                    "price_per_day": car.get("price_per_day"),
                    "location": car.get("location"),
                    "image_url": car.get("image_url"),
                }
            else:
                booking_dict["car"] = None
                
            # Handle user data - only include needed fields
            if user:
                booking_dict["user"] = {
                    "name": user["name"], 
                    "phone": user.get("phone"), 
                    "email": user["email"]
                }
            else:
                booking_dict["user"] = None
                
            booking_list.append(booking_dict)
            
        return booking_list

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status_data: BookingUpdate, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check permissions
    if current_user.role == UserRole.HOST and booking["host_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the host can update booking status")
    elif current_user.role == UserRole.USER and booking["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the booking owner can cancel")
    
    # Users can only cancel their bookings
    if current_user.role == UserRole.USER and status_data.status != BookingStatus.CANCELLED:
        raise HTTPException(status_code=403, detail="Users can only cancel bookings")
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": status_data.status}}
    )
    
    # Send thank you email when booking is completed
    if status_data.status == BookingStatus.COMPLETED:
        user = await db.users.find_one({"id": booking["user_id"]})
        car = await db.cars.find_one({"id": booking["car_id"]})
        
        if user and car:
            background_tasks.add_task(
                send_thank_you_email,
                user["email"],
                user["name"],
                {"make": car["make"], "model": car["model"]}
            )
    
    return {"message": "Booking status updated successfully"}

@api_router.get("/bookings/{booking_id}/receipt")
async def download_receipt(booking_id: str, current_user: User = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user owns this booking
    if booking["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get car and user details
    car = await db.cars.find_one({"id": booking["car_id"]})
    user = await db.users.find_one({"id": current_user.id})
    
    if not car or not user:
        raise HTTPException(status_code=404, detail="Related data not found")
    
    # Generate PDF receipt
    pdf_data = generate_booking_receipt(booking, user, car)
    
    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=receipt_{booking_id}.pdf"}
    )

@api_router.put("/cars/{car_id}", response_model=Car)
async def update_car(car_id: str, car_data: CarCreate, current_user: User = Depends(get_current_user)):
    print(f"PUT request for car_id: {car_id}")
    print(f"Current user: {current_user.id}")
    print(f"User role: {current_user.role}")
    print(f"Car data received: {car_data}")

    if current_user.role != UserRole.HOST:
        raise HTTPException(status_code=403, detail="Only hosts can update cars")
    
    # Check if car exists and belongs to the current user
    print(f"Looking for car with id: {car_id} and host_id: {current_user.id}")
    existing_car = await db.cars.find_one({"id": car_id, "host_id": current_user.id})
    print(f"Existing car found: {existing_car is not None}")
    if not existing_car:
        print("Car not found or permission denied")
        raise HTTPException(status_code=404, detail="Car not found or you don't have permission to edit it")
    
    # Check if there are any active bookings for this car
    print(f"Checking for active bookings for car: {car_id}")
    active_booking = await db.bookings.find_one({
        "car_id": car_id,
        "status": {"$in": ["confirmed", "active"]}
    })
    print(f"Active booking found: {active_booking is not None}")
    
    if active_booking:
        print("Active booking exists - cannot update")
        raise HTTPException(
            status_code=400, 
            detail="Cannot edit car details while there are active or confirmed bookings"
        )
    
    # Update car data
    print("Preparing update data")
    update_data = car_data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc)
    print(f"Update data: {update_data}")
    
    print("Executing database update")
    result = await db.cars.update_one(
        {"id": car_id, "host_id": current_user.id},
        {"$set": update_data}
    )
    print(f"Update result - matched: {result.matched_count}, modified: {result.modified_count}")
    
    if result.modified_count == 0:
        print("Failed to update car - no modifications made")
        raise HTTPException(status_code=400, detail="Failed to update car")
    
    # Return updated car
    print("Fetching updated car")
    updated_car = await db.cars.find_one({"id": car_id})
    print(f"Updated car found: {updated_car is not None}")

    return Car(**updated_car)


@api_router.delete("/cars/{car_id}")
async def delete_car(car_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.HOST:
        raise HTTPException(status_code=403, detail="Only hosts can delete cars")
    
    # Check if car exists and belongs to the current user
    existing_car = await db.cars.find_one({"id": car_id, "host_id": current_user.id})
    if not existing_car:
        raise HTTPException(status_code=404, detail="Car not found or you don't have permission to delete it")
    
    # Check if there are any active bookings for this car
    active_booking = await db.bookings.find_one({
        "car_id": car_id,
        "status": {"$in": ["pending", "confirmed", "active"]}
    })
    
    if active_booking:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete car while there are pending, confirmed, or active bookings"
        )
    
    # Check if there are any completed bookings (optional - you might want to keep the car for historical purposes)
    completed_bookings = await db.bookings.count_documents({
        "car_id": car_id,
        "status": "completed"
    })
    
    if completed_bookings > 0:
        # Instead of deleting, mark as unavailable
        await db.cars.update_one(
            {"id": car_id},
            {"$set": {"is_available": False, "deleted_at": datetime.now(timezone.utc)}}
        )
        return {"message": "Car marked as unavailable due to booking history"}
    
    # Delete the car if no bookings exist
    result = await db.cars.delete_one({"id": car_id, "host_id": current_user.id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=400, detail="Failed to delete car")
    
    # Also delete any reviews associated with this car
    await db.reviews.delete_many({"car_id": car_id})
    
    return {"message": "Car deleted successfully"}

# Review Routes
@api_router.post("/reviews", response_model=Review)
async def create_review(review_data: ReviewCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.USER:
        raise HTTPException(status_code=403, detail="Only users can create reviews")
    
    # Check if booking exists and belongs to user
    booking = await db.bookings.find_one({
        "id": review_data.booking_id,
        "user_id": current_user.id,
        "status": BookingStatus.COMPLETED
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or not completed")
    
    # Check if review already exists
    existing_review = await db.reviews.find_one({"booking_id": review_data.booking_id})
    if existing_review:
        raise HTTPException(status_code=400, detail="Review already exists for this booking")
    
    review = Review(**review_data.model_dump(), user_id=current_user.id)
    await db.reviews.insert_one(review.model_dump())
    
    # Update car average rating
    car_reviews = await db.reviews.find({"car_id": review_data.car_id}).to_list(1000)
    if car_reviews:
        total_rating = sum(r["rating"] for r in car_reviews)
        average_rating = total_rating / len(car_reviews)
        
        await db.cars.update_one(
            {"id": review_data.car_id},
            {
                "$set": {
                    "average_rating": round(average_rating, 1),
                    "total_reviews": len(car_reviews)
                }
            }
        )
    
    return review

@api_router.get("/reviews/car/{car_id}", response_model=List[dict])
async def get_car_reviews(car_id: str):
    reviews = await db.reviews.find({"car_id": car_id}).to_list(1000)
    
    # Add user names to reviews
    review_list = []
    for review in reviews:
        user = await db.users.find_one({"id": review["user_id"]})
        review_obj = Review(**review)
        review_dict = review_obj.model_dump()
        review_dict["user_name"] = user["name"] if user else "Anonymous"
        review_list.append(review_dict)
    
    return review_list

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn # type: ignore
    uvicorn.run(app, host="0.0.0.0", port=8000)