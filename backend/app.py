from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from scraper import scrape_pattern  # Ensure scraper.py exists and is correct

app = Flask(__name__)
CORS(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@sewing_patterns_db/sewing_patterns'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Pattern Model
class Pattern(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    brand = db.Column(db.String(50), nullable=False)
    pattern_number = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    image = db.Column(db.String(255), nullable=True)
    difficulty = db.Column(db.String(50), nullable=True)  # New field

    def to_dict(self):
        return {
            "id": self.id,
            "brand": self.brand,
            "pattern_number": self.pattern_number,
            "title": self.title,
            "description": self.description,
            "image": self.image,
            "difficulty": self.difficulty
        }

# Ensure tables exist
with app.app_context():
    db.create_all()

# Route: Get all patterns
@app.route('/patterns', methods=['GET'])
def get_patterns():
    patterns = Pattern.query.all()
    return jsonify([p.to_dict() for p in patterns])

# Route: Scrape and add pattern
@app.route('/scrape', methods=['GET'])
def scrape():
    brand = request.args.get('brand')
    pattern_number = request.args.get('pattern_number')

    if not brand or not pattern_number:
        return jsonify({"error": "Missing brand or pattern_number"}), 400

    result = scrape_pattern(brand, pattern_number)
    
    if "error" in result:
        return jsonify(result), 500  # Return error from scraper if failed

    new_pattern = Pattern(
        brand=brand,
        pattern_number=pattern_number,
        title=result["title"],
        description=result["description"],
        image=result["image"]
    )
    db.session.add(new_pattern)
    db.session.commit()
    return jsonify(new_pattern.to_dict())

# Route: Add a pattern manually
@app.route('/patterns', methods=['POST'])
def add_pattern():
    data = request.get_json()
    
    if not data or "brand" not in data or "pattern_number" not in data or "title" not in data:
        return jsonify({"error": "Missing required fields"}), 400

    new_pattern = Pattern(**data)
    db.session.add(new_pattern)
    db.session.commit()
    
    return jsonify(new_pattern.to_dict())

# Route: Update an existing pattern
@app.route('/patterns/<int:id>', methods=['PUT'])
def update_pattern(id):
    pattern = Pattern.query.get(id)
    
    if not pattern:
        return jsonify({"error": "Pattern not found"}), 404

    data = request.get_json()
    for key, value in data.items():
        setattr(pattern, key, value)  # Dynamically update fields
    
    db.session.commit()
    return jsonify(pattern.to_dict())

# Route: Delete a pattern
@app.route('/patterns/<int:id>', methods=['DELETE'])
def delete_pattern(id):
    pattern = Pattern.query.get(id)
    
    if not pattern:
        return jsonify({"error": "Pattern not found"}), 404

    db.session.delete(pattern)
    db.session.commit()
    
    return jsonify({"message": "Pattern deleted"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
