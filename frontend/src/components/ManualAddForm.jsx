import React, { useState } from 'react';

function ManualAddForm({ manualPattern, setManualPattern, manualImageFile, setManualImageFile, handleManualAddSubmit }) {
  return (
    <div className="lcars-panel">
      <h2>Manual Add</h2>
      <div className="form-grid">
        <div>
          <label>Brand</label>
          <input
            type="text"
            value={manualPattern.brand}
            onChange={(e) =>
              setManualPattern({ ...manualPattern, brand: e.target.value })
            }
          />
        </div>
        <div>
          <label>Pattern Number</label>
          <input
            type="text"
            value={manualPattern.pattern_number}
            onChange={(e) =>
              setManualPattern({
                ...manualPattern,
                pattern_number: e.target.value
              })
            }
          />
        </div>
        <div>
          <label>Title</label>
          <input
            type="text"
            value={manualPattern.title}
            onChange={(e) =>
              setManualPattern({ ...manualPattern, title: e.target.value })
            }
          />
        </div>
        <div>
          <label>Description</label>
          <textarea
            value={manualPattern.description}
            onChange={(e) =>
              setManualPattern({
                ...manualPattern,
                description: e.target.value
              })
            }
          />
        </div>
        <div>
          <label>Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setManualImageFile(e.target.files[0])}
          />
        </div>
        <div>
          <label>Difficulty</label>
          <input
            type="text"
            value={manualPattern.difficulty}
            onChange={(e) =>
              setManualPattern({
                ...manualPattern,
                difficulty: e.target.value
              })
            }
          />
        </div>
        <div>
          <label>Size</label>
          <input
            type="text"
            value={manualPattern.size}
            onChange={(e) =>
              setManualPattern({ ...manualPattern, size: e.target.value })
            }
          />
        </div>
        <div>
          <label>Format</label>
          <input
            type="text"
            value={manualPattern.format}
            onChange={(e) =>
              setManualPattern({ ...manualPattern, format: e.target.value })
            }
          />
        </div>
        <div>
          <label>Inventory Quantity</label>
          <input
            type="number"
            value={manualPattern.inventory_qty}
            onChange={(e) =>
              setManualPattern({
                ...manualPattern,
                inventory_qty: e.target.value
              })
            }
          />
        </div>
        <div>
          <label>Cosplay Hackable</label>
          <select
            value={manualPattern.cosplay_hackable}
            onChange={(e) =>
              setManualPattern({
                ...manualPattern,
                cosplay_hackable: e.target.value
              })
            }
          >
            <option value="">Select</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>
      <button onClick={handleManualAddSubmit}>Add Pattern</button>
    </div>
  );
}

export default ManualAddForm;
