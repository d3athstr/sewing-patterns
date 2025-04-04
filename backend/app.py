from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
import os
import logging
from datetime import timedelta
import io


# Import configuration
from config import Config

# Import database and models
from models import db, User

# Import authentication routes
from auth_routes import auth_bp, create_admin_user

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app(config_class=Config):
    """Create and configure the Flask application"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    CORS(app, supports_credentials=True)
    
    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
        
        # Create admin user if specified in environment variables
        admin_username = os.environ.get('ADMIN_USERNAME')
        admin_password = os.environ.get('ADMIN_PASSWORD')
        admin_email = os.environ.get('ADMIN_EMAIL')
        
        if admin_username and admin_password and admin_email:
            logger.info(f"Creating admin user from environment variables: {admin_username}")
            create_admin_user(admin_username, admin_password, admin_email)
            logger.info("Admin user creation attempt completed")
    
    # User loader callback for JWT
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return User.query.get(identity)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found"}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500
    
    # Root route
    @app.route('/')
    def index():
        return jsonify({"message": "Sewing Patterns API"})
    
    # Pattern routes
    @app.route('/api/patterns', methods=['GET'])
    @jwt_required()
    def get_patterns():
        """Get all patterns"""
        try:
            from models import Pattern
            patterns = Pattern.query.all()
            return jsonify([p.to_dict() for p in patterns])
        except Exception as e:
            logger.error(f"Error getting patterns: {str(e)}")
            return jsonify({"error": "Failed to retrieve patterns"}), 500
    
    @app.route('/api/patterns/<int:pattern_id>', methods=['GET'])
    @jwt_required()
    def get_pattern(pattern_id):
        """Get a specific pattern"""
        try:
            from models import Pattern
            pattern = Pattern.query.get(pattern_id)
            if not pattern:
                return jsonify({"error": "Pattern not found"}), 404
            return jsonify(pattern.to_dict())
        except Exception as e:
            logger.error(f"Error getting pattern {pattern_id}: {str(e)}")
            return jsonify({"error": "Failed to retrieve pattern"}), 500
    
    @app.route('/api/patterns', methods=['POST'])
    @jwt_required()
    def create_pattern():
        """Create a new pattern"""
        try:
            from models import Pattern
            
            # Handle form data with image
            if request.content_type and 'multipart/form-data' in request.content_type:
                data = request.form.to_dict()
                image_file = request.files.get('image')
                
                # Create pattern
                pattern = Pattern(**data)
                
                # Handle image if provided
                if image_file:
                    # Save image to database
                    pattern.image_data = image_file.read()
                    db.session.add(pattern)
                    db.session.commit()
                    # Set a fallback URL
                    pattern.image = f"/api/patterns/{pattern.id}/image"
                
                db.session.add(pattern)
                db.session.commit()
                
                return jsonify(pattern.to_dict()), 201
            
            # Handle JSON data
            else:
                data = request.get_json()
                pattern = Pattern(**data)
                db.session.add(pattern)
                db.session.commit()
                
                return jsonify(pattern.to_dict()), 201
                
        except Exception as e:
            logger.error(f"Error creating pattern: {str(e)}")
            db.session.rollback()
            return jsonify({"error": "Failed to create pattern"}), 500
    
    @app.route('/api/patterns/<int:pattern_id>', methods=['PUT'])
    @jwt_required()
    def update_pattern(pattern_id):
        """Update a pattern"""
        try:
            from models import Pattern
            pattern = Pattern.query.get(pattern_id)
            
            if not pattern:
                return jsonify({"error": "Pattern not found"}), 404
            
            data = request.get_json()
            
            # Update pattern attributes
            for key, value in data.items():
                if hasattr(pattern, key):
                    setattr(pattern, key, value)
            
            db.session.commit()
            
            return jsonify(pattern.to_dict())
        except Exception as e:
            logger.error(f"Error updating pattern {pattern_id}: {str(e)}")
            db.session.rollback()
            return jsonify({"error": "Failed to update pattern"}), 500
    
    @app.route('/api/patterns/<int:pattern_id>', methods=['DELETE'])
    @jwt_required()
    def delete_pattern(pattern_id):
        """Delete a pattern"""
        try:
            from models import Pattern
            pattern = Pattern.query.get(pattern_id)
            
            if not pattern:
                return jsonify({"error": "Pattern not found"}), 404
            
            db.session.delete(pattern)
            db.session.commit()
            
            return jsonify({"message": "Pattern deleted successfully"})
        except Exception as e:
            logger.error(f"Error deleting pattern {pattern_id}: {str(e)}")
            db.session.rollback()
            return jsonify({"error": "Failed to delete pattern"}), 500
    
    # PDF routes
    @app.route('/api/patterns/<int:pattern_id>/pdfs', methods=['POST'])
    @jwt_required()
    def upload_pdf(pattern_id):
        """Upload a PDF for a pattern"""
        try:
            from models import Pattern, PatternPDF as PDF
            pattern = Pattern.query.get(pattern_id)
            
            if not pattern:
                return jsonify({"error": "Pattern not found"}), 404
            
            # Get form data
            category = request.form.get('category')
            pdf_file = request.files.get('pdf')
            
            if not pdf_file or not category:
                return jsonify({"error": "PDF file and category are required"}), 400
            
            # Save PDF data to database
            pdf_data = pdf_file.read()
            pdf = PDF(
                pattern_id=pattern_id, 
                category=category, 
                pdf_data=pdf_data,
                pdf_url="placeholder"  # Will be updated after commit
            )
            db.session.add(pdf)
            db.session.commit()
            
            # Update the URL with the correct ID after commit
            pdf.pdf_url = f"/api/pdfs/{pdf.id}"
            db.session.commit()
            
            return jsonify(pdf.to_dict()), 201
        except Exception as e:
            logger.error(f"Error uploading PDF for pattern {pattern_id}: {str(e)}")
            db.session.rollback()
            return jsonify({"error": "Failed to upload PDF"}), 500
    
    # New route to serve pattern images
    @app.route('/api/patterns/<int:pattern_id>/image', methods=['GET'])
    def get_pattern_image(pattern_id):
        """Get a pattern image"""
        try:
            from models import Pattern
            pattern = Pattern.query.get(pattern_id)
            
            if not pattern or not pattern.image_data:
                return jsonify({"error": "Image not found"}), 404
            
            return send_file(
                io.BytesIO(pattern.image_data),
                mimetype='image/jpeg'  # Adjust mimetype as needed
            )
        except Exception as e:
            logger.error(f"Error getting pattern image {pattern_id}: {str(e)}")
            return jsonify({"error": "Failed to retrieve image"}), 500
    
    # New route to serve PDFs
    @app.route('/api/pdfs/<int:pdf_id>', methods=['GET'])
    def get_pdf(pdf_id):
        """Get a PDF file"""
        try:
            from models import PatternPDF
            pdf = PatternPDF.query.get(pdf_id)
            
            if not pdf or not pdf.pdf_data:
                return jsonify({"error": "PDF not found"}), 404
            
            return send_file(
                io.BytesIO(pdf.pdf_data),
                mimetype='application/pdf',
                as_attachment=False,
                download_name=f"{pdf.category}_{pdf.id}.pdf"
            )
        except Exception as e:
            logger.error(f"Error getting PDF {pdf_id}: {str(e)}")
            return jsonify({"error": "Failed to retrieve PDF"}), 500
    
    # Scraper route
    @app.route('/api/scrape', methods=['GET'])
    @jwt_required()
    def scrape_pattern():
        """Scrape pattern data"""
        try:
            brand = request.args.get('brand')
            pattern_number = request.args.get('pattern_number')
            
            if not brand or not pattern_number:
                return jsonify({"error": "Brand and pattern number are required"}), 400
            
            # Import scraper function
            from scraper import scrape_pattern_data
            
            # Scrape pattern data
            pattern_data = scrape_pattern_data(brand, pattern_number)
            
            if not pattern_data:
                return jsonify({"error": "Failed to scrape pattern data"}), 404
            
            return jsonify(pattern_data)
        except Exception as e:
            logger.error(f"Error scraping pattern data: {str(e)}")
            return jsonify({"error": "Failed to scrape pattern data"}), 500
    
    return app

# Create the application instance
app = create_app()

if __name__ == '__main__':
    # Log startup information
    logger.info("Starting Sewing Patterns API")
    logger.info(f"JWT_SECRET_KEY is {'set' if app.config.get('JWT_SECRET_KEY') else 'NOT SET'}")
    logger.info(f"FLASK_SECRET_KEY is {'set' if app.config.get('SECRET_KEY') else 'NOT SET'}")
    logger.info(f"Admin username from env: {os.environ.get('ADMIN_USERNAME')}")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
