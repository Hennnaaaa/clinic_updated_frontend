# Clinic Management System - Frontend

Frontend application for Begum Sahib Noor Zaman Sahulat Dispensary built with Next.js.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:

Create a `.env.local` file in the root directory:
```
API_URL=http://localhost:5000/api
```

## Running the Application

Development mode:
```bash
npm run dev
```

The application will run on `http://localhost:3000`

Production build:
```bash
npm run build
npm start
```

## Default Login Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

**Doctor:**
- Username: `doctor1`
- Password: `doctor123`

## Features

### Admin Role
- Dashboard with statistics
- Medicine inventory management (Add, Edit, Delete)
- View all patients across doctors
- Generate detailed reports with filters
- Download prescriptions
- View patient history

### Doctor Role
- Personal dashboard
- Add new patient records
- View own patients only
- View medicine inventory (read-only)
- Prescribe medicines
- Fill patient forms with all details

## Project Structure

```
frontend/
├── components/
│   ├── common/          # Reusable components
│   └── layout/          # Layout components
├── context/
│   └── AuthContext.js   # Authentication context
├── pages/
│   ├── admin/           # Admin pages
│   ├── doctor/          # Doctor pages
│   ├── _app.js
│   ├── _document.js
│   ├── index.js
│   └── login.js
├── styles/
│   └── globals.css      # Global styles with Tailwind
├── utils/
│   └── api.js           # API utility
└── package.json
```

## Technology Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: React Icons
- **Notifications**: React Toastify

## Features Implemented

✅ Role-based authentication (Admin & Doctor)
✅ Responsive design with beautiful UI
✅ Medicine inventory management
✅ Patient record management
✅ Prescription management
✅ Advanced filtering and search
✅ Statistical reports with charts
✅ Protected routes based on roles

## Pages

### Public
- `/login` - Login page for both roles

### Admin Pages
- `/admin/dashboard` - Admin dashboard with stats
- `/admin/medicines` - Medicine inventory management
- `/admin/patients` - All patients view
- `/admin/reports` - Reports and analytics

### Doctor Pages
- `/doctor/dashboard` - Doctor dashboard
- `/doctor/new-patient` - Add new patient form
- `/doctor/patients` - View own patients
- `/doctor/medicines` - View medicines (read-only)

## Design Features

- Modern gradient-based design
- Medical-themed color scheme
- Smooth animations and transitions
- Responsive layout for all devices
- Clean and professional interface
- Intuitive navigation
