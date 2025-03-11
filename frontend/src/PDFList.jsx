import { useState, useEffect } from 'react';

function PDFList() {
  const [pdfs, setPdfs] = useState([]);
  const API_BASE_URL = "http://192.168.14.45:5000";

  useEffect(() => {
    fetch(`${API_BASE_URL}/pattern_pdfs`)
      .then((res) => res.json())
      .then((data) => setPdfs(data))
      .catch((err) => console.error("Error fetching PDFs:", err));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>PDF Files</h2>
      {pdfs.length === 0 ? (
        <p>No PDF records available.</p>
      ) : (
        <ul>
          {pdfs.map((pdf) => (
            <li key={pdf.id}>
              <strong>{pdf.category}</strong> {pdf.downloaded ? "(Downloaded)" : "(Fallback)"}:{" "}
              <a href={pdf.pdf_url} target="_blank" rel="noreferrer">View PDF</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PDFList;

