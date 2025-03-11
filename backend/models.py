from flask import Flask, request, jsonify, Response, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
from scraper import scrape_pattern  # Ensure the scraper function is properly imported

app = Flask(__name__)
CORS(app)

# Database Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://user:password@sewing_patterns_db/sewing_patterns"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Updated Pattern model:
class Pattern(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    brand = db.Column(db.String(50), nullable=False)
    pattern_number = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    image = db.Column(db.String(500))  # Fallback URL for the image
    image_data = db.Column(db.LargeBinary, nullable=True)  # Binary image data
    difficulty = db.Column(db.String(50))
    size = db.Column(db.String(50))
    sex = db.Column(db.String(50))
    item_type = db.Column(db.String(100))
    format = db.Column(db.String(50))
    inventory_qty = db.Column(db.Integer)
    cut_status = db.Column(db.String(50))
    cut_size = db.Column(db.String(50))
    cosplay_hackable = db.Column(db.Boolean)
    cosplay_notes = db.Column(db.Text)
    material_recommendations = db.Column(db.Text)
    yardage = db.Column(db.Text)
    notions = db.Column(db.Text)
    notes = db.Column(db.Text)
    
    # Relationship to PDFs
    pdf_files = db.relationship('PatternPDF', backref='pattern', lazy=True)
    
    def to_dict(self):
        d = {col.name: getattr(self, col.name)
             for col in self.__table__.columns if col.name != "image_data"}
        if self.image_data:
            d["image_url"] = url_for("get_pattern_image", pattern_id=self.id, _external=True)
            d["downloaded"] = True
        else:
            d["image_url"] = self.image
            d["downloaded"] = False
        d["pdf_files"] = [pdf.to_dict() for pdf in self.pdf_files]
        return d

class PatternPDF(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pattern_id = db.Column(db.Integer, db.ForeignKey('pattern.id'), nullable=False)
    category = db.Column(db.String(20), nullable=False)
    file_order = db.Column(db.Integer, nullable=True)
    pdf_url = db.Column(db.String(500))  # Fallback URL for the PDF
    pdf_data = db.Column(db.LargeBinary, nullable=True)  # Binary PDF file data

    def to_dict(self):
        d = {
            "id": self.id,
            "category": self.category,
            "file_order": self.file_order,
        }
        if self.pdf_data:
            # New: Use get_pattern_pdf endpoint to serve PDF blob data.
            d["pdf_url"] = url_for("get_pattern_pdf", pdf_id=self.id, _external=True)
            d["downloaded"] = True
        else:
            d["pdf_url"] = self.pdf_url
            d["downloaded"] = False
        return d

# Endpoint to serve the blob image data
@app.route("/pattern_image/<int:pattern_id>")
def get_pattern_image(pattern_id):
    pattern = Pattern.query.get(pattern_id)
    if pattern and pattern.image_data:
        # Adjust the mimetype if your images are not JPEG.
        return Response(pattern.image_data, mimetype="image/jpeg")
    return jsonify({"error": "Image not found"}), 404

# New Endpoint: Serve the binary PDF data
@app.route("/pattern_pdf/<int:pdf_id>")
def get_pattern_pdf(pdf_id):
    pdf = PatternPDF.query.get(pdf_id)
    if pdf and pdf.pdf_data:
        return Response(pdf.pdf_data, mimetype="application/pdf")
    return jsonify({"error": "PDF not found"}), 404

# Optional New Endpoint: Fetch all PDF records
@app.route('/pattern_pdfs', methods=['GET'])
def get_pattern_pdfs():
    pdfs = PatternPDF.query.all()
    return jsonify([pdf.to_dict() for pdf in pdfs])

# Fetch all patterns
@app.route('/patterns', methods=['GET'])
def get_patterns():
    patterns = Pattern.query.all()
    return jsonify([p.to_dict() for p in patterns])

# Add a new pattern
@app.route('/patterns', methods=['POST'])
def add_pattern():
    data = request.json
    valid_keys = {"brand", "pattern_number", "title", "description", "image", "difficulty",
                  "size", "sex", "item_type", "format", "inventory_qty", "cut_status",
                  "cut_size", "cosplay_hackable", "cosplay_notes", "material_recommendations",
                  "yardage", "notions", "notes", "image_data"}
    filtered_data = {key: data[key] for key in valid_keys if key in data}

    if not filtered_data.get("brand") or not filtered_data.get("pattern_number"):
        return jsonify({"error": "Brand and Pattern Number are required"}), 400

    new_pattern = Pattern(**filtered_data)
    db.session.add(new_pattern)
    db.session.commit()
    return jsonify(new_pattern.to_dict())

# Update a pattern
@app.route('/patterns/<int:id>', methods=['PUT'])
def update_pattern(id):
    pattern = Pattern.query.get_or_404(id)
    data = request.json
    if "cosplay_hackable" in data:
        if isinstance(data["cosplay_hackable"], str):
            data["cosplay_hackable"] = data["cosplay_hackable"].strip().lower() in ["yes", "true", "1"]

    for key, value in data.items():
        setattr(pattern, key, value)
    db.session.commit()
    return jsonify(pattern.to_dict())

# Delete a pattern
@app.route('/patterns/<int:id>', methods=['DELETE'])
def delete_pattern(id):
    pattern = Pattern.query.get(id)
    if not pattern:
        return jsonify({"error": "Pattern not found"}), 404
    db.session.delete(pattern)
    db.session.commit()
    return jsonify({"message": "Pattern deleted"})

# Scrape and add pattern
@app.route("/scrape", methods=["GET"])
def scrape():
    brand = request.args.get("brand")
    pattern_number = request.args.get("pattern_number")
    if not brand or not pattern_number:
        return jsonify({"error": "Brand and Pattern Number are required"}), 400

    scraped_data = scrape_pattern(brand, pattern_number)
    if not isinstance(scraped_data, dict) or "brand" not in scraped_data or "pattern_number" not in scraped_data:
        return jsonify({"error": "Failed to scrape valid pattern data"}), 500

    existing_pattern = Pattern.query.filter_by(brand=brand, pattern_number=pattern_number).first()
    if existing_pattern:
        for key, value in scraped_data.items():
            setattr(existing_pattern, key, value)
        existing_pattern.inventory_qty = (existing_pattern.inventory_qty or 0) + 1
        db.session.commit()
        return jsonify({"message": "Pattern updated", "pattern": existing_pattern.to_dict()})

    new_pattern = Pattern(**scraped_data)
    db.session.add(new_pattern)
    db.session.commit()
    return jsonify({"message": "Pattern added", "pattern": new_pattern.to_dict()})

if __name__ == '__main__':
    app.run(debug=False, host="0.0.0.0")
