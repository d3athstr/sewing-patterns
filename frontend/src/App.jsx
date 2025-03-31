import "./lcars.css";
import { useState, useEffect, useRef } from "react";
import PDFList from "./PDFList";
import { AuthProvider, useAuth } from './auth.jsx';
import LoginForm from './LoginForm.jsx';
import FilterPanel from './components/FilterPanel';
import AddPatternPanel from './components/AddPatternPanel';
import ManualAddForm from './components/ManualAddForm';
import PatternList from './components/PatternList';

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
  const { isAuthenticated, user, authFetch, API_BASE_URL, logout } = useAuth();

  // Helper to format labels: remove underscores and convert to Title Case.
  const formatLabel = (label) => {
    return label
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
      setLoading(true);
      setError(null);
      
      console.log("Fetching patterns...");
      authFetch('/api/patterns')
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("Patterns fetched successfully:", data);
          setPatterns(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching patterns:", err);
          setError("Failed to load patterns. Please try again later.");
          setLoading(false);
        });
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

  // Main authenticated UI
  return (
    <div className="lcars-container">
      <h1>Sewing Patterns Manager</h1>
      
      {user && (
        <div className="user-info">
          <p>Logged in as: {user.username}</p>
          <button onClick={logout}>Logout</button>
        </div>
      )}
      
      {/* Loading and Error States */}
      {loading && (
        <div className="lcars-panel loading-panel">
          <p>Loading patterns...</p>
        </div>
      )}
      
      {error && (
        <div className="lcars-panel error-panel">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
      
      {/* Add Pattern Panel */}
      <AddPatternPanel 
        BRANDS={BRANDS}
        newPattern={newPattern}
        setNewPattern={setNewPattern}
        handleScrapeAndAdd={handleScrapeAndAdd}
        showManualAdd={showManualAdd}
        setShowManualAdd={setShowManualAdd}
      />

      {/* Manual Add Form */}
      {showManualAdd && (
        <ManualAddForm 
          manualPattern={manualPattern}
          setManualPattern={setManualPattern}
          manualImageFile={manualImageFile}
          setManualImageFile={setManualImageFile}
          handleManualAddSubmit={handleManualAddSubmit}
        />
      )}

      {/* Filters */}
      <FilterPanel 
        filters={filters}
        handleFilterChange={handleFilterChange}
        clearFilters={clearFilters}
      />

      {/* Pattern List */}
      {!loading && !error && (
        <>
          {patterns.length === 0 ? (
            <div className="lcars-panel">
              <h2>No Patterns Found</h2>
              <p>There are no patterns in the database yet. Use the "Add Pattern" panel above to add some patterns.</p>
            </div>
          ) : (
            <PatternList 
              filteredPatterns={filteredPatterns}
              visibleCount={visibleCount}
              loadMoreRef={loadMoreRef}
              expandedPatternId={expandedPatternId}
              toggleExpand={toggleExpand}
              getImageInfo={getImageInfo}
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
          )}
        </>
      )}

      {/* PDF List Component */}
      <PDFList />
    </div>
  );
}

// Export the wrapped component
export default AppWithAuth;
