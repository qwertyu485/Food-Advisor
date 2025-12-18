# FoodAdvisor

## Overview

FoodAdvisor is a nutrition assistant web application built with Flask (Python) that helps users search for food calorie information and nutritional data. The application integrates with the USDA FoodData Central API to provide accurate nutritional information including calories, proteins, carbohydrates, and other nutrients. Users can search for foods, view detailed nutrition information, maintain search history, and use a meal calorie calculator to plan their meals.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Template Engine**: Jinja2 templates with Flask's render_template system.

**UI Styling**: Custom CSS with Tailwind-inspired utility patterns. Custom fonts: Inter for body text, Outfit for headings.

**Client-Side JavaScript**: Vanilla JavaScript for interactive features (search, calculator, history accordion).

**Folder Structure**:
- `templates/` - Jinja2 HTML templates
  - `base.html` - Base layout template with header navigation
  - `login.html` - Welcome/landing page
  - `login_input.html` - Login form page
  - `signup.html` - User registration page
  - `home.html` - Food search page
  - `about.html` - About page
  - `help.html` - Help page with contact form
  - `history.html` - Search history with accordion
  - `calculator.html` - Meal calorie calculator
  - `admin.html` - Admin dashboard
- `static/` - Static assets
  - `css/style.css` - Main stylesheet
  - `js/main.js` - Client-side JavaScript
  - `images/` - Logos, backgrounds, favicon

### Backend Architecture

**Framework**: Flask (Python 3.11)

**Database ORM**: Flask-SQLAlchemy with PostgreSQL

**Authentication**: Flask-Login for session management, Werkzeug for password hashing

**Key Dependencies**:
- Flask 3.x - Web framework
- Flask-SQLAlchemy - ORM integration
- Flask-Login - User session management
- psycopg2-binary - PostgreSQL driver
- requests - HTTP client for USDA API

### Data Storage

**Database**: PostgreSQL

**Tables**:
- `flask_users` - User accounts (id, email, password_hash, favorite_food)
- `flask_help_messages` - Contact form submissions (id, name, email, message, created_at)

**Authentication**:
- Password hashing using Werkzeug's generate_password_hash/check_password_hash
- Session-based authentication with Flask-Login

### API Endpoints

**`GET /api/foods/search?q=<query>`**: Search USDA database for foods
- Returns: `{ foods: [...] }` with nutrition data

### Routes

- `/` - Welcome/landing page
- `/login` - Login form (GET/POST)
- `/signup` - Registration form (GET/POST)
- `/logout` - Logout user
- `/home` - Food search page
- `/about` - About page
- `/help` - Help page with contact form (GET/POST)
- `/history` - Search history (localStorage-based)
- `/calculator` - Meal nutrition calculator
- `/admin` - Admin dashboard (password protected: admin123)

## External Dependencies

### Third-Party Services

**USDA FoodData Central API**: Primary data source for nutritional information. Requires API key stored in `USDA_API_KEY` environment variable.

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `USDA_API_KEY` - USDA FoodData Central API key
- `SECRET_KEY` - Flask session secret (optional, has default)

## Running the Application

The application runs through the Node.js wrapper (`server/index.ts`) which spawns the Flask process:

```bash
npm run dev  # Starts Flask via Node.js wrapper
```

Flask runs on `0.0.0.0:5000` (the required port for Replit).
