import { useState, useEffect } from "react";
import PDFList from "./PDFList";

function App() {
  const BRANDS = [
    "Butterick",
    "Vogue",
    "Simplicity",
    "McCall's",
    "Know Me",
    "New Look",
    "Burda"
  ];

  const API_BASE_URL = "http://192.168.14.45:5000";

  const fetchData = (endpoint) => {
    return fetch(`${API_BASE_URL}/${endpoint}`)
      .then((res) => res.json())
      .catch((err) => console.error(`Error fetching ${endpoint}:`, err));
  };

  // Helper to format labels: remove underscores and convert to Title Case.
  const formatLabel = (label) => {
    return label
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const [patterns, setPatterns] = useState([]);
  const [newPattern, setNewPattern] = useState({
    brand: BRANDS[0],
    pattern_number: "",
    title: "",
    description: "",
    difficulty: "",
    size: "",
    sex: "",
    item_type: "",
    format: "",
    inventory_qty: "",
    cut_status: "",
    cut_size: "",
    material_recommendations: "",
    yardage: "",
    notions: "",
    cosplay_hackable: "",
    cosplay_notes: "",
    sewing_rating: "",
    notes: ""
  });

  // New state for manual add form without the image text field.
  const [manualPattern, setManualPattern] = useState({
    brand: "",
    pattern_number: "",
    title: "",
    description: "",
    difficulty: "",
    size: "",
    sex: "",
    item_type: "",
    format: "",
    inventory_qty: "",
    cut_status: "",
    cut_size: "",
    material_recommendations: "",
    yardage: "",
    notions: "",
    cosplay_hackable: "",
    cosplay_notes: "",
    sewing_rating: "",
    notes: ""
  });
  // New state to store the image file for manual add
  const [manualImageFile, setManualImageFile] = useState(null);

  const [showManualAdd, setShowManualAdd] = useState(false);
  const [editingPatternId, setEditingPatternId] = useState(null);
  const [editedPattern, setEditedPattern] = useState({});
  const [filters, setFilters] = useState({});
  const [expandedPatternId, setExpandedPatternId] = useState(null);

  // New: PDF upload states
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfCategory, setPdfCategory] = useState("Instructions");
  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/patterns`)
      .then((res) => res.json())
      .then((data) => setPatterns(data))
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  // Helper: returns image info from the backend
  const getImageInfo = (pattern) => {
    return {
      src: pattern.image_url,
      downloaded: pattern.downloaded,
    };
  };

  // Function to handle PDF file upload (unchanged)
  const handlePdfUpload = (patternId) => {
    if (!pdfFile) {
      alert("Please select a file first.");
      return;
    }
    setUploadingPdf(true);
    const formData = new FormData();
    formData.append("pattern_id", patternId);
    formData.append("category", pdfCategory);
    formData.append("pdf", pdfFile);
    fetch(`${API_BASE_URL}/pattern_pdfs/upload`, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        alert("PDF uploaded successfully!");
        setPatterns((prevPatterns) =>
          prevPatterns.map((p) =>
            p.id === patternId
              ? { ...p, pdf_files: [...(p.pdf_files || []), data] }
              : p
          )
        );
        setPdfFile(null);
        setUploadingPdf(false);
      })
      .catch((err) => {
        console.error("Error uploading PDF:", err);
        alert("Failed to upload PDF.");
        setUploadingPdf(false);
      });
  };

  const handleScrapeAndAdd = () => {
    const scrapeUrl = `${API_BASE_URL}/scrape?brand=${newPattern.brand}&pattern_number=${newPattern.pattern_number}`;
    fetch(scrapeUrl)
      .then((res) => res.json())
      .then((scrapedData) => {
        console.log("✅ Raw Scraped Response:", scrapedData);
        if (!scrapedData.brand || !scrapedData.pattern_number) {
          throw new Error("❌ Scraped data is incomplete.");
        }
        return fetchData("patterns").then((patterns) => {
          const existingPattern = patterns.find(
            (p) =>
              p.brand === scrapedData.brand &&
              p.pattern_number === scrapedData.pattern_number
          );
          const url = existingPattern
            ? `${API_BASE_URL}/patterns/${existingPattern.id}`
            : `${API_BASE_URL}/patterns`;
          const method = existingPattern ? "PUT" : "POST";
          const body = JSON.stringify(
            existingPattern
              ? {
                  ...existingPattern,
                  ...scrapedData,
                  inventory_qty: (existingPattern.inventory_qty || 0) + 1,
                }
              : scrapedData
          );
          return fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body,
          }).then((res) => res.json());
        });
      })
      .then((addedOrUpdatedPattern) => {
        console.log("✅ Updated Pattern:", addedOrUpdatedPattern);
        setPatterns((prev) => {
          const updated = prev.map((p) =>
            p.id === addedOrUpdatedPattern.id ? addedOrUpdatedPattern : p
          );
          return updated.some((p) => p.id === addedOrUpdatedPattern.id)
            ? updated
            : [...updated, addedOrUpdatedPattern];
        });
        setNewPattern({ ...newPattern, pattern_number: "" });
      })
      .catch((err) => console.error(err));
  };

  // Function to handle submission of manual add with image file upload (unchanged)
  const handleManualAddSubmit = () => {
    const formData = new FormData();
    for (const key in manualPattern) {
      formData.append(key, manualPattern[key]);
    }
    if (manualImageFile) {
      formData.append("image", manualImageFile);
    }
    fetch(`${API_BASE_URL}/patterns`, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((addedPattern) => {
        setPatterns((prev) => [...prev, addedPattern]);
        setManualPattern({
          brand: "",
          pattern_number: "",
          title: "",
          description: "",
          difficulty: "",
          size: "",
          sex: "",
          item_type: "",
          format: "",
          inventory_qty: "",
          cut_status: "",
          cut_size: "",
          material_recommendations: "",
          yardage: "",
          notions: "",
          cosplay_hackable: "",
          cosplay_notes: "",
          sewing_rating: "",
          notes: ""
        });
        setManualImageFile(null);
        setShowManualAdd(false);
      })
      .catch((err) => console.error("Error adding manual pattern:", err));
  };

  const handleEdit = (pattern, e) => {
    if (e) e.stopPropagation();
    setEditingPatternId(pattern.id);
    setEditedPattern({ ...pattern });
    setExpandedPatternId(pattern.id);
  };

  const handleEditChange = (e) => {
    e.stopPropagation();
    setEditedPattern({ ...editedPattern, [e.target.name]: e.target.value });
  };

  const handleUpdate = (id, e) => {
    if (e) e.stopPropagation();
    fetch(`${API_BASE_URL}/patterns/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editedPattern),
    })
      .then((res) => res.json())
      .then((updatedPattern) => {
        setPatterns((prev) =>
          prev.map((p) => (p.id === updatedPattern.id ? updatedPattern : p))
        );
        setEditingPatternId(null);
      })
      .catch((err) => console.error("Error updating pattern:", err));
  };

  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    fetch(`${API_BASE_URL}/patterns/${id}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) {
          setPatterns((prev) => prev.filter((p) => p.id !== id));
        } else {
          console.error("Failed to delete pattern");
        }
      })
      .catch((err) => console.error("Error deleting pattern:", err));
  };

  // New: Function to delete a PDF file with a confirmation dialog.
  const handleDeletePdf = (pdfId, patternId) => {
    if (!window.confirm("Are you sure you want to delete this PDF?")) return;
    fetch(`${API_BASE_URL}/pattern_pdfs/${pdfId}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete PDF");
        // Update the pattern's pdf_files list in state
        setPatterns((prev) =>
          prev.map((pattern) => {
            if (pattern.id === patternId) {
              return {
                ...pattern,
                pdf_files: pattern.pdf_files.filter((pdf) => pdf.id !== pdfId)
              };
            }
            return pattern;
          })
        );
      })
      .catch((err) => {
        console.error("Error deleting PDF:", err);
        alert("Failed to delete PDF.");
      });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value.toLowerCase() });
  };

  const togglePatternExpand = (id) => {
    setExpandedPatternId(expandedPatternId === id ? null : id);
  };

  const filteredPatterns = patterns
    .filter((pattern) => {
      return Object.entries(filters).every(([key, value]) =>
        value ? String(pattern[key]).toLowerCase().includes(value) : true
      );
    })
    .sort((a, b) => {
      const extractNumber = (patternNumber) => {
        const numericPart = patternNumber.replace(/[^\d]/g, "");
        return numericPart ? parseInt(numericPart, 10) : Infinity;
      };
      return extractNumber(a.pattern_number) - extractNumber(b.pattern_number);
    });

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Sewing Patterns</h1>

      {/* Search Fields */}
      <h2>Search Patterns</h2>
      {Object.keys(newPattern).map((key) => (
        <input
          key={key}
          name={key}
          placeholder={`Filter by ${key}`}
          onChange={(e) =>
            setFilters({ ...filters, [e.target.name]: e.target.value.toLowerCase() })
          }
        />
      ))}

      {/* Add New Pattern */}
      <h2>Add New Pattern</h2>
      <select
        name="brand"
        value={newPattern.brand}
        onChange={(e) => setNewPattern({ ...newPattern, brand: e.target.value })}
      >
        {BRANDS.map((brand) => (
          <option key={brand} value={brand}>
            {brand}
          </option>
        ))}
      </select>
      <input
        name="pattern_number"
        placeholder="Pattern Number"
        value={newPattern.pattern_number}
        onChange={(e) => setNewPattern({ ...newPattern, pattern_number: e.target.value })}
        required
      />
      <button onClick={handleScrapeAndAdd}>Scrape & Add</button>
      {/* New Manual Add Button */}
      <button onClick={() => setShowManualAdd(true)} style={{ marginLeft: "10px" }}>
        Manual Add
      </button>

      {/* List of Patterns */}
      {filteredPatterns.length === 0 ? (
        <p>Loading...</p>
      ) : (
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {filteredPatterns.map((pattern) => {
            const { src, downloaded } = getImageInfo(pattern);
            return (
              <li
                key={pattern.id}
                style={{
                  border: "1px solid black",
                  padding: "10px",
                  margin: "10px",
                  cursor: "pointer"
                }}
                onClick={() => togglePatternExpand(pattern.id)}
              >
                {/* Condensed View */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img src={src} alt={pattern.title} width="100" style={{ marginRight: "10px" }} />
                  <h3>
                    {pattern.brand} {pattern.pattern_number} - {pattern.title}
                  </h3>
                </div>
                {expandedPatternId === pattern.id && (
                  <div>
                    {editingPatternId === pattern.id ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <select name="brand" value={editedPattern.brand} onChange={handleEditChange}>
                          {BRANDS.map((brand) => (
                            <option key={brand} value={brand}>
                              {brand}
                            </option>
                          ))}
                        </select>
                        {Object.keys(newPattern)
                          .filter((key) => key !== "brand")
                          .map((key) => (
                            <div key={key}>
                              <label>{key}:</label>
                              <input name={key} value={editedPattern[key] || ""} onChange={handleEditChange} />
                            </div>
                          ))}
                        <button onClick={(e) => handleUpdate(pattern.id, e)}>Save</button>
                        <button onClick={() => setEditingPatternId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
                        {/* Enlarged image on the left */}
                        <div>
                          <img src={src} alt={pattern.title} width="400" />
                        </div>
                        {/* Details on the right */}
                        <div>
                          <dl style={{ lineHeight: "1.6" }}>
                            {Object.keys(pattern)
                              .filter((key) => !["id", "image_url", "pdf_files", "downloaded"].includes(key))
                              .map((key) => (
                                <div key={key} style={{ marginBottom: "5px" }}>
                                  <dt
                                    style={{
                                      fontWeight: "bold",
                                      display: "inline-block",
                                      width: "150px"
                                    }}
                                  >
                                    {formatLabel(key)}:
                                  </dt>
                                  <dd style={{ display: "inline-block", marginLeft: "10px" }}>
                                    {pattern[key]}
                                  </dd>
                                </div>
                              ))}
                          </dl>
                        </div>
                      </div>
                    )}

                    {/* PDF Files and controls */}
                    <h4>PDF Files:</h4>
                    <ul>
                      {pattern.pdf_files && pattern.pdf_files.length > 0 ? (
                        pattern.pdf_files.map((pdf) => (
                          <li key={pdf.id} style={{ marginBottom: "5px" }}>
                            <a href={pdf.pdf_url} target="_blank" rel="noopener noreferrer">
                              {pdf.category} (Order: {pdf.file_order || "N/A"})
                            </a>
                            {pdf.downloaded && <span> ✅ Downloaded</span>}
                            {/* Delete PDF button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePdf(pdf.id, pattern.id);
                              }}
                              style={{ marginLeft: "10px" }}
                            >
                              Delete PDF
                            </button>
                          </li>
                        ))
                      ) : (
                        <p>No PDFs attached.</p>
                      )}
                    </ul>
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: "flex", alignItems: "center", marginTop: "10px" }}
                    >
                      <select
                        value={pdfCategory}
                        onChange={(e) => setPdfCategory(e.target.value)}
                        style={{ marginRight: "10px" }}
                      >
                        <option value="Instructions">Instructions</option>
                        <option value="A4">A4</option>
                        <option value="A0">A0</option>
                        <option value="Letter">Letter</option>
                        <option value="Legal">Legal</option>
                      </select>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setPdfFile(e.target.files[0])}
                      />
                      <button
                        onClick={() => handlePdfUpload(pattern.id)}
                        disabled={uploadingPdf || !pdfFile}
                        style={{ marginLeft: "10px" }}
                      >
                        {uploadingPdf ? "Uploading..." : "Upload PDF"}
                      </button>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => handleEdit(pattern, e)}>Edit</button>
                      <button onClick={(e) => handleDelete(pattern.id, e)}>Delete</button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Manual Add Modal */}
      {showManualAdd && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: "#333",
              color: "#fff",
              padding: "20px",
              borderRadius: "4px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "90%",
              overflowY: "auto"
            }}
          >
            <h2>Manual Add Pattern</h2>
            {/* Manual Add Form */}
            <div>
              <label>Brand:</label>
              <input
                name="brand"
                value={manualPattern.brand}
                onChange={(e) =>
                  setManualPattern({ ...manualPattern, brand: e.target.value })
                }
                style={{
                  width: "100%",
                  backgroundColor: "#fff",
                  color: "#000",
                  padding: "5px",
                  marginTop: "5px"
                }}
              />
            </div>
            {Object.keys(manualPattern)
              .filter((key) => key !== "brand")
              .map((key) => (
                <div key={key} style={{ marginTop: "10px" }}>
                  <label style={{ textTransform: "capitalize" }}>
                    {formatLabel(key)}:
                  </label>
                  <input
                    name={key}
                    value={manualPattern[key]}
                    onChange={(e) =>
                      setManualPattern({
                        ...manualPattern,
                        [e.target.name]: e.target.value
                      })
                    }
                    style={{
                      width: "100%",
                      backgroundColor: "#fff",
                      color: "#000",
                      padding: "5px",
                      marginTop: "5px"
                    }}
                  />
                </div>
              ))}
            {/* Image file upload field */}
            <div style={{ marginTop: "10px" }}>
              <label>Upload Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setManualImageFile(e.target.files[0])}
                style={{
                  width: "100%",
                  backgroundColor: "#fff",
                  color: "#000",
                  padding: "5px",
                  marginTop: "5px"
                }}
              />
            </div>
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button onClick={() => setShowManualAdd(false)} style={{ marginRight: "10px" }}>
                Cancel
              </button>
              <button onClick={handleManualAddSubmit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;