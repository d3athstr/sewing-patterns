import React from 'react';

// PatternList component with robust array handling
function PatternList({ 
  filteredPatterns, 
  visibleCount, 
  loadMoreRef, 
  expandedPatternId, 
  toggleExpand, 
  getImageInfo, 
  handleEdit, 
  handleDelete, 
  pdfCategory, 
  setPdfCategory, 
  pdfFile, 
  setPdfFile, 
  uploadingPdf, 
  handlePdfUpload, 
  formatLabel, 
  editingPatternId, 
  editedPattern, 
  handleEditChange, 
  handleEditSubmit, 
  setEditingPatternId 
}) {
  // Ensure filteredPatterns is always an array
  const safePatterns = Array.isArray(filteredPatterns) ? filteredPatterns : [];
  
  // Safely slice the visible patterns
  const visiblePatterns = safePatterns.slice(0, visibleCount);
  
  console.log("PatternList rendering with", safePatterns.length, "patterns");
  console.log("Visible patterns:", visiblePatterns.length);

  // Handle empty patterns array
  if (safePatterns.length === 0) {
    return (
      <div className="lcars-panel">
        <h2>No Patterns Found</h2>
        <p>There are no patterns matching your filters, or the database is empty.</p>
      </div>
    );
  }

  return (
    <div className="pattern-list">
      <h2>Patterns ({safePatterns.length})</h2>
      
      {visiblePatterns.map((pattern) => (
        <div
          key={pattern.id || `temp-${pattern.pattern_number}`}
          className={`lcars-panel pattern-card ${
            expandedPatternId === pattern.id ? "expanded" : ""
          }`}
          onClick={() => toggleExpand(pattern.id)}
        >
          <div className="pattern-header">
            <h3>
              {pattern.brand} {pattern.pattern_number}
            </h3>
            <div className="pattern-actions">
              <button
                onClick={(e) => handleEdit(pattern, e)}
                className="edit-btn"
              >
                Edit
              </button>
              <button
                onClick={(e) => handleDelete(pattern.id, e)}
                className="delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
          
          <div className="pattern-basic-info">
            <div className="pattern-image">
              {pattern.image_url ? (
                <img
                  src={getImageInfo(pattern).src}
                  alt={`${pattern.brand} ${pattern.pattern_number}`}
                  className={
                    getImageInfo(pattern).downloaded ? "" : "not-downloaded"
                  }
                />
              ) : (
                <div className="no-image">No Image</div>
              )}
            </div>
            <div className="pattern-details">
              <p>
                <strong>Title:</strong> {pattern.title || "N/A"}
              </p>
              <p>
                <strong>Type:</strong> {pattern.item_type || "N/A"}
              </p>
              <p>
                <strong>Size:</strong> {pattern.size || "N/A"}
              </p>
              <p>
                <strong>Inventory:</strong>{" "}
                {pattern.inventory_qty !== undefined
                  ? pattern.inventory_qty
                  : "N/A"}
              </p>
            </div>
          </div>
          
          {expandedPatternId === pattern.id && (
            <div className="pattern-expanded-info">
              {editingPatternId === pattern.id ? (
                <form onSubmit={handleEditSubmit}>
                  <h4>Edit Pattern</h4>
                  <div className="edit-form-grid">
                    {Object.keys(editedPattern).map((key) => {
                      // Skip id and other non-editable fields
                      if (
                        key === "id" ||
                        key === "pdf_files" ||
                        key === "downloaded" ||
                        key === "image_url"
                      ) {
                        return null;
                      }
                      return (
                        <div className="form-group" key={key}>
                          <label htmlFor={key}>{formatLabel(key)}:</label>
                          <input
                            type="text"
                            id={key}
                            name={key}
                            value={editedPattern[key] || ""}
                            onChange={handleEditChange}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="form-actions">
                    <button type="submit">Save</button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPatternId(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="expanded-details-grid">
                    {Object.entries(pattern).map(([key, value]) => {
                      // Skip certain fields
                      if (
                        key === "id" ||
                        key === "pdf_files" ||
                        key === "downloaded" ||
                        key === "image_url" ||
                        key === "brand" ||
                        key === "pattern_number" ||
                        key === "title" ||
                        key === "item_type" ||
                        key === "size" ||
                        key === "inventory_qty"
                      ) {
                        return null;
                      }
                      return (
                        <div className="detail-item" key={key}>
                          <strong>{formatLabel(key)}:</strong>{" "}
                          {value !== null && value !== "" ? value : "N/A"}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="pdf-section">
                    <h4>PDF Files</h4>
                    {Array.isArray(pattern.pdf_files) && pattern.pdf_files.length > 0 ? (
                      <ul className="pdf-list">
                        {pattern.pdf_files.map((pdf) => (
                          <li key={pdf.id}>
                            <a
                              href={pdf.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {pdf.category || "Document"} (
                              {pdf.filename || "PDF"})
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No PDF files available</p>
                    )}
                    
                    <div className="pdf-upload">
                      <h5>Upload PDF</h5>
                      <div className="form-group">
                        <label htmlFor={`pdf-category-${pattern.id}`}>
                          Category:
                        </label>
                        <select
                          id={`pdf-category-${pattern.id}`}
                          value={pdfCategory}
                          onChange={(e) => setPdfCategory(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="Instructions">Instructions</option>
                          <option value="Pattern">Pattern</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor={`pdf-file-${pattern.id}`}>
                          PDF File:
                        </label>
                        <input
                          type="file"
                          id={`pdf-file-${pattern.id}`}
                          accept=".pdf"
                          onChange={(e) => setPdfFile(e.target.files[0])}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePdfUpload(pattern.id);
                        }}
                        disabled={!pdfFile || uploadingPdf}
                      >
                        {uploadingPdf ? "Uploading..." : "Upload PDF"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
      
      {/* Load more sentinel */}
      {safePatterns.length > visibleCount && (
        <div ref={loadMoreRef} className="load-more-sentinel">
          Loading more...
        </div>
      )}
    </div>
  );
}

export default PatternList;
