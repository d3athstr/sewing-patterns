import React, { useState } from 'react';

function AddPatternPanel({ BRANDS, newPattern, setNewPattern, handleScrapeAndAdd, showManualAdd, setShowManualAdd }) {
  return (
    <div className="lcars-panel">
      <h2>Add Pattern</h2>
      <div className="form-row">
        <select
          value={newPattern.brand}
          onChange={(e) =>
            setNewPattern({ ...newPattern, brand: e.target.value })
          }
        >
          {BRANDS.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Pattern Number"
          value={newPattern.pattern_number}
          onChange={(e) =>
            setNewPattern({ ...newPattern, pattern_number: e.target.value })
          }
        />
        <button onClick={handleScrapeAndAdd}>Scrape & Add</button>
        <button onClick={() => setShowManualAdd(!showManualAdd)}>
          {showManualAdd ? "Cancel Manual Add" : "Manual Add"}
        </button>
      </div>
    </div>
  );
}

export default AddPatternPanel;
