from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token,
    jwt_required, 
    get_jwt_identity,
    current_user
)
from werkzeug.security import generate_password_hash, check_password_hash
from marshmallow import Schema, fields, validate, ValidationError
from datetime import datetime, timedelta
import logging

from models import db, User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create a Blueprint for authentication routes
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Validation schema for login
class LoginSchema(Schema):
    username = fields.String(required=True)
    password = fields.String(required=True)

# Initialize schema
login_schema = LoginSchema()

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login a user"""
    try:
        # Get request data
        data = request.get_json()
        logger.info(f"Login attempt for user: {data.get('username')}")
        
        # Validate input data
        errors = login_schema.validate(data)
        if errors:
            logger.warning(f"Login validation failed: {errors}")
            return jsonify({"error": errors}), 400
        
        # Find user
        user = User.query.filter_by(username=data['username']).first()
        
        # Check if user exists and password is correct
        if not user or not user.check_password(data['password']):
            logger.warning(f"Invalid username or password for: {data.get('username')}")
            return jsonify({"error": "Invalid username or password"}), 401
        
        # Create tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        logger.info(f"User logged in successfully: {user.username}")
        
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_admin": user.is_admin
            },
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Login failed. Please try again."}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user_id = get_jwt_identity()
        new_access_token = create_access_token(identity=current_user_id)
        
        logger.info(f"Token refreshed for user ID: {current_user_id}")
        
        return jsonify({
            "access_token": new_access_token
        }), 200
        
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return jsonify({"error": "Token refresh failed"}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_user_info():
    """Get current user info"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            logger.warning(f"User not found for ID: {user_id}")
            return jsonify({"error": "User not found"}), 404
        
        logger.info(f"User info retrieved for: {user.username}")
        
        return jsonify({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin
        }), 200
        
    except Exception as e:
        logger.error(f"Get user info error: {str(e)}")
        return jsonify({"error": "Failed to retrieve user information"}), 500

# Admin-only route to create new users
@auth_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    """Create a new user (admin only)"""
    try:
        # Check if current user is admin
        current_user_id = get_jwt_identity()
        admin_user = User.query.get(current_user_id)
        
        if not admin_user or not admin_user.is_admin:
            logger.warning(f"Non-admin user attempted to create user: {current_user_id}")
            return jsonify({"error": "Admin privileges required"}), 403
        
        # Get request data
        data = request.get_json()
        logger.info(f"Admin creating new user: {data.get('username')}")
        
        # Validate required fields
        if not data.get('username') or not data.get('password') or not data.get('email'):
            return jsonify({"error": "Username, password, and email are required"}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            logger.warning(f"Username already exists: {data['username']}")
            return jsonify({"error": "Username already exists"}), 409
        
        if User.query.filter_by(email=data['email']).first():
            logger.warning(f"Email already exists: {data['email']}")
            return jsonify({"error": "Email already exists"}), 409
        
        # Create new user
        new_user = User(
            username=data['username'],
            email=data['email'],
            is_admin=data.get('is_admin', False)
        )
        new_user.set_password(data['password'])
        
        # Save to database
        db.session.add(new_user)
        db.session.commit()
        
        logger.info(f"User created successfully by admin: {new_user.username}")
        
        return jsonify({
            "message": "User created successfully",
            "user": {
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email,
                "is_admin": new_user.is_admin
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Create user error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to create user. Please try again."}), 500

# Admin-only route to list all users
@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    """List all users (admin only)"""
    try:
        # Check if current user is admin
        current_user_id = get_jwt_identity()
        admin_user = User.query.get(current_user_id)
        
        if not admin_user or not admin_user.is_admin:
            logger.warning(f"Non-admin user attempted to list users: {current_user_id}")
            return jsonify({"error": "Admin privileges required"}), 403
        
        # Get all users
        users = User.query.all()
        
        logger.info(f"Admin listed all users: {admin_user.username}")
        
        return jsonify([{
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin,
            "created_at": user.created_at.isoformat() if user.created_at else None
        } for user in users]), 200
        
    except Exception as e:
        logger.error(f"List users error: {str(e)}")
        return jsonify({"error": "Failed to list users"}), 500

# Function to create admin user if it doesn't exist
def create_admin_user(username, password, email):
    """Create admin user if it doesn't exist"""
    try:
        # Check if admin user already exists
        admin = User.query.filter_by(username=username).first()
        if admin:
            logger.info(f"Admin user already exists: {username}")
            return
        
        # Create admin user
        admin = User(
            username=username,
            email=email,
            is_admin=True
        )
        admin.set_password(password)
        
        # Save to database
        db.session.add(admin)
        db.session.commit()
        
        logger.info(f"Admin user created: {username}")
        
    except Exception as e:
        logger.error(f"Create admin user error: {str(e)}")
        db.session.rollback()
