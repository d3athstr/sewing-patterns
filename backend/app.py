from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, create_refresh_token, get_jwt_identity
import os
import io
import logging
from models import db, User, Pattern, PatternPDF
from config import Config

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
jwt = JWTManager(app)
db.init_app(app)

with app.app_context():
    db.create_all()

# Authentication routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login route"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if not user or not user.check_password(password):
            return jsonify({"error": "Invalid username or password"}), 401
        
        access_token = create_access_token(identity=str(user.id))  # Convert user.id to string
        refresh_token = create_refresh_token(identity=str(user.id))  # Convert user.id to string
        
        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user.to_dict()
        }), 200
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Login failed"}), 500

@app.route('/api/auth/check', methods=['GET'])
@jwt_required()
def check_auth():
    """Check if user is authenticated"""
    try:
        user_id = get_jwt_identity()
        # Ensure user_id is treated as string or int as needed
        if isinstance(user_id, str) and user_id.isdigit():
            user_id = int(user_id)
            
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify(user.to_dict()), 200
    except Exception as e:
        logger.error(f"Auth check error: {str(e)}")
        return jsonify({"error": "Authentication check failed"}), 500

# Add the missing /api/auth/me endpoint
@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    try:
        user_id = get_jwt_identity()
        # Ensure user_id is treated as string or int as needed
        if isinstance(user_id, str) and user_id.isdigit():
            user_id = int(user_id)
            
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify(user.to_dict()), 200
    except Exception as e:
        logger.error(f"Get current user error: {str(e)}")
        return jsonify({"error": "Failed to get current user"}), 500

# Pattern routes with pagination
@app.route('/api/patterns', methods=['GET'])
@jwt_required()
def get_patterns():
    """Get all patterns with pagination"""
    try:
        # Get pagination parameters from request
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Get total count first (lightweight query)
        total_count = Pattern.query.count()
        
        # Then get just the patterns for this page
        patterns = Pattern.query.limit(per_page).offset((page-1)*per_page).all()
        
        logger.info(f"Fetched page {page} of patterns ({len(patterns)} items)")
        
        return jsonify({
            'items': [pattern.to_dict() for pattern in patterns],
            'total': total_count,
            'page': page,
            'per_page': per_page
        })
    except Exception as e:
        logger.error(f"Error fetching patterns: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/patterns/<int:pattern_id>', methods=['GET'])
@jwt_required()
def get_pattern(pattern_id):
    """Get a specific pattern"""
    try:
        pattern = Pattern.query.get(pattern_id)
        
        if not pattern:
            return jsonify({"error": "Pattern not found"}), 404
        
        return jsonify(pattern.to_dict()), 200
    except Exception as e:
        logger.error(f"Error fetching pattern {pattern_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/patterns/<int:pattern_id>/image', methods=['GET'])
def get_pattern_image(pattern_id):
    """Get a pattern's image"""
    try:
        pattern = Pattern.query.get(pattern_id)
        
        if not pattern or not pattern.image_data:
            return jsonify({"error": "Image not found"}), 404
        
        return send_file(
            io.BytesIO(pattern.image_data),
            mimetype='image/jpeg'
        )
    except Exception as e:
        logger.error(f"Error fetching image for pattern {pattern_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/patterns', methods=['POST'])
@jwt_required()
def create_pattern():
    """Create a new pattern"""
    try:
        # Handle form data
        data = request.form.to_dict()
        image_file = request.files.get('image')
        
        # Create pattern
        pattern = Pattern(**data)
        
        # Handle image if provided
        if image_file:
            pattern.image = image_file.read()
        
        db.session.add(pattern)
        db.session.commit()
        
        return jsonify(pattern.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating pattern: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/patterns/<int:pattern_id>', methods=['PUT'])
@jwt_required()
def update_pattern(pattern_id):
    """Update a pattern"""
    try:
        pattern = Pattern.query.get(pattern_id)
        
        if not pattern:
            return jsonify({"error": "Pattern not found"}), 404
        
        data = request.get_json()
        
        for key, value in data.items():
            if hasattr(pattern, key):
                setattr(pattern, key, value)
        
        db.session.commit()
        
        return jsonify(pattern.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating pattern {pattern_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/patterns/<int:pattern_id>', methods=['DELETE'])
@jwt_required()
def delete_pattern(pattern_id):
    """Delete a pattern"""
    try:
        pattern = Pattern.query.get(pattern_id)
        
        if not pattern:
            return jsonify({"error": "Pattern not found"}), 404
        
        db.session.delete(pattern)
        db.session.commit()
        
        return jsonify({"message": "Pattern deleted"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting pattern {pattern_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

# PDF routes
@app.route('/api/pdfs/<int:pdf_id>', methods=['GET'])
def get_pdf(pdf_id):
    """Get a PDF file"""
    try:
        pdf = PatternPDF.query.get(pdf_id)
        
        if not pdf or not pdf.pdf_data:
            return jsonify({"error": "PDF not found"}), 404
        
        return send_file(
            io.BytesIO(pdf.pdf_data),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"{pdf.pattern_id}_{pdf.category}.pdf"
        )
    except Exception as e:
        logger.error(f"Error fetching PDF {pdf_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/patterns/<int:pattern_id>/pdfs', methods=['POST'])
@jwt_required()
def upload_pdf(pattern_id):
    """Upload a PDF for a pattern"""
    try:
        pattern = Pattern.query.get(pattern_id)
        
        if not pattern:
            return jsonify({"error": "Pattern not found"}), 404
        
        category = request.form.get('category', 'Instructions')
        pdf_file = request.files.get('pdf')
        
        if not pdf_file:
            return jsonify({"error": "PDF file is required"}), 400
        
        # Create PDF record
        pdf = PatternPDF(
            pattern_id=pattern_id,
            category=category,
            pdf_data=pdf_file.read()
        )
        
        db.session.add(pdf)
        db.session.commit()
        
        return jsonify(pdf.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error uploading PDF for pattern {pattern_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

# New route to get all PDFs with pagination
@app.route('/api/pattern_pdfs', methods=['GET'])
def get_all_pdfs():
    """Get all pattern PDFs with pagination"""
    try:
        # Get pagination parameters from request
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Get total count
        total_count = PatternPDF.query.count()
        
        # Get PDFs for this page
        pdfs = PatternPDF.query.limit(per_page).offset((page-1)*per_page).all()
        
        # Get pattern information for each PDF
        pdf_list = []
        for pdf in pdfs:
            pdf_dict = pdf.to_dict()
            
            # Get pattern information if available
            if pdf.pattern:
                pdf_dict['pattern_brand'] = pdf.pattern.brand
                pdf_dict['pattern_number'] = pdf.pattern.pattern_number
            
            pdf_list.append(pdf_dict)
        
        return jsonify({
            'items': pdf_list,
            'total': total_count,
            'page': page,
            'per_page': per_page
        })
    except Exception as e:
        logger.error(f"Error getting all PDFs: {str(e)}")
        return jsonify({"error": "Failed to retrieve PDFs"}), 500

# Test endpoint
@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Simple test endpoint that doesn't require authentication"""
    return jsonify({"status": "ok", "message": "API is working"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
