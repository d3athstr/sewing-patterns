"""
Main application file for the Sewing Patterns API.
Implements secure API endpoints with authentication and validation.
"""
from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from io import BytesIO
import os

# Import configuration
from config import get_config

# Import models and database
from models import db, Pattern, PatternPDF

# Import authentication
from auth import auth_bp, init_jwt, User

# Import validation schemas
from validation import (
    PatternSchema, PatternPDFSchema, PatternQuerySchema, ScrapeQuerySchema
)

# Import scraper functionality
from scraper import scrape_pattern

def create_app(config_name=None):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Load configuration
    config = get_config()
    app.config.from_object(config)
    
    # Initialize extensions
    CORS(app)
    db.init_app(app)
    jwt = init_jwt(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # Global error handler
    @app.errorhandler(Exception)
    def handle_exception(e):
        """Global exception handler."""
        app.logger.error(f"Unhandled exception: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e) if app.debug else "An unexpected error occurred"
        }), 500
    
    @app.errorhandler(404)
    def not_found(e):
        """Handle 404 errors."""
        return jsonify({"error": "Resource not found"}), 404
    
    @app.errorhandler(ValidationError)
    def validation_error(e):
        """Handle validation errors."""
        return jsonify({"error": "Validation error", "details": e.messages}), 400
    
    # Initialize schemas
    pattern_schema = PatternSchema()
    pattern_pdf_schema = PatternPDFSchema()
    pattern_query_schema = PatternQuerySchema()
    scrape_query_schema = ScrapeQuerySchema()
    
    # Pattern routes
    @app.route('/api/patterns', methods=['GET'])
    def get_patterns():
        """Get all patterns with optional filtering."""
        try:
            # Validate query parameters
            query_data = pattern_query_schema.load(request.args)
            
            # Build query
            query = Pattern.query
            
            # Apply filters if provided
            for key, value in query_data.items():
                if value is not None:
                    if key == 'cosplay_hackable':
                        query = query.filter(Pattern.cosplay_hackable == value)
                    else:
                        query = query.filter(getattr(Pattern, key).ilike(f'%{value}%'))
            
            # Execute query
            patterns = query.all()
            
            return jsonify([p.to_dict() for p in patterns])
        except ValidationError as e:
            return jsonify({"error": "Invalid query parameters", "details": e.messages}), 400
        except Exception as e:
            app.logger.error(f"Error in get_patterns: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    @app.route('/api/patterns', methods=['POST'])
    @jwt_required()
    def add_pattern():
        """Add a new pattern."""
        try:
            current_user_id = get_jwt_identity()
            
            # Handle multipart/form-data (with image upload)
            if request.content_type.startswith('multipart/form-data'):
                # Validate form data
                data = {key: request.form.get(key) for key in request.form}
                validated_data = pattern_schema.load(data)
                
                # Handle image file
                image_file = request.files.get('image')
                if image_file:
                    validated_data["image_data"] = image_file.read()
            else:
                # Validate JSON data
                validated_data = pattern_schema.load(request.json)
            
            # Create new pattern
            new_pattern = Pattern(**validated_data)
            new_pattern.user_id = current_user_id
            
            # Save to database
            db.session.add(new_pattern)
            db.session.commit()
            
            return jsonify(new_pattern.to_dict()), 201
        except ValidationError as e:
            return jsonify({"error": "Validation error", "details": e.messages}), 400
        except Exception as e:
            app.logger.error(f"Error in add_pattern: {str(e)}")
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
    
    @app.route('/api/patterns/<int:pattern_id>', methods=['GET'])
    def get_pattern(pattern_id):
        """Get a specific pattern by ID."""
        pattern = Pattern.query.get(pattern_id)
        if not pattern:
            return jsonify({"error": "Pattern not found"}), 404
        
        return jsonify(pattern.to_dict())
    
    @app.route('/api/patterns/<int:pattern_id>', methods=['PUT'])
    @jwt_required()
    def update_pattern(pattern_id):
        """Update an existing pattern."""
        try:
            current_user_id = get_jwt_identity()
            
            # Find pattern
            pattern = Pattern.query.get(pattern_id)
            if not pattern:
                return jsonify({"error": "Pattern not found"}), 404
            
            # Check ownership
            if pattern.user_id and pattern.user_id != current_user_id:
                # Check if user is admin
                user = User.query.get(current_user_id)
                if not user or not user.is_admin:
                    return jsonify({"error": "You don't have permission to update this pattern"}), 403
            
            # Handle multipart/form-data (with image upload)
            if request.content_type and request.content_type.startswith('multipart/form-data'):
                # Validate form data
                data = {key: request.form.get(key) for key in request.form}
                validated_data = pattern_schema.load(data, partial=True)
                
                # Handle image file
                image_file = request.files.get('image')
                if image_file:
                    validated_data["image_data"] = image_file.read()
            else:
                # Validate JSON data
                validated_data = pattern_schema.load(request.json, partial=True)
            
            # Update pattern attributes
            for key, value in validated_data.items():
                setattr(pattern, key, value)
            
            # Save to database
            db.session.commit()
            
            return jsonify(pattern.to_dict())
        except ValidationError as e:
            return jsonify({"error": "Validation error", "details": e.messages}), 400
        except Exception as e:
            app.logger.error(f"Error in update_pattern: {str(e)}")
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
    
    @app.route('/api/patterns/<int:pattern_id>', methods=['DELETE'])
    @jwt_required()
    def delete_pattern(pattern_id):
        """Delete a pattern."""
        try:
            current_user_id = get_jwt_identity()
            
            # Find pattern
            pattern = Pattern.query.get(pattern_id)
            if not pattern:
                return jsonify({"error": "Pattern not found"}), 404
            
            # Check ownership
            if pattern.user_id and pattern.user_id != current_user_id:
                # Check if user is admin
                user = User.query.get(current_user_id)
                if not user or not user.is_admin:
                    return jsonify({"error": "You don't have permission to delete this pattern"}), 403
            
            # Delete pattern (cascade will delete associated PDFs)
            db.session.delete(pattern)
            db.session.commit()
            
            return jsonify({"message": "Pattern deleted"})
        except Exception as e:
            app.logger.error(f"Error in delete_pattern: {str(e)}")
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
    
    @app.route('/api/patterns/<int:pattern_id>/image', methods=['GET'])
    def get_pattern_image(pattern_id):
        """Serve binary image data for a pattern."""
        pattern = Pattern.query.get(pattern_id)
        if not pattern or not pattern.image_data:
            return jsonify({"error": "Image not found"}), 404
        
        return Response(pattern.image_data, mimetype="image/jpeg")
    
    # PDF routes
    @app.route('/api/pdfs', methods=['GET'])
    def get_pdfs():
        """Get all PDF files."""
        pdfs = PatternPDF.query.all()
        return jsonify([pdf.to_dict() for pdf in pdfs])
    
    @app.route('/api/pdfs/<int:pdf_id>', methods=['GET'])
    def get_pdf(pdf_id):
        """Serve binary PDF data."""
        pdf = PatternPDF.query.get(pdf_id)
        if not pdf or not pdf.pdf_data:
            return jsonify({"error": "PDF not found"}), 404
        
        return Response(pdf.pdf_data, mimetype="application/pdf")
    
    @app.route('/api/patterns/<int:pattern_id>/pdfs', methods=['POST'])
    @jwt_required()
    def add_pdf_to_pattern(pattern_id):
        """Add a PDF to a pattern."""
        try:
            current_user_id = get_jwt_identity()
            
            # Find pattern
            pattern = Pattern.query.get(pattern_id)
            if not pattern:
                return jsonify({"error": "Pattern not found"}), 404
            
            # Check ownership
            if pattern.user_id and pattern.user_id != current_user_id:
                # Check if user is admin
                user = User.query.get(current_user_id)
                if not user or not user.is_admin:
                    return jsonify({"error": "You don't have permission to add PDFs to this pattern"}), 403
            
            # Handle file upload
            if 'pdf' in request.files:
                pdf_file = request.files['pdf']
                
                # Validate form data
                data = {
                    'pattern_id': pattern_id,
                    'category': request.form.get('category', 'Instructions'),
                    'file_order': request.form.get('file_order', type=int)
                }
                validated_data = pattern_pdf_schema.load(data)
                
                # Create new PDF
                new_pdf = PatternPDF(**validated_data)
                new_pdf.pdf_data = pdf_file.read()
            else:
                # Validate JSON data
                data = request.json
                data['pattern_id'] = pattern_id
                validated_data = pattern_pdf_schema.load(data)
                
                # Create new PDF
                new_pdf = PatternPDF(**validated_data)
            
            # Save to database
            db.session.add(new_pdf)
            db.session.commit()
            
            return jsonify(new_pdf.to_dict()), 201
        except ValidationError as e:
            return jsonify({"error": "Validation error", "details": e.messages}), 400
        except Exception as e:
            app.logger.error(f"Error in add_pdf_to_pattern: {str(e)}")
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
    
    @app.route('/api/pdfs/<int:pdf_id>', methods=['DELETE'])
    @jwt_required()
    def delete_pdf(pdf_id):
        """Delete a PDF file."""
        try:
            current_user_id = get_jwt_identity()
            
            # Find PDF
            pdf = PatternPDF.query.get(pdf_id)
            if not pdf:
                return jsonify({"error": "PDF not found"}), 404
            
            # Find associated pattern
            pattern = Pattern.query.get(pdf.pattern_id)
            
            # Check ownership
            if pattern and pattern.user_id and pattern.user_id != current_user_id:
                # Check if user is admin
                user = User.query.get(current_user_id)
                if not user or not user.is_admin:
                    return jsonify({"error": "You don't have permission to delete this PDF"}), 403
            
            # Delete PDF
            db.session.delete(pdf)
            db.session.commit()
            
            return jsonify({"message": "PDF deleted"}), 200
        except Exception as e:
            app.logger.error(f"Error in delete_pdf: {str(e)}")
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
    
    # Scraper route
    @app.route('/api/scrape', methods=['GET'])
    @jwt_required()
    def scrape():
        """Scrape and add pattern."""
        try:
            # Validate query parameters
            query_data = scrape_query_schema.load(request.args)
            
            brand = query_data['brand']
            pattern_number = query_data['pattern_number']
            
            # Scrape pattern data
            scraped_data = scrape_pattern(brand, pattern_number)
            
            if not isinstance(scraped_data, dict) or "brand" not in scraped_data or "pattern_number" not in scraped_data:
                return jsonify({"error": "Failed to scrape valid pattern data"}), 500
            
            # Check if pattern already exists
            existing_pattern = Pattern.query.filter_by(
                brand=brand, 
                pattern_number=pattern_number
            ).first()
            
            current_user_id = get_jwt_identity()
            
            if existing_pattern:
                # Update existing pattern
                for key, value in scraped_data.items():
                    setattr(existing_pattern, key, value)
                
                # Increment inventory quantity
                existing_pattern.inventory_qty = (existing_pattern.inventory_qty or 0) + 1
                
                # Save changes
                db.session.commit()
                
                return jsonify({
                    "message": "Pattern updated", 
                    "pattern": existing_pattern.to_dict()
                })
            
            # Create new pattern
            new_pattern = Pattern(**scraped_data)
            new_pattern.user_id = current_user_id
            
            # Save to database
            db.session.add(new_pattern)
            db.session.commit()
            
            return jsonify({
                "message": "Pattern added", 
                "pattern": new_pattern.to_dict()
            })
        except ValidationError as e:
            return jsonify({"error": "Validation error", "details": e.messages}), 400
        except Exception as e:
            app.logger.error(f"Error in scrape: {str(e)}")
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
    
    # Create database tables
    with app.app_context():
        db.create_all()
        
        # Create admin user if it doesn't exist
        admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
        admin_password = os.environ.get('ADMIN_PASSWORD', 'admin_password')
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
        
        if not User.query.filter_by(username=admin_username).first():
            admin = User(
                username=admin_username,
                email=admin_email,
                is_admin=True
            )
            admin.set_password(admin_password)
            db.session.add(admin)
            db.session.commit()
            app.logger.info(f"Created admin user: {admin_username}")
    
    return app

# Run the application
if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host="0.0.0.0")
