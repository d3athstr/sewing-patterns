docker exec -i sewing_patterns_backend sh -c "cat > /app/app.py" << 'EOF'
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configure Database
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://user:password@sewing_patterns_db/sewing_patterns"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# Define Database Model
class Pattern(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    brand = db.Column(db.String(50), nullable=False)
    pattern_number = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    image = db.Column(db.String(500), nullable=True)
    difficulty = db.Column(db.String(50), nullable=True)
    format = db.Column(db.String(50), nullable=True)
    sex = db.Column(db.String(50), nullable=True)
    item_type = db.Column(db.String(100), nullable=True)
    yardage = db.Column(db.String(100), nullable=True)
    notions = db.Column(db.String(200), nullable=True)
    cosplay_hack = db.Column(db.Boolean, default=False)
    cosplay_notes = db.Column(db.Text, nullable=True)

# Ensure database tables are created
with app.app_context():
    db.create_all()

# GET All Patterns
@app.route("/patterns", methods=["GET"])
def get_patterns():
    patterns = Pattern.query.all()
    return jsonify([
        {
            "id": p.id,
            "brand": p.brand,
            "pattern_number": p.pattern_number,
            "title": p.title,
            "description": p.description,
            "image": p.image,
            "difficulty": p.difficulty,
            "format": p.format,
            "sex": p.sex,
            "item_type": p.item_type,
            "yardage": p.yardage,
            "notions": p.notions,
            "cosplay_hack": p.cosplay_hack,
            "cosplay_notes": p.cosplay_notes,
        }
        for p in patterns
    ])

# POST: Add New Pattern
@app.route("/patterns", methods=["POST"])
def add_pattern():
    data = request.json
    new_pattern = Pattern(
        brand=data["brand"],
        pattern_number=data["pattern_number"],
        title=data["title"],
        description=data.get("description"),
        image=data.get("image"),
        difficulty=data.get("difficulty"),
        format=data.get("format"),
        sex=data.get("sex"),
        item_type=data.get("item_type"),
        yardage=data.get("yardage"),
        notions=data.get("notions"),
        cosplay_hack=data.get("cosplay_hack", False),
        cosplay_notes=data.get("cosplay_notes"),
    )
    db.session.add(new_pattern)
    db.session.commit()
    return jsonify({"message": "Pattern added", "id": new_pattern.id}), 201

# PUT: Update an Existing Pattern
@app.route("/patterns/<int:id>", methods=["PUT"])
def update_pattern(id):
    pattern = Pattern.query.get(id)
    if not pattern:
        return jsonify({"error": "Pattern not found"}), 404

    data = request.json
    for key, value in data.items():
        setattr(pattern, key, value)

    db.session.commit()
    return jsonify({"message": "Pattern updated"})

# DELETE: Remove a Pattern
@app.route("/patterns/<int:id>", methods=["DELETE"])
def delete_pattern(id):
    pattern = Pattern.query.get(id)
    if not pattern:
        return jsonify({"error": "Pattern not found"}), 404

    db.session.delete(pattern)
    db.session.commit()
    return jsonify({"message": "Pattern deleted"})

# Run the Flask App
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
EOF