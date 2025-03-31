import React, { useState } from 'react';

function FilterPanel({ filters, handleFilterChange, clearFilters }) {
  return (
    <div className="lcars-panel">
      <h2>Filters</h2>
      <div className="form-grid">
        <div>
          <label>Brand</label>
          <input
            type="text"
            name="brand"
            value={filters.brand || ""}
            onChange={handleFilterChange}
          />
        </div>
        <div>
          <label>Pattern Number</label>
          <input
            type="text"
            name="pattern_number"
            value={filters.pattern_number || ""}
            onChange={handleFilterChange}
          />
        </div>
        <div>
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={filters.title || ""}
            onChange={handleFilterChange}
          />
        </div>
        <div>
          <label>Difficulty</label>
          <input
            type="text"
            name="difficulty"
            value={filters.difficulty || ""}
            onChange={handleFilterChange}
          />
        </div>
        <div>
          <label>Item Type</label>
          <input
            type="text"
            name="item_type"
            value={filters.item_type || ""}
            onChange={handleFilterChange}
          />
        </div>
      </div>
      <button onClick={clearFilters}>Clear Filters</button>
    </div>
  );
}

export default FilterPanel;

