import React from 'react';

// PDFList component with fixed URL handling
function PDFList({ API_BASE_URL }) {
  const [pdfs, setPdfs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    console.log("PDFList component mounted, fetching PDFs");
    
    // Fetch PDFs from the server with proper URL
    fetch(`${API_BASE_URL}/pattern_pdfs`)
      .then(response => {
        console.log("PDF fetch response status:", response.status);
        if (!response.ok) {
          if (response.status === 404) {
            console.log("No PDFs found (404 response)");
            setPdfs([]);
            setLoading(false);
            return [];
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("PDFs data received:", data);
        // Ensure data is always treated as an array
        const safeData = Array.isArray(data) ? data : [];
        setPdfs(safeData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching PDFs:", err);
        setError(err.message);
        setLoading(false);
        // Initialize as empty array on error
        setPdfs([]);
      });
  }, [API_BASE_URL]);

  // If loading, show loading message
  if (loading) {
    return <div className="lcars-panel">Loading PDF list...</div>;
  }

  // If error, show error message
  if (error) {
    return <div className="lcars-panel error">Error loading PDFs: {error}</div>;
  }

  // Ensure pdfs is always treated as an array
  const safePdfs = Array.isArray(pdfs) ? pdfs : [];

  // If no PDFs, show message
  if (safePdfs.length === 0) {
    return <div className="lcars-panel">No PDFs available</div>;
  }

  // Render PDF list
  return (
    <div className="lcars-panel pdf-list-container">
      <h2>All Pattern PDFs</h2>
      <ul className="pdf-list">
        {safePdfs.map((pdf) => (
          <li key={pdf.id || `pdf-${Math.random()}`}>
            <a 
              // Fix PDF URL by ensuring it has the correct base URL
              href={pdf.url && pdf.url.startsWith('http') 
                ? pdf.url 
                : `${API_BASE_URL}${pdf.url || `/api/patterns/${pdf.pattern_id}/pdfs/${pdf.id}`}`}
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => console.log("Opening PDF:", pdf.url)}
            >
              {pdf.pattern_brand} {pdf.pattern_number} - {pdf.category || "Document"}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PDFList;
