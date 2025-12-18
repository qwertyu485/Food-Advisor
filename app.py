import os
import json
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import requests
import uuid

# Load composite recipes
with open('composite_recipes.json', 'r') as f:
    COMPOSITE_RECIPES = json.load(f)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

USDA_API_KEY = os.environ.get('USDA_API_KEY')
ADMIN_PASSWORD = "admin123"

class User(UserMixin, db.Model):
    __tablename__ = 'flask_users'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    favorite_food = db.Column(db.String(255), nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class HelpMessage(db.Model):
    __tablename__ = 'flask_help_messages'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class HistoryRecord(db.Model):
    __tablename__ = 'flask_history'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('flask_users.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'search' or 'calculator'
    payload = db.Column(db.Text, nullable=False)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(user_id)

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    next_page = request.args.get('next')
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        next_page = request.form.get('next') or request.args.get('next')
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            login_user(user)
            if next_page and next_page.startswith('/'):
                return redirect(next_page)
            return redirect(url_for('home'))
        else:
            flash('Invalid email or password', 'error')
    
    return render_template('login_input.html', next=next_page)

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        favorite_food = request.form.get('favorite_food', '')
        
        if len(password) < 6:
            flash('Password must be at least 6 characters', 'error')
            return render_template('signup.html')
        
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Email already registered', 'error')
            return render_template('signup.html')
        
        user = User(email=email, favorite_food=favorite_food if favorite_food else None)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        flash('Account created successfully! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('signup.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/help', methods=['GET', 'POST'])
def help_page():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        message = request.form.get('message')
        
        if name and email and message:
            help_msg = HelpMessage(name=name, email=email, message=message)
            db.session.add(help_msg)
            db.session.commit()
            flash('Message sent successfully!', 'success')
        else:
            flash('Please fill in all fields', 'error')
    
    return render_template('help.html')

@app.route('/history')
@login_required
def history():
    return render_template('history.html')

@app.route('/calculator')
@login_required
def calculator():
    return render_template('calculator.html')

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    admin_authenticated = session.get('admin_authenticated', False)
    
    if request.method == 'POST':
        password = request.form.get('admin_password')
        if password == ADMIN_PASSWORD:
            session['admin_authenticated'] = True
            admin_authenticated = True
        else:
            flash('Incorrect admin password', 'error')
    
    users = []
    messages = []
    
    if admin_authenticated:
        users = User.query.all()
        messages = HelpMessage.query.order_by(HelpMessage.created_at.desc()).all()
    
    return render_template('admin.html', 
                         admin_authenticated=admin_authenticated,
                         users=users, 
                         messages=messages)

@app.route('/api/foods/search')
def api_foods_search():
    query = request.args.get('q', '')
    if not query:
        return jsonify({'error': 'Query parameter required'}), 400
    
    if not USDA_API_KEY:
        return jsonify({'error': 'USDA API key not configured'}), 500
    
    try:
        url = f"https://api.nal.usda.gov/fdc/v1/foods/search?api_key={USDA_API_KEY}&query={query}&pageSize=10"
        response = requests.get(url)
        data = response.json()
        return jsonify({'foods': data.get('foods', [])})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_nutrient_value(nutrients, name):
    for n in nutrients:
        if n.get('nutrientName') == name:
            return n.get('value', 0)
    return 0

def search_usda_food(query):
    try:
        url = f"https://api.nal.usda.gov/fdc/v1/foods/search?api_key={USDA_API_KEY}&query={query}&pageSize=1"
        response = requests.get(url)
        data = response.json()
        foods = data.get('foods', [])
        if foods:
            return foods[0]
        return None
    except:
        return None

@app.route('/api/foods/composite')
def api_foods_composite():
    query = request.args.get('q', '').lower().strip()
    if not query:
        return jsonify({'error': 'Query parameter required'}), 400
    
    if not USDA_API_KEY:
        return jsonify({'error': 'USDA API key not configured'}), 500
    
    # Check if we have a predefined recipe
    recipe = COMPOSITE_RECIPES.get(query)
    
    if not recipe:
        # Try partial match
        for key in COMPOSITE_RECIPES:
            if key in query or query in key:
                recipe = COMPOSITE_RECIPES[key]
                break
    
    if not recipe:
        return jsonify({'error': f'No recipe found for "{query}". Try: peanut butter sandwich, ham sandwich, grilled cheese, burger, caesar salad, etc.'}), 404
    
    # Fetch nutrition for each ingredient
    ingredients_data = []
    totals = {'calories': 0, 'protein': 0, 'fat': 0, 'carbs': 0, 'fiber': 0, 'sugar': 0}
    
    for ingredient in recipe['ingredients']:
        food = search_usda_food(ingredient['search'])
        if food:
            nutrients = food.get('foodNutrients', [])
            scale = ingredient['grams'] / 100  # USDA data is per 100g
            
            ing_data = {
                'name': ingredient['name'],
                'grams': ingredient['grams'],
                'calories': round(get_nutrient_value(nutrients, 'Energy') * scale, 1),
                'protein': round(get_nutrient_value(nutrients, 'Protein') * scale, 1),
                'fat': round(get_nutrient_value(nutrients, 'Total lipid (fat)') * scale, 1),
                'carbs': round(get_nutrient_value(nutrients, 'Carbohydrate, by difference') * scale, 1),
                'fiber': round(get_nutrient_value(nutrients, 'Fiber, total dietary') * scale, 1),
                'sugar': round(get_nutrient_value(nutrients, 'Sugars, total including NLEA') * scale, 1),
                'found': True
            }
            
            totals['calories'] += ing_data['calories']
            totals['protein'] += ing_data['protein']
            totals['fat'] += ing_data['fat']
            totals['carbs'] += ing_data['carbs']
            totals['fiber'] += ing_data['fiber']
            totals['sugar'] += ing_data['sugar']
            
            ingredients_data.append(ing_data)
        else:
            ingredients_data.append({
                'name': ingredient['name'],
                'grams': ingredient['grams'],
                'found': False,
                'error': 'Could not find nutrition data'
            })
    
    # Round totals
    for key in totals:
        totals[key] = round(totals[key], 1)
    
    return jsonify({
        'name': query.title(),
        'ingredients': ingredients_data,
        'totals': totals
    })

@app.route('/api/history', methods=['GET', 'POST'])
@login_required
def api_history():
    if request.method == 'POST':
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        history_type = data.get('type')
        payload = data.get('payload')
        
        if history_type not in ['search', 'calculator']:
            return jsonify({'error': 'Invalid history type'}), 400
        
        if not payload:
            return jsonify({'error': 'No payload provided'}), 400
        
        record = HistoryRecord(
            user_id=current_user.id,
            type=history_type,
            payload=json.dumps(payload)
        )
        db.session.add(record)
        db.session.commit()
        
        return jsonify({'success': True, 'id': record.id})
    
    else:
        search_history = HistoryRecord.query.filter_by(
            user_id=current_user.id,
            type='search'
        ).order_by(HistoryRecord.created_at.desc()).limit(50).all()
        
        calculator_history = HistoryRecord.query.filter_by(
            user_id=current_user.id,
            type='calculator'
        ).order_by(HistoryRecord.created_at.desc()).limit(50).all()
        
        return jsonify({
            'search': [{
                'id': r.id,
                'payload': json.loads(r.payload),
                'created_at': r.created_at.isoformat()
            } for r in search_history],
            'calculator': [{
                'id': r.id,
                'payload': json.loads(r.payload),
                'created_at': r.created_at.isoformat()
            } for r in calculator_history]
        })

@app.route('/api/history/<record_id>', methods=['DELETE'])
@login_required
def api_history_delete(record_id):
    record = HistoryRecord.query.filter_by(id=record_id, user_id=current_user.id).first()
    if not record:
        return jsonify({'error': 'Record not found'}), 404
    
    db.session.delete(record)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/history/clear', methods=['POST'])
@login_required
def api_history_clear():
    data = request.get_json() or {}
    history_type = data.get('type')
    
    if history_type:
        HistoryRecord.query.filter_by(user_id=current_user.id, type=history_type).delete()
    else:
        HistoryRecord.query.filter_by(user_id=current_user.id).delete()
    
    db.session.commit()
    return jsonify({'success': True})

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
