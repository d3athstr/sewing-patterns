from database import db

class Pattern(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    brand = db.Column(db.String(50), nullable=False)
    pattern_number = db.Column(db.String(50), nullable=False, unique=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    # Changed from storing a file path (string) to storing binary image data
    image_data = db.Column(db.LargeBinary, nullable=True)

    def to_dict(self):
        """
        Instead of returning raw binary data in the JSON response,
        we now provide an image URL that the frontend can use to fetch the image.
        """
        return {
            "id": self.id,
            "brand": self.brand,
            "pattern_number": self.pattern_number,
            "title": self.title,
            "description": self.description,
            "image_url": f"/pattern_image/{self.id}" if self.image_data else None,
        }