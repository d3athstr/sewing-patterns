import React from 'react';
import { useAuth } from '../auth.jsx';
import "../lcars.css";

// Component for displaying pattern details when expanded
function PatternDetails({ pattern, onEdit, onDelete, pdfCategory, setPdfCategory, pdfFile, setPdfFile, uploadingPdf, handlePdfUpload, formatLabel, editingPatternId, editedPattern, handleEditChange, handleEditSubmit, setEditingPatternId }) {
  if (editingPatternId === pattern.id) {
    return (
      <form onSubmit={handleEditSubmit}>
        {Object.entries(editedPattern).map(
          ([key, value]) =>
            key !== "id" &&
            key !== "pdf_files" &&
            key !== "downloaded" &&
            key !== "image_url" && (
              <div key={key} className="edit-field">
                <label>{formatLabel(key)}</label>
                {key === "description" ||
                key === "cosplay_notes" ||
                key === "notes" ? (
                  <textarea
                    name={key}
                    value={value || ""}
                    onChange={handleEditChange}
                  />
                ) : key === "cosplay_hackable" ? (
                  <select
                    name={key}
                    value={value || ""}
                    onChange={handleEditChange}
                  >
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : (
                  <input
                    type={
                      key === "inventory_qty"
                        ? "number"
                        : "text"
                    }
                    name={key}
                    value={value || ""}
                    onChange={handleEditChange}
                  />
                )}
              </div>
            )
        )}
        <div className="edit-actions">
          <button type="submit">Save</button>
          <button
            type="button"
            onClick={() => setEditingPatternId(null)}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  // Helper: Converts URLs in a text string into clickable links.
  const linkify = (text) => {
    if (!text) return '';
    // Regular expression to detect URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <>
      <div key={pattern.id}>
      {pattern.image_url && (
        <div className="pattern-expanded-image">
          <img
            className="pattern-card-large"
            src={pattern.image_url.startsWith('http') ? pattern.image_url : `${process.env.REACT_APP_API_BASE_URL}${pattern.image_url}`}
            alt={`${pattern.brand} ${pattern.pattern_number}`}
          />
        </div>
      )}
      {pattern.description && (
        <div>
          <strong>Description:</strong>{" "}
          {linkify(pattern.description)}
        </div>
      )}
      {pattern.material_recommendations && (
        <div>
          <strong>Materials:</strong>{" "}
          {pattern.material_recommendations}
        </div>
      )}
      {pattern.yardage && (
        <div>
          <strong>Yardage:</strong> {pattern.yardage}
        </div>
      )}
      {pattern.notions && (
        <div>
          <strong>Notions:</strong> {pattern.notions}
        </div>
      )}
      {pattern.cosplay_hackable && (
        <div>
          <strong>Cosplay Hackable:</strong>{" "}
          {pattern.cosplay_hackable ? "Yes" : "No"}
        </div>
      )}
      {pattern.cosplay_notes && (
        <div>
          <strong>Cosplay Notes:</strong>{" "}
          {pattern.cosplay_notes}
        </div>
      )}
      {pattern.notes && (
        <div>
          <strong>Notes:</strong> {pattern.notes}
        </div>
      )}

      {/* PDF Files */}
      <div className="pdf-section">
        <h3>PDF Files</h3>
        {pattern.pdf_files && pattern.pdf_files.length > 0 ? (
          <ul className="pdf-list">
            {pattern.pdf_files.map((pdf) => (
              <li key={pdf.id}>
                <a
                  href={pdf.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {pdf.category}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No PDF files available.</p>
        )}

        {/* PDF Upload */}
        <div className="pdf-upload">
          <h4>Upload PDF</h4>
          <div>
            <select
              value={pdfCategory}
              onChange={(e) => setPdfCategory(e.target.value)}
            >
              <option value="Instructions">Instructions</option>
              <option value="Pattern">Pattern</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files[0])}
            />
            <button
              onClick={() => handlePdfUpload(pattern.id)}
              disabled={uploadingPdf || !pdfFile}
            >
              {uploadingPdf ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </div>

      <div className="pattern-actions">
        <button onClick={(e) => onEdit(pattern, e)}>
          Edit
        </button>
        <button onClick={(e) => onDelete(pattern.id, e)}>
          Delete
        </button>
      </div>
      </div>
    </>
  );
}
