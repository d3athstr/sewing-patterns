"""
Database models for the Sewing Patterns application.
Defines all database tables and relationships.
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Initialize SQLAlchemy instance
db = SQLAlchemy()

class Pattern(db.Model):
    """Pattern model representing sewing patterns."""
    id = db.Column(db.Integer, primary_key=True)
    brand = db.Column(db.String(50), nullable=False)
    pattern_number = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # Image handling
    image = db.Column(db.String(500))  # Fallback URL for the image
    image_data = db.Column(db.LargeBinary, nullable=True)  # Binary image data
    
    # Pattern details
    difficulty = db.Column(db.String(50))
    size = db.Column(db.String(50))
    sex = db.Column(db.String(50))
    item_type = db.Column(db.String(100))
    format = db.Column(db.String(50))
    
    # Inventory information
    inventory_qty = db.Column(db.Integer)
    cut_status = db.Column(db.String(50))
    cut_size = db.Column(db.String(50))
    
    # Additional metadata
    cosplay_hackable = db.Column(db.Boolean)
    cosplay_notes = db.Column(db.Text)
    material_recommendations = db.Column(db.Text)
    yardage = db.Column(db.Text)
    notions = db.Column(db.Text)
    notes = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    pdf_files = db.relationship('PatternPDF', backref='pattern', lazy=True, cascade="all, delete-orphan")
    
    # Add user relationship for ownership
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    def to_dict(self, include_image_data=False):
        """Convert pattern object to dictionary."""
        result = {
            'id': self.id,
            'brand': self.brand,
            'pattern_number': self.pattern_number,
            'title': self.title,
            'description': self.description,
            'difficulty': self.difficulty,
            'size': self.size,
            'sex': self.sex,
            'item_type': self.item_type,
            'format': self.format,
            'inventory_qty': self.inventory_qty,
            'cut_status': self.cut_status,
            'cut_size': self.cut_size,
            'cosplay_hackable': self.cosplay_hackable,
            'cosplay_notes': self.cosplay_notes,
            'material_recommendations': self.material_recommendations,
            'yardage': self.yardage,
            'notions': self.notions,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'pdf_files': [pdf.to_dict() for pdf in self.pdf_files],
            'user_id': self.user_id
        }
        
        # Handle image data
        if self.image_data and not include_image_data:
            result['has_image'] = True
            result['image_url'] = f"/api/patterns/{self.id}/image"
        else:
            result['has_image'] = False
            result['image_url'] = self.image
            
        return result

class PatternPDF(db.Model):
    """PDF files associated with patterns."""
    id = db.Column(db.Integer, primary_key=True)
    pattern_id = db.Column(db.Integer, db.ForeignKey('pattern.id'), nullable=False)
    category = db.Column(db.String(20), nullable=False)
    file_order = db.Column(db.Integer, nullable=True)
    pdf_url = db.Column(db.String(500))  # Fallback URL for the PDF
    pdf_data = db.Column(db.LargeBinary, nullable=True)  # Binary PDF file data
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert PDF object to dictionary."""
        result = {
            'id': self.id,
            'pattern_id': self.pattern_id,
            'category': self.category,
            'file_order': self.file_order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        # Handle PDF data
        if self.pdf_data:
            result['has_pdf'] = True
            result['pdf_url'] = f"/api/pdfs/{self.id}"
        else:
            result['has_pdf'] = False
            result['pdf_url'] = self.pdf_url
            
        return result

# Import User model from auth.py to avoid circular imports
# This is referenced in the Pattern model above
from auth import User
