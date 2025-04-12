
import React from 'react';
import PatternDetails from './PatternDetails.jsx';

// PatternList component with fixed image and PDF loading
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
  setEditingPatternId,
  API_BASE_URL
}) {
  const safePatterns = Array.isArray(filteredPatterns) ? filteredPatterns : [];
  const visiblePatterns = safePatterns.slice(0, visibleCount);

  const placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

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

      {visiblePatterns.map((pattern) => {
        const isExpanded = expandedPatternId === pattern.id;
        return (
          <div
            key={pattern.id || `temp-${pattern.pattern_number}`}
            className={`lcars-panel pattern-card ${isExpanded ? "expanded" : ""}`}
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
                    src={pattern.image_url.startsWith('http') 
                      ? pattern.image_url 
                      : `${API_BASE_URL}${pattern.image_url}`}
                    alt={`${pattern.brand} ${pattern.pattern_number}`}
                    className={
                      `${getImageInfo(pattern).downloaded ? "" : "not-downloaded"} ${
                        isExpanded ? "pattern-card-large" : ""
                      }`.trim()
                    }
                    onError={(e) => {
                      console.log("Image failed to load:", pattern.image_url);
                      e.target.onerror = null;
                      e.target.src = placeholderImage;
                    }}
                  />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>
              <div className="pattern-details">
                <p><strong>Title:</strong> {pattern.title || "N/A"}</p>
                <p><strong>Type:</strong> {pattern.item_type || "N/A"}</p>
                <p><strong>Size:</strong> {pattern.size || "N/A"}</p>
                <p><strong>Inventory:</strong> {pattern.inventory_qty ?? "N/A"}</p>
              </div>
            </div>

            {isExpanded && (
              <div className="pattern-expanded-info">
                <PatternDetails
                  key={pattern.id}
                  pattern={pattern}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  pdfCategory={pdfCategory}
                  setPdfCategory={setPdfCategory}
                  pdfFile={pdfFile}
                  setPdfFile={setPdfFile}
                  uploadingPdf={uploadingPdf}
                  handlePdfUpload={handlePdfUpload}
                  formatLabel={formatLabel}
                  editingPatternId={editingPatternId}
                  editedPattern={editedPattern}
                  handleEditChange={handleEditChange}
                  handleEditSubmit={handleEditSubmit}
                  setEditingPatternId={setEditingPatternId}
                />
              </div>
            )}
          </div>
        );
      })}

      {safePatterns.length > visibleCount && (
        <div ref={loadMoreRef} className="load-more-sentinel">
          Loading more...
        </div>
      )}
    </div>
  );
}

export default PatternList;
