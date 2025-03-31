import React, { useState, useEffect, useRef } from 'react';
import PatternCard from './PatternCard';
import PatternDetails from './PatternDetails';

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
  return (
    <div className="lcars-panel">
      <h2>Patterns ({filteredPatterns.length})</h2>
      {filteredPatterns.length === 0 ? (
        <p>No patterns found.</p>
      ) : (
        <div className="pattern-list">
          {filteredPatterns.slice(0, visibleCount).map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              expandedPatternId={expandedPatternId}
              toggleExpand={toggleExpand}
              getImageInfo={getImageInfo}
              PatternDetails={PatternDetails}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
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
          ))}
          {filteredPatterns.length > visibleCount && (
            <div ref={loadMoreRef} className="load-more-sentinel">
              Loading more...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PatternList;
