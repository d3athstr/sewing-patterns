"""
Authentication module for the Sewing Patterns application.
Provides user model, authentication routes, and JWT functionality.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from marshmallow import Schema, fields, validate, ValidationError
from datetime import datetime
from models import db

# User model
class User(db.Model):
    """User model for authentication."""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_admin = db.Column(db.Boolean, default=False)
    
    def set_password(self, password):
        """Hash and set the user password."""
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        """Check if the provided password matches the stored hash."""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user object to dictionary (excluding sensitive data)."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'is_admin': self.is_admin
        }

# Validation schemas
class UserRegistrationSchema(Schema):
    """Schema for validating user registration data."""
    username = fields.Str(required=True, validate=validate.Length(min=3, max=50))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))
    
class UserLoginSchema(Schema):
    """Schema for validating user login data."""
    username = fields.Str(required=True)
    password = fields.Str(required=True)

# Create blueprint
auth_bp = Blueprint('auth', __name__)

# Initialize schemas
registration_schema = UserRegistrationSchema()
login_schema = UserLoginSchema()

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        # Validate input data
        data = registration_schema.load(request.json)
    except ValidationError as err:
        return jsonify({"error": "Validation error", "details": err.messages}), 400
    
    # Check if username or email already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username already exists"}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already exists"}), 409
    
    # Create new user
    user = User(
        username=data['username'],
        email=data['email']
    )
    user.set_password(data['password'])
    
    # Save to database
    db.session.add(user)
    db.session.commit()
    
    # Generate tokens
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        "message": "User registered successfully",
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate a user and return JWT tokens."""
    try:
        # Validate input data
        data = login_schema.load(request.json)
    except ValidationError as err:
        return jsonify({"error": "Validation error", "details": err.messages}), 400
    
    # Find user by username
    user = User.query.filter_by(username=data['username']).first()
    
    # Check if user exists and password is correct
    if not user or not user.check_password(data['password']):
        return jsonify({"error": "Invalid username or password"}), 401
    
    # Generate tokens
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        "message": "Login successful",
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh the access token using a valid refresh token."""
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    
    return jsonify({
        "access_token": new_access_token
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_user_info():
    """Get the current user's information."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify(user.to_dict()), 200

# Function to initialize JWT with the app
def init_jwt(app):
    """Initialize JWT manager with the Flask app."""
    jwt = JWTManager(app)
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "error": "Token has expired",
            "message": "Please log in again"
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            "error": "Invalid token",
            "message": "Signature verification failed"
        }), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            "error": "Authorization required",
            "message": "Request does not contain an access token"
        }), 401
    
    return jwt
