# Car Rental Management System

A comprehensive car rental platform that connects car owners (hosts) with customers looking to rent vehicles. This system provides an efficient way to manage car rentals, bookings, customer verification, and host management with separate dashboards for different user types.

## Table of Contents

- [About](#about)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [Testing](#testing)
- [Deployment](#deployment)
- [Built With](#built-with)
- [License](#license)
- [Contact](#contact)
- [Acknowledgments](#acknowledgments)

## About

The Car Rental Management System is a modern peer-to-peer car sharing platform that enables car owners to rent out their vehicles to customers. The platform provides:

- **For Car Owners (Hosts)**: Upload and manage your cars for rental, set pricing, and track bookings
- **For Customers**: Browse available cars, make bookings with date selection, and upload driving license verification
- **Dual Registration System**: Separate registration flows for users and hosts
- **Email Verification**: Secure email-based account verification
- **Separate Dashboards**: Customized interfaces for different user types

### Project Links

- **GitHub Repository**: [https://github.com/JxTIN21/Rental](https://github.com/JxTIN21/Rental)

## Features

### For Customers (Users)
- 🚗 **Browse Available Cars**: View all available rental cars with detailed specifications and pricing
- 📅 **Date Selection**: Select start and end dates for car rental period
- 📄 **License Upload**: Upload driving license for verification and compliance
- 📱 **User Dashboard**: Manage bookings, view rental history, and track current rentals
- 🔐 **Secure Registration**: Email verification for account security
- 💳 **Booking Management**: Easy booking process with confirmation system

### For Hosts (Car Owners)
- 🏠 **Car Management**: Upload and manage your cars available for rental
- 📊 **Host Dashboard**: Track bookings, earnings, and car performance analytics
- 💰 **Pricing Control**: Set competitive rental rates for your vehicles
- 🔧 **Car Details Management**: Update car specifications, photos, and availability

### General Features
- 👥 **Dual User System**: Separate registration and login for users and hosts
- 📧 **Email Verification**: Automated email verification for all new accounts
- 🔐 **Secure Authentication**: JWT-based authentication with role-based access

## Getting Started

### Prerequisites

Before running this project, make sure you have the following installed:

```bash
- Python 3.8 or higher
- Node.js (v16.0 or higher)
- npm or yarn
- MongoDB
- Git
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/JxTIN21/Rental.git
cd Rental
```

2. Set up the Backend (FastAPI):
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

3. Set up the Frontend (React):
```bash
cd frontend
npm install
```

4. Set up environment variables:
```bash
# In the root directory, create .env file
cp .env.example .env
# Edit .env with your configuration:
# - MongoDB URI
# - JWT secret key
# - Email service credentials (SMTP)
# - File upload settings
# - Frontend URL for CORS
```

Example .env file:
```env
MONGODB_URI=mongodb://localhost:27017/car_rental
JWT_SECRET=your-super-secret-jwt-key
JWT_ALGORITHM=HS256
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
UPLOAD_FOLDER=uploads/
MAX_FILE_SIZE=5242880  # 5MB
```

5. Start MongoDB service on your system

6. Run the application:

Backend (Terminal 1):
```bash
# cd backend
python server.py
```

Frontend (Terminal 2):
```bash
cd frontend
npm start
```

The FastAPI backend will be available at `http://localhost:8000`
The React frontend will be available at `http://localhost:3000`

## Usage

### For Customers (Renters)

1. **User Registration**: Register as a customer with email verification
2. **Browse Cars**: View available cars with specifications, photos, and pricing
3. **Select Dates**: Choose your rental start and end dates
4. **Upload License**: Upload your driving license for verification
5. **Make Booking**: Complete your car rental reservation
6. **Manage Rentals**: Access your user dashboard to track current and past bookings

### For Hosts (Car Owners)

1. **Host Registration**: Register as a host with email verification
2. **Add Your Car**: Upload car details, photos, and specifications
3. **Set Pricing**: Define rental rates and availability
4. **Manage Bookings**: Use host dashboard to approve/decline rental requests

### Registration Flow

```javascript
// Customer Registration Example
const customerData = {
  name: "John Doe",
  email: "john@example.com",
  password: "securepassword",
  userType: "customer",
  phone: "+1234567890"
};

// Host Registration Example
const hostData = {
  name: "Jane Smith",
  email: "jane@example.com",
  password: "securepassword",
  userType: "host",
  phone: "+1234567890",
};
```

### Car Booking Process

```javascript
// Car Booking Example
const bookingData = {
  carId: "car123",
  customerId: "customer456",
  startDate: "2024-08-01",
  endDate: "2024-08-07",
  drivingLicense: "license_file.pdf",
  totalAmount: 350.00
};
```

## API Reference

### Authentication

```http
POST /api/auth/register/customer    # Customer registration
POST /api/auth/register/host        # Host registration
POST /api/auth/login                # Login for both user types
POST /api/auth/logout               # Logout
POST /api/auth/verify-email         # Email verification
POST /api/auth/resend-verification  # Resend verification email
```

### Cars

```http
GET /api/cars                       # Get all available cars
POST /api/cars                      # Add new car (host only)
GET /api/cars/{id}                  # Get car details
PUT /api/cars/{id}                  # Update car (host only)
DELETE /api/cars/{id}               # Delete car (host only)
GET /api/cars/search                # Search cars with filters
```

### Bookings

```http
GET /api/bookings                   # Get user's bookings
POST /api/bookings                  # Create new booking
GET /api/bookings/{id}              # Get booking details
PUT /api/bookings/{id}              # Update booking status
DELETE /api/bookings/{id}           # Cancel booking
```

### Users

```http
GET /api/users/me                   # Get current user profile
PUT /api/users/me                   # Update user profile
GET /api/users/dashboard            # Get dashboard data
```

### File Uploads

```http
POST /api/upload/license            # Upload driving license
POST /api/upload/car-images         # Upload car photos
```

### Host Specific

```http
GET /api/host/cars                  # Get host's cars
GET /api/host/bookings              # Get bookings for host's cars
GET /api/host/earnings              # Get earnings analytics
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id`      | `string` | **Required**. ID of car/booking to fetch |
| `start_date` | `string` | **Required**. Rental start date (YYYY-MM-DD) |
| `end_date` | `string` | **Required**. Rental end date (YYYY-MM-DD) |

FastAPI automatically generates interactive API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## Built With

### Backend
- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern, fast web framework for building APIs with Python
- **[Uvicorn](https://www.uvicorn.org/)** - Lightning-fast ASGI server implementation
- **[Motor](https://motor.readthedocs.io/)** - Asynchronous Python driver for MongoDB
- **[Pydantic](https://docs.pydantic.dev/)** - Data validation using Python type hints
- **[PyJWT](https://pyjwt.readthedocs.io/)** - JSON Web Token implementation in Python
- **[bcrypt](https://github.com/pyca/bcrypt/)** - Password hashing library
- **[ReportLab](https://www.reportlab.com/)** - PDF generation library

### Frontend
- **[React](https://reactjs.org/)** - JavaScript library for building user interfaces
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Flowbite React](https://flowbite-react.com/)** - React components built with Tailwind CSS
- **[React Icons](https://react-icons.github.io/react-icons/)** - Popular icon library for React

### Database
- **[MongoDB](https://www.mongodb.com/)** - NoSQL database for flexible data storage
- **[PyMongo](https://pymongo.readthedocs.io/)** - Python driver for MongoDB

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

JxTIN21 - [GitHub Profile](https://github.com/JxTIN21)

Project Link: [https://github.com/JxTIN21/Rental](https://github.com/JxTIN21/Rental)

## Acknowledgments

- Thanks to all contributors who helped make this project possible
- Open source libraries and frameworks that power this application
- Community feedback and suggestions for improvements

---

⭐ If you found this project helpful, please give it a star on GitHub!
