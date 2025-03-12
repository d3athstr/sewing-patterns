from flask import Flask, request, jsonify, Response, url_for
from flask_cors import CORS
from flask_migrate import Migrate
from models import Pattern, PatternPDF, db
from scraper import scrape_pattern

app = Flask(__name__)
CORS(app)

# Database Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://user:password@sewing_patterns_db/sewing_patterns"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the db with the Flask app
db.init_app(app)
migrate = Migrate(app, db)

# Serve binary image data
@app.route("/pattern_image/<int:pattern_id>")
def get_pattern_image(pattern_id):
    pattern = Pattern.query.get(pattern_id)
    if pattern and pattern.image_data:
        return Response(pattern.image_data, mimetype="image/jpeg")
    return jsonify({"error": "Image not found"}), 404

# Serve binary PDF data
@app.route("/pattern_pdf/<int:pdf_id>")
def get_pattern_pdf(pdf_id):
    pdf = PatternPDF.query.get(pdf_id)
    if pdf and pdf.pdf_data:
        return Response(pdf.pdf_data, mimetype="application/pdf")
    return jsonify({"error": "PDF not found"}), 404

# Get all PDFs
@app.route('/pattern_pdfs', methods=['GET'])
def get_pattern_pdfs():
    pdfs = PatternPDF.query.all()
    return jsonify([pdf.to_dict() for pdf in pdfs])

# Upload a PDF file to a pattern
@app.route('/pattern_pdfs/upload', methods=['POST'])
def upload_pattern_pdf():
    pattern_id = request.form.get('pattern_id')
    category = request.form.get('category')  # e.g., A4, A0, Instructions, etc.
    file_order = request.form.get('file_order', type=int)
    pdf_file = request.files.get('pdf')

    if not pattern_id or not category or not pdf_file:
        return jsonify({"error": "Pattern ID, category, and file are required"}), 400

    pattern = Pattern.query.get(pattern_id)
    if not pattern:
        return jsonify({"error": "Pattern not found"}), 404

    new_pdf = PatternPDF(
        pattern_id=pattern_id,
        category=category,
        file_order=file_order,
        pdf_data=pdf_file.read()
    )

    db.session.add(new_pdf)
    db.session.commit()
    return jsonify(new_pdf.to_dict()), 201

# Get all patterns
@app.route('/patterns', methods=['GET'])
def get_patterns():
    patterns = Pattern.query.all()
    return jsonify([p.to_dict() for p in patterns])

# Add a new pattern, including PDFs if provided
import traceback

import traceback

import traceback

@app.route('/patterns', methods=['POST'])
def add_pattern():
    try:
        # Use multipart/form-data branch if applicable
        if request.content_type.startswith('multipart/form-data'):
            data = request.form.to_dict()
            print("Received form data:", data)
            
            # Define allowed keys
            valid_keys = {
                "brand", "pattern_number", "title", "description", "difficulty",
                "size", "sex", "item_type", "format", "inventory_qty", "cut_status",
                "cut_size", "cosplay_hackable", "cosplay_notes", "material_recommendations",
                "yardage", "notions", "notes"
            }
            # Filter out keys with empty values
            filtered_data = {key: data[key] for key in valid_keys if key in data and data[key].strip() != ""}
            print("Filtered data before conversion:", filtered_data)
            
            # Convert numeric fields if they exist
            if "inventory_qty" in filtered_data:
                try:
                    filtered_data["inventory_qty"] = int(filtered_data["inventory_qty"])
                except ValueError:
                    print("Conversion error for inventory_qty, removing key.")
                    filtered_data.pop("inventory_qty", None)
            
            print("Filtered data after conversion:", filtered_data)
            
            # Process uploaded image file
            image_file = request.files.get('image')
            if image_file:
                image_content = image_file.read()
                print("Received image file of size:", len(image_content))
                filtered_data["image_data"] = image_content
        else:
            # If not multipart, assume JSON
            data = request.json
            print("Received JSON data:", data)
            valid_keys = {
                "brand", "pattern_number", "title", "description", "image", "image_data", "difficulty",
                "size", "sex", "item_type", "format", "inventory_qty", "cut_status",
                "cut_size", "cosplay_hackable", "cosplay_notes", "material_recommendations",
                "yardage", "notions", "notes"
            }
            filtered_data = {key: data[key] for key in valid_keys if key in data and data[key] != ""}
        
        # Validate required fields
        if not filtered_data.get("brand") or not filtered_data.get("pattern_number"):
            return jsonify({"error": "Brand and Pattern Number are required"}), 400
        
        # Create new Pattern
        new_pattern = Pattern(**filtered_data)
        db.session.add(new_pattern)
        db.session.commit()
        
        # Handle PDFs if any (not the focus here)
        if "pdfs" in data:
            for pdf in data["pdfs"]:
                new_pdf = PatternPDF(
                    pattern_id=new_pattern.id,
                    category=pdf.get("category"),
                    file_order=pdf.get("file_order"),
                    pdf_url=pdf.get("pdf_url")
                )
                db.session.add(new_pdf)
        db.session.commit()
        return jsonify(new_pattern.to_dict()), 201

    except Exception as e:
        print("Error in /patterns endpoint:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# Add a PDF to an existing pattern
@app.route('/patterns/<int:pattern_id>/pdfs', methods=['POST'])
def add_pdf_to_pattern(pattern_id):
    if 'pdf' in request.files:
        # Handle file upload
        pdf_file = request.files['pdf']
        category = request.form.get("category", "Instructions")
        file_order = request.form.get("file_order", type=int)

        new_pdf = PatternPDF(
            pattern_id=pattern_id,
            category=category,
            file_order=file_order,
            pdf_data=pdf_file.read()
        )
    else:
        # Handle URL-based PDF attachment
        data = request.json
        required_keys = {"category", "pdf_url"}
        if not all(key in data for key in required_keys):
            return jsonify({"error": "Category and PDF URL are required"}), 400

        new_pdf = PatternPDF(
            pattern_id=pattern_id,
            category=data["category"],
            file_order=data.get("file_order"),
            pdf_url=data["pdf_url"]
        )

    db.session.add(new_pdf)
    db.session.commit()
    return jsonify(new_pdf.to_dict()), 201

# Update an existing pattern
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

@app.route('/pattern_pdfs/<int:pdf_id>', methods=['DELETE'])
def delete_pattern_pdf(pdf_id):
    pdf = PatternPDF.query.get(pdf_id)
    if not pdf:
        return jsonify({"error": "PDF not found"}), 404
    db.session.delete(pdf)
    db.session.commit()
    return jsonify({"message": "PDF deleted"}), 200

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
