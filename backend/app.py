from flask import Flask, request, jsonify
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

# Define the Pattern model
class Pattern(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    brand = db.Column(db.String(50), nullable=False)
    pattern_number = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    image = db.Column(db.String(500))
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
    yardage = db.Column(db.Text)  # NEW: Added yardage field
    notions = db.Column(db.Text)
    notes = db.Column(db.Text)
    
    def to_dict(self):
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}

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
                  "yardage", "notions", "notes"}

    filtered_data = {key: data[key] for key in valid_keys if key in data}
    
    # Ensure required fields exist
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

    # ✅ Convert boolean fields properly
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
@app.route('/scrape', methods=['GET'])
def scrape():
    brand = request.args.get("brand")
    pattern_number = request.args.get("pattern_number")

    if not brand or not pattern_number:
        return jsonify({"error": "Brand and pattern number are required"}), 400

    scraped_data = scrape_pattern(brand, pattern_number)

    # 🚨 If the scraper fails, return the error instead of inserting
    if "error" in scraped_data:
        return jsonify(scraped_data), 500  

    # ✅ Only insert valid fields into the database
    valid_fields = {col.name for col in Pattern.__table__.columns}
    filtered_data = {key: value for key, value in scraped_data.items() if key in valid_fields}

    # Prevent database errors by ensuring required fields are present
    if "brand" not in filtered_data or "pattern_number" not in filtered_data:
        return jsonify({"error": "Missing essential pattern data"}), 500

    new_pattern = Pattern(**filtered_data)
    db.session.add(new_pattern)
    db.session.commit()

    return jsonify(new_pattern.to_dict()), 201  # Return HTTP 201 Created

# Run Flask App
if __name__ == '__main__':
    app.run(debug=False, host="0.0.0.0")
