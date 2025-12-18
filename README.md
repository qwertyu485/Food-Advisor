# Food-Advisor

🍎 FoodAdvisor

Nutrition Search & Meal Planning Web Application

FoodAdvisor is a full-stack Flask web application that helps users explore nutritional information, calculate meal-level nutrition, and track food-related history.
The application integrates with the USDA FoodData Central API and supports user authentication, persistent storage, and an admin dashboard.

🚀 Key Features
🔍 Food Nutrition Search

Search foods by name (e.g. apple, ramen, burger)

Fetches real-time nutrition data from USDA FoodData Central

Displays calories and key macronutrients:

Protein, fat, carbohydrates

Fiber and sugar

🧮 Meal Calculator

Add multiple foods with custom portion sizes (grams)

Automatically computes total nutrition for an entire meal

Supports saving calculated meals to user history

🕘 History Tracking

Logged-in users can view:

Food search history

Meal calculator history

History records stored in a database and rendered dynamically

Ability to clear history by type

👤 User Authentication

User sign-up, login, and logout

Passwords securely hashed

Logged-in users can:

Save search results

Save meal calculations

Guest users can browse food data without persistence

🛠 Admin Dashboard

Admin-protected panel

View registered users and their preferences

Review messages submitted via the Help page

❓ Help & Contact

Help page explaining how to use the application

Contact form for user feedback

Messages stored and viewable in the admin panel

🧠 Technical Highlights

Flask routing with REST-style API endpoints

SQLAlchemy ORM for database models:

Users

History records

Help messages

Session-based authentication using Flask-Login

External API integration with error handling

Modular frontend using Jinja2 templates + JavaScript

🖥 Tech Stack

Backend

Python

Flask

Flask-Login

Flask-SQLAlchemy

SQLAlchemy ORM

Frontend

HTML (Jinja2 templates)

CSS (custom responsive styling)

JavaScript (async fetch, dynamic UI updates)

Data Source

USDA FoodData Central API

📂 Project Structure
.
├── app.py                 # Main Flask application
├── templates/             # Jinja2 HTML templates
│   ├── home.html
│   ├── calculator.html
│   ├── history.html
│   ├── admin.html
│   ├── help.html
│   └── login / signup pages
├── static/
│   ├── css/style.css
│   └── js/main.js
├── requirements.txt
└── README.md

▶️ How to Run Locally
1. Clone the repository
git clone https://github.com/your-username/foodadvisor.git
cd foodadvisor

2. Set environment variables
export USDA_API_KEY=your_api_key_here
export DATABASE_URL=sqlite:///foodadvisor.db
export SECRET_KEY=your_secret_key

3. Install dependencies
pip install -r requirements.txt

4. Run the application
python app.py


Visit:

http://127.0.0.1:5000/

🔮 Future Improvements

Database migrations with Flask-Migrate

Role-based access control for admins

Nutrition goal tracking (daily targets)

Deployment to cloud platforms (Render / AWS / Railway)

Recommendation logic based on user history

👩‍💻 Author

Katie Zhang
NYU | Data, Analytics & Product-Oriented Projects













