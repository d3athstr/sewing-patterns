import React from 'react';

// FilterPanel component with all search fields restored
function FilterPanel({ filters, handleFilterChange, clearFilters }) {
  console.log("FilterPanel rendering with filters:", filters);

  return (
    <div className="lcars-panel filter-panel">
      <h2>Filter Patterns</h2>
      <div className="filter-grid">
        <div className="form-group">
          <label htmlFor="brand">Brand:</label>
          <input
            type="text"
            id="brand"
            name="brand"
            value={filters.brand || ""}
            onChange={handleFilterChange}
            placeholder="Filter by brand"
          />
        </div>
        <div className="form-group">
          <label htmlFor="pattern_number">Pattern Number:</label>
          <input
            type="text"
            id="pattern_number"
            name="pattern_number"
            value={filters.pattern_number || ""}
            onChange={handleFilterChange}
            placeholder="Filter by pattern number"
          />
        </div>
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={filters.title || ""}
            onChange={handleFilterChange}
            placeholder="Filter by title"
          />
        </div>
        <div className="form-group">
          <label htmlFor="item_type">Item Type:</label>
          <input
            type="text"
            id="item_type"
            name="item_type"
            value={filters.item_type || ""}
            onChange={handleFilterChange}
            placeholder="Filter by item type"
          />
        </div>
        <div className="form-group">
          <label htmlFor="size">Size:</label>
          <input
            type="text"
            id="size"
            name="size"
            value={filters.size || ""}
            onChange={handleFilterChange}
            placeholder="Filter by size"
          />
        </div>
        <div className="form-group">
          <label htmlFor="sex">Sex:</label>
          <input
            type="text"
            id="sex"
            name="sex"
            value={filters.sex || ""}
            onChange={handleFilterChange}
            placeholder="Filter by sex"
          />
        </div>
        <div className="form-group">
          <label htmlFor="difficulty">Difficulty:</label>
          <input
            type="text"
            id="difficulty"
            name="difficulty"
            value={filters.difficulty || ""}
            onChange={handleFilterChange}
            placeholder="Filter by difficulty"
          />
        </div>
        <div className="form-group">
          <label htmlFor="format">Format:</label>
          <input
            type="text"
            id="format"
            name="format"
            value={filters.format || ""}
            onChange={handleFilterChange}
            placeholder="Filter by format"
          />
        </div>
        <div className="form-group">
          <label htmlFor="cosplay_hackable">Cosplay Hackable:</label>
          <input
            type="text"
            id="cosplay_hackable"
            name="cosplay_hackable"
            value={filters.cosplay_hackable || ""}
            onChange={handleFilterChange}
            placeholder="Filter by cosplay hackable"
          />
        </div>
        <div className="form-group">
          <label htmlFor="notes">Notes:</label>
          <input
            type="text"
            id="notes"
            name="notes"
            value={filters.notes || ""}
            onChange={handleFilterChange}
            placeholder="Filter by notes"
          />
        </div>
      </div>
      <button onClick={clearFilters} className="clear-filters-btn">
        Clear Filters
      </button>
    </div>
  );
}

export default FilterPanel;
