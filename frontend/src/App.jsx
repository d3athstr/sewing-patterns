import "./lcars.css";
import { useState, useEffect, useRef } from "react";
import PDFList from "./PDFList";
import { AuthProvider, useAuth } from './auth';
import LoginForm from './LoginForm';

// Helper: Converts URLs in a text string into clickable links.
const linkify = (text) => {
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

// Main App component wrapped with AuthProvider
function AppWithAuth() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// Main application content
function AppContent() {
  const BRANDS = [
    "Butterick",
    "Vogue",
    "Simplicity",
    "McCall's",
    "Know Me",
    "New Look",
    "Burda"
  ];
  
  // Use auth context instead of hardcoded API URL
  const { isAuthenticated, user, authFetch, API_BASE_URL } = useAuth();

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
  
  // New state for lazy loading: how many patterns to show
  const [visibleCount, setVisibleCount] = useState(30);
  const loadMoreRef = useRef(null);

  // Apply filters and sorting
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

  // Fetch patterns when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      authFetch('/api/patterns')
        .then((res) => res.json())
        .then((data) => setPatterns(data))
        .catch((err) => console.error("Error fetching data:", err));
    }
  }, [isAuthenticated, authFetch]);

  // Set up the IntersectionObserver for lazy loading
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // When the sentinel element is in view, increase the visible count
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((prev) => prev + 30);
          }
        });
      },
      { rootMargin: "100px" }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [filteredPatterns.length]);

  // Helper: returns image info from the backend
  const getImageInfo = (pattern) => {
    return {
      src: pattern.image_url,
      downloaded: pattern.downloaded,
    };
  };

  // Function to handle PDF file upload (updated to use authFetch)
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
    
    authFetch(`/api/patterns/${patternId}/pdfs`, {
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

  // Updated to use authFetch
  const handleScrapeAndAdd = () => {
    authFetch(`/api/scrape?brand=${newPattern.brand}&pattern_number=${newPattern.pattern_number}`)
      .then((res) => res.json())
      .then((scrapedData) => {
        console.log("✅ Raw Scraped Response:", scrapedData);
        if (!scrapedData.brand || !scrapedData.pattern_number) {
          throw new Error("❌ Scraped data is incomplete.");
        }
        
        return authFetch('/api/patterns')
          .then((res) => res.json())
          .then((patterns) => {
            const existingPattern = patterns.find(
              (p) => p.brand === scrapedData.brand && p.pattern_number === scrapedData.pattern_number
            );
            
            const url = existingPattern 
              ? `/api/patterns/${existingPattern.id}`
              : `/api/patterns`;
              
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
            
            return authFetch(url, {
              method,
              headers: {
                "Content-Type": "application/json"
              },
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

  // Updated to use authFetch
  const handleManualAddSubmit = () => {
    // Basic validation: ensure required fields are present.
    if (!manualPattern.brand || !manualPattern.pattern_number) {
      alert("Brand and Pattern Number are required.");
      return;
    }

    // Create FormData to include the image file
    const formData = new FormData();
    for (const key in manualPattern) {
      formData.append(key, manualPattern[key]);
    }
    if (manualImageFile) {
      formData.append("image", manualImageFile);
    }

    authFetch(`/api/patterns`, {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server error: ${res.statusText}`);
        }
        return res.json();
      })
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
      .catch((err) => {
        console.error("Error adding manual pattern:", err);
        alert("Failed to add pattern: " + err.message);
      });
  };

  // Updated: Remove non-editable properties before editing
  const handleEdit = (pattern, e) => {
    if (e) e.stopPropagation();
    
    // Exclude properties that should not be edited
    const { pdf_files, downloaded, image_url, ...editablePattern } = pattern;
    
    setEditingPatternId(pattern.id);
    setEditedPattern(editablePattern);
    setExpandedPatternId(pattern.id);
  };

  const handleEditChange = (e) => {
    e.stopPropagation();
    setEditedPattern({
      ...editedPattern,
      [e.target.name]: e.target.value
    });
  };

  // Updated to use authFetch
  const handleEditSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    authFetch(`/api/patterns/${editingPatternId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(editedPattern)
    })
      .then((res) => res.json())
      .then((updatedPattern) => {
        setPatterns((prev) =>
          prev.map((p) => (p.id === updatedPattern.id ? updatedPattern : p))
        );
        setEditingPatternId(null);
        setEditedPattern({});
      })
      .catch((err) => console.error("Error updating pattern:", err));
  };

  // Updated to use authFetch
  const handleDelete = (patternId, e) => {
    e.stopPropagation();
    
    if (window.confirm("Are you sure you want to delete this pattern?")) {
      authFetch(`/api/patterns/${patternId}`, {
        method: "DELETE"
      })
        .then(() => {
          setPatterns((prev) => prev.filter((p) => p.id !== patternId));
          if (expandedPatternId === patternId) {
            setExpandedPatternId(null);
          }
        })
        .catch((err) => console.error("Error deleting pattern:", err));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value.toLowerCase()
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const toggleExpand = (patternId) => {
    setExpandedPatternId((prev) => (prev === patternId ? null : patternId));
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div className="lcars-container">
        <h1>Sewing Patterns Manager</h1>
        <LoginForm />
      </div>
    );
  }

  // Rest of the component remains largely the same, just using authFetch instead of fetch
  return (
    <div className="lcars-container">
      <h1>Sewing Patterns Manager</h1>
      
      {user && (
        <div className="user-info">
          <p>Logged in as: {user.username}</p>
          <button onClick={() => useAuth().logout()}>Logout</button>
        </div>
      )}
      
      {/* Rest of your existing UI components */}
      {/* ... */}
      
      {/* Scrape and Add Form */}
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

      {/* Manual Add Form */}
      {showManualAdd && (
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
        
(Content truncated due to size limit. Use line ranges to read in chunks)