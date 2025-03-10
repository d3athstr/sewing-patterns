from sqlalchemy import Column, Integer, String, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from database import Base

class Pattern(Base):
    __tablename__ = "patterns"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String, index=True)
    pattern_number = Column(String, index=True)
    title = Column(String)
    description = Column(String)
    format = Column(String, default="Paper")  # Paper or PDF

    # Define relationship to PatternPDFs
    pdfs = relationship("PatternPDF", back_populates="pattern", cascade="all, delete")

class PatternPDF(Base):
    __tablename__ = "pattern_pdfs"

    id = Column(Integer, primary_key=True, index=True)
    pattern_id = Column(Integer, ForeignKey("patterns.id", ondelete="CASCADE"))
    file_data = Column(LargeBinary, nullable=False)  # Store PDF as BLOB
    filename = Column(String, nullable=False)  # Original filename
    category = Column(String, nullable=False)  # A4, Legal, Letter, A0, Instructions

    pattern = relationship("Pattern", back_populates="pdfs")
