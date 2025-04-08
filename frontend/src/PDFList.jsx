import React, { useState, useEffect } from 'react';
import { useAuth } from './auth.jsx';

function PDFList({ API_BASE_URL }) {
  const { authFetch } = useAuth();
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPdfs, setTotalPdfs] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    console.log("PDFList component mounted, fetching PDFs");
    fetchPDFPage(1);
  }, []);

  // Function to fetch a specific page of PDFs
  const fetchPDFPage = (pageNum) => {
    setLoading(true);
    authFetch(`/api/pattern_pdfs?page=${pageNum}&per_page=20`)
      .then(res => {
        console.log("PDF API response status:", res.status);
        return res.json();
      })
      .then(data => {
        console.log("PDFs fetched successfully:", data);
        if (data.items && Array.isArray(data.items)) {
          // Append new PDFs to existing ones if not page 1
          if (pageNum === 1) {
            setPdfs(data.items);
          } else {
            setPdfs(prev => [...prev, ...data.items]);
          }
          setTotalPdfs(data.total);
          setHasMore(pageNum * data.per_page < data.total);
          setPage(pageNum);
        } else {
          throw new Error("Invalid response format");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading PDFs:", err);
        setError("Error loading PDFs: " + err.message);
        setLoading(false);
      });
  };

  // Load more PDFs
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPDFPage(page + 1);
    }
  };

  if (loading && pdfs.length === 0) {
    return <div className="lcars-panel">Loading PDFs...</div>;
  }

  if (error) {
    return <div className="lcars-panel error-panel">{error}</div>;
  }

  return (
    <div className="lcars-panel pdf-list">
      <h2>Pattern PDFs</h2>
      {pdfs.length === 0 ? (
        <p>No PDFs found.</p>
      ) : (
        <>
          <p>Showing {pdfs.length} of {totalPdfs} PDFs</p>
          <table className="lcars-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Pattern #</th>
                <th>Category</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {pdfs.map((pdf) => (
                <tr key={pdf.id}>
                  <td>{pdf.pattern_brand || 'Unknown'}</td>
                  <td>{pdf.pattern_number || 'Unknown'}</td>
                  <td>{pdf.category}</td>
                  <td>
                    <a
                      href={`${API_BASE_URL}${pdf.pdf_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {hasMore && (
            <div className="load-more">
              <button onClick={loadMore} disabled={loading}>
                {loading ? "Loading..." : "Load More PDFs"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PDFList;
