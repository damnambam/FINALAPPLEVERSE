# 🍎 AppleVerse

A comprehensive full-stack web application for managing, exploring, and cataloging apple varieties with advanced search capabilities, user authentication, and administrative controls.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Support](#Support)


## 🌟 Overview

AppleVerse is a sophisticated database management system designed for agricultural researchers, botanists, and apple enthusiasts. It provides a centralized platform to store, search, and manage detailed information about apple varieties including their characteristics, origins, breeding information, and visual documentation.

### Key Capabilities
- **Comprehensive Apple Database**: Store detailed information about apple varieties with 100+ data fields
- **Advanced Search & Filtering**: Multi-parameter search with intelligent filtering
- **Image Management**: Upload and manage multiple images per apple variety
- **User Management**: Role-based access control for users and administrators
- **Data Import/Export**: Excel integration for bulk data operations
- **Responsive Design**: Mobile-friendly interface with accessibility features

## ✨ Features

### 🔐 Authentication & Authorization
- **User Registration & Login**: Secure user account management
- **Admin Dashboard**: Administrative controls for user and data management
- **Role-Based Access**: Different permissions for users and administrators
- **Password Recovery**: OTP-based password reset functionality
- **Session Management**: Secure token-based authentication

### 🍎 Apple Data Management
- **Detailed Apple Profiles**: Comprehensive data fields including:
  - Taxonomic information (genus, species, cultivar)
  - Physical characteristics (fruit shape, size, color, texture)
  - Origin and breeding information
  - Phenological data (bloom dates, harvest times)
  - Quality assessments (fireblight rating, density)
- **Image Gallery**: Multiple image support per apple variety
- **Custom Fields**: Extensible schema for additional data points
- **Bulk Operations**: Import/export via Excel files

### 🔍 Search & Discovery
- **Advanced Search**: Multi-field search with filters
- **Visual Browse**: Grid and table view options
- **Sorting & Filtering**: Sort by various parameters
- **Quick Search**: Real-time search suggestions
- **Detailed View**: Comprehensive apple information display

### 📊 Data Management
- **Excel Integration**: Import/export apple data
- **Template System**: Standardized data entry templates
- **Data Validation**: Ensure data quality and consistency
- **Backup & Restore**: Data protection mechanisms

### 🎨 User Experience
- **Dark/Light Mode**: Theme switching with user preferences
- **Accessibility**: High contrast mode and font size adjustment
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Intuitive Navigation**: User-friendly interface design

## 🛠 Tech Stack

### Frontend
- **React 18.2.0**: Modern React with hooks and functional components
- **React Router 6.30.1**: Client-side routing
- **Tailwind CSS 4.1.17**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **Axios**: HTTP client for API requests
- **jsPDF & JSZip**: Document generation and file handling

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js 5.1.0**: Web application framework
- **MongoDB**: NoSQL database for flexible data storage
- **Mongoose 8.20.1**: MongoDB object modeling
- **JWT**: JSON Web Token authentication
- **Bcrypt**: Password hashing and security
- **Multer**: File upload handling
- **CORS**: Cross-origin resource sharing

### Development & Testing
- **Jest**: Testing framework
- **Supertest**: HTTP assertion library
- **MongoDB Memory Server**: In-memory database for testing
- **Nodemon**: Development server with auto-restart
- **ESLint**: Code linting and formatting

## 📁 Project Structure

```
almostfinalapple2.0/
├── backend/                    # Server-side application
│   ├── data/                  # Data files and configurations
│   │   ├── column-order.json  # Excel column mapping
│   │   └── Final_WORKING_Dataset.xlsx
│   ├── images/                # Apple variety images (400+ images)
│   ├── models/                # Database schemas
│   │   ├── Admin.js          # Admin user model
│   │   ├── Apple.js          # Apple variety model (100+ fields)
│   │   └── User.js           # Regular user model
│   ├── routes/                # API route handlers
│   │   ├── adminRoutes.js    # Admin management endpoints
│   │   ├── appleRoutes.js    # Apple CRUD operations
│   │   ├── authRoutes.js     # User authentication
│   │   ├── passwordlessAuthRoutes.js # Password recovery
│   │   └── settingsRoutes.js # User settings
│   ├── scripts/              # Utility scripts
│   ├── tests/                # Backend test suites
│   │   ├── admin.test.js     # Admin functionality tests
│   │   └── auth.test.js      # Authentication tests
│   ├── server.js             # Main server file
│   └── package.json          # Backend dependencies
├── frontend/                  # Client-side application
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   │   ├── AdminDashboard.js    # Admin control panel
│   │   │   ├── AppleDisp.js         # Apple detail display
│   │   │   ├── Navigation.js        # Main navigation
│   │   │   ├── SearchResults.js     # Search functionality
│   │   │   └── [15+ more components]
│   │   ├── pages/            # Page-level components
│   │   │   ├── CreateApple.js       # Apple creation form
│   │   │   ├── LibraryV2.jsx        # Apple library browser
│   │   │   ├── Settings.js          # User settings
│   │   │   └── [6+ more pages]
│   │   ├── services/         # API service layers
│   │   │   ├── authService.js       # Authentication API
│   │   │   ├── adminService.js      # Admin API
│   │   │   └── passwordlessAuthService.js
│   │   ├── styles/           # CSS stylesheets
│   │   └── App.js            # Main application component
│   └── package.json          # Frontend dependencies
├── .gitignore                # Git ignore rules
├── package.json              # Root package configuration
├── README.md                 # Readme file
```

## 🚀 Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (v5.0 or higher)
- **npm** or **yarn** package manager

### 1. Clone the Repository
```bash
git clone <repository-url>
cd finalappleverse
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```
### 🚨 Important: Remove Existing `node_modules`
If the `node_modules` folder is there.  
After cloning, **delete it** and reinstall dependencies to avoid compatibility issues.

```bash
# From project root
rm -rf node_modules
rm -rf client/node_modules
rm -rf server/node_modules
```

### 3. Database Setup
```bash
# Start MongoDB service
mongod

# The application will automatically create the database and collections
```

### 4. Start the Application
```bash
# Terminal 1: Start backend server
cd backend
npm start

# Terminal 2: Start frontend development server
cd frontend
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000


## 📖 Usage

### For Regular Users

1. **Registration**: Create an account at `/signup-login`
2. **Browse Apples**: Explore the apple library at `/library`
3. **Search**: Use the search functionality to find specific varieties
4. **View Details**: Click on any apple to see detailed information
5. **Settings**: Customize your experience in `/settings`

### For Administrators

1. **Admin Login**: Access admin panel with admin credentials
2. **Dashboard**: Manage users and pending requests at `/dashboard`
3. **Add Apples**: Create new apple entries at `/create-apple`
4. **Bulk Import**: Upload Excel files with apple data
5. **User Management**: Approve/reject user registrations

### Key Features Usage

#### Advanced Search
- Use the search bar on the homepage
- Apply filters for specific characteristics
- Sort results by various parameters

#### Apple Management (Admin)
- Navigate to "Create Apple" to add new varieties
- Use the template creator for standardized entries
- Upload multiple images per apple variety

#### Data Import/Export
- Import Excel files with apple data
- Export search results to Excel format
- Use provided templates for data consistency

## 🔌 API Documentation

### Authentication Endpoints

#### User Authentication
```http
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/profile
PUT  /api/auth/settings/profile
```

#### Admin Authentication
```http
POST /api/admin/login
GET  /api/admin/dashboard
POST /api/admin/signup-request
```

### Apple Data Endpoints

#### Public Access
```http
GET  /api/apples              # Get all apples with pagination
GET  /api/apples/:id          # Get specific apple details
GET  /api/apples/search       # Search apples with filters
```

#### Admin Only
```http
POST /api/apples              # Create new apple
PUT  /api/apples/:id          # Update apple information
DELETE /api/apples/:id        # Delete apple entry
POST /api/apples/bulk-import  # Import Excel data
```

### Image Management
```http
POST /api/apples/:id/images   # Upload apple images
GET  /images/:filename        # Serve static images
DELETE /api/apples/:id/images/:imageId # Delete specific image
```

### Response Format
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## 🗄 Database Schema

### Apple Model (100+ Fields)
The Apple model includes comprehensive fields for:

#### Core Identification
- `cultivar_name` (required): Apple variety name
- `accession` (required): Unique accession number
- `site_id`: Site identification
- `label_name`: Display label name

#### Taxonomic Information
- `e_genus`: Genus (default: "Malus")
- `e_species`: Species (default: "domestica")
- `family`: Plant family (default: "Rosaceae")
- `taxon`: Taxonomic classification

#### Physical Characteristics
- `fruitshape_115057`: Fruit shape classification
- `fruitlgth_115156`: Fruit length measurement
- `fruitwidth_115157`: Fruit width measurement
- `frtweight_115121`: Fruit weight
- `colour`/`color`: Fruit color description
- `frttexture_115123`: Fruit texture

#### Origin & Location
- `e_origin_country`: Country of origin
- `e_origin_province`: Province/state of origin
- `country`: Current location country
- `province_state`: Current location province/state
- `habitat`: Natural habitat description

#### Breeding Information
- `e_breeder`: Breeder information
- `e_collector`: Collector information
- `e_pedigree`: Pedigree description
- `pedigree_description`: Detailed pedigree

#### Phenological Data
- `first_bloom_date`: First bloom timing
- `full_bloom_date`: Full bloom timing
- `e_released`: Release date
- `released_date`: Formatted release date

#### Quality Assessments
- `fireblight_rating`: Disease resistance rating
- `density`: Fruit density measurement
- `frttexture_115123`: Texture assessment

#### System Fields
- `images`: Array of image filenames
- `images_count`: Number of uploaded images
- `customFields`: Map for additional user-defined fields
- `createdAt`/`updatedAt`: Timestamps
- `excelRowIndex`: Original Excel row reference

### User Model
```javascript
{
  email: String (required, unique),
  password: String (required, hashed),
  name: String,
  profilePicture: String,
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Admin Model
```javascript
{
  email: String (required, unique),
  password: String (required, hashed),
  name: String,
  role: String (default: "Admin"),
  isActive: Boolean (default: true),
  permissions: [String],
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Testing

The project includes comprehensive testing suites for both backend and frontend components.

### Backend Testing
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage
- **Authentication Tests**: User signup, login, validation
- **Admin Tests**: Admin authentication, permissions
- **API Tests**: CRUD operations, error handling
- **Database Tests**: Model validation, relationships

### Test Files
- `backend/tests/auth.test.js`: User authentication tests (TC001-TC006)
- `backend/tests/admin.test.js`: Admin functionality tests (TC101-TC105)
- `frontend/src/services/__tests__/authService.test.js`: Tests for authentication service functions (TC201-TC211)


## 📞 Support

For support, questions, or contributions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions


---
