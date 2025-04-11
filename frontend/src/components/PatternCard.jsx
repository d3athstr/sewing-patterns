import React, { useState } from 'react';

function PatternCard({ pattern, expandedPatternId, toggleExpand, getImageInfo, PatternDetails, handleEdit, handleDelete, pdfCategory, setPdfCategory, pdfFile, setPdfFile, uploadingPdf, handlePdfUpload, formatLabel, editingPatternId, editedPattern, handleEditChange, handleEditSubmit, setEditingPatternId }) {
  return (
    <div
      key={pattern.id}
      className={`pattern-card-large ${
        expandedPatternId === pattern.id ? "expanded" : ""
      }`}
      onClick={() => toggleExpand(pattern.id)}
    >
      <img
        className="pattern-card-large"
        src={getImageInfo(pattern).src}
        alt={`${pattern.brand} ${pattern.pattern_number}`}
      />
      <div className="pattern-info">
        <div className="pattern-title">
          {pattern.brand} {pattern.pattern_number}
        </div>
        <div className="pattern-meta">
          {pattern.title && <div>{pattern.title}</div>}
          {pattern.difficulty && (
            <div>Difficulty: {pattern.difficulty}</div>
          )}
          {pattern.size && <div>Size: {pattern.size}</div>}
          {pattern.inventory_qty && (
            <div>Quantity: {pattern.inventory_qty}</div>
          )}
        </div>

        {expandedPatternId === pattern.id && (
          <div className="pattern-details">
            <PatternDetails 
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
    </div>
  );
}

export default PatternCard;
