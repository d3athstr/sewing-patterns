"""
Validation schemas for the Sewing Patterns application.
Provides input validation for all API endpoints.
"""
from marshmallow import Schema, fields, validate, ValidationError

class PatternSchema(Schema):
    """Schema for validating pattern data."""
    brand = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    pattern_number = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    difficulty = fields.Str(allow_none=True, validate=validate.Length(max=50))
    size = fields.Str(allow_none=True, validate=validate.Length(max=50))
    sex = fields.Str(allow_none=True, validate=validate.Length(max=50))
    item_type = fields.Str(allow_none=True, validate=validate.Length(max=100))
    format = fields.Str(allow_none=True, validate=validate.Length(max=50))
    inventory_qty = fields.Int(allow_none=True)
    cut_status = fields.Str(allow_none=True, validate=validate.Length(max=50))
    cut_size = fields.Str(allow_none=True, validate=validate.Length(max=50))
    cosplay_hackable = fields.Bool(allow_none=True)
    cosplay_notes = fields.Str(allow_none=True)
    material_recommendations = fields.Str(allow_none=True)
    yardage = fields.Str(allow_none=True)
    notions = fields.Str(allow_none=True)
    notes = fields.Str(allow_none=True)

class PatternPDFSchema(Schema):
    """Schema for validating pattern PDF data."""
    pattern_id = fields.Int(required=True)
    category = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    file_order = fields.Int(allow_none=True)
    pdf_url = fields.Str(allow_none=True, validate=validate.Length(max=500))

class PatternQuerySchema(Schema):
    """Schema for validating pattern query parameters."""
    brand = fields.Str(allow_none=True)
    pattern_number = fields.Str(allow_none=True)
    title = fields.Str(allow_none=True)
    difficulty = fields.Str(allow_none=True)
    item_type = fields.Str(allow_none=True)
    cosplay_hackable = fields.Bool(allow_none=True)
    
class ScrapeQuerySchema(Schema):
    """Schema for validating pattern scraping query parameters."""
    brand = fields.Str(required=True)
    pattern_number = fields.Str(required=True)
