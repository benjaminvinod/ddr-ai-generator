import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import "./index.css";

function ReportRenderer({ text }) {
  const lines = text.split("\n");

  const headings = [
    "Property Issue Summary",
    "Area-wise Observations",
    "Probable Root Cause",
    "Severity Assessment",
    "Recommended Actions",
    "Additional Notes",
    "Missing or Unclear Information"
  ];

  return (
    <div className="report-body">
      {lines.map((raw, i) => {
        let line = raw.trim();

        if (!line) {
          return <div key={i} className="report-space"></div>;
        }

        // Remove markdown **
        line = line.replace(/\*\*/g, "");

        // Section headings
        if (headings.includes(line)) {
          return (
            <h2 key={i} className="report-h2">
              {line}
            </h2>
          );
        }

        // Numbered points
        if (/^\d+\./.test(line)) {
          return (
            <p key={i} className="report-p">
              {line}
            </p>
          );
        }

        // Bullet points
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <li key={i} className="report-li">
              {line.replace(/^[-•]\s/, "")}
            </li>
          );
        }

        return (
          <p key={i} className="report-p">
            {line}
          </p>
        );
      })}
    </div>
  );
}

function UploadCard({ label, file, onSelect }) {
  const inputRef = useRef();

  return (
    <div
      className={`upload-card ${file ? "upload-active" : ""}`}
      onClick={() => inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files[0]) onSelect(e.target.files[0]);
        }}
      />

      {!file ? (
        <>
          <div className="upload-icon">📄</div>
          <div className="upload-title">{label}</div>
          <div className="upload-sub">Click to upload PDF</div>
        </>
      ) : (
        <>
          <div className="upload-icon">✅</div>
          <div className="upload-title">{file.name}</div>
          <div className="upload-sub">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </div>
        </>
      )}
    </div>
  );
}

function App() {
  const [inspection, setInspection] = useState(null);
  const [thermal, setThermal] = useState(null);

  const [report, setReport] = useState("");
  const [images, setImages] = useState([]);
  const [meta, setMeta] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!inspection || !thermal) {
      setError("Please upload both PDFs.");
      return;
    }

    setLoading(true);
    setError("");
    setReport("");
    setImages([]);
    setMeta(null);

    const form = new FormData();
    form.append("inspection", inspection);
    form.append("thermal", thermal);

    try {
      const res = await fetch("http://127.0.0.1:5000/generate", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Server error.");
        return;
      }

      if (data.report && data.report.startsWith("ERROR:")) {
        setError(data.report);
        return;
      }

      setReport(data.report || "");
      setImages(data.images || []);
      setMeta(data.meta || null);
    } catch (err) {
      setError("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    const doc = new jsPDF("p", "mm", "a4");

    const pageW = 210;
    let y = 20;

    // Header
    doc.setFillColor(18, 24, 38);
    doc.rect(0, 0, pageW, 45, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Detailed Diagnostic Report", 15, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("AI DDR Generator", 15, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 37);

    y = 58;
    doc.setTextColor(0, 0, 0);

    const lines = report.split("\n");

    for (let raw of lines) {
      let line = raw.trim();

      if (y > 275) {
        doc.addPage();
        y = 20;
      }

      line = line.replace(/\*\*/g, "");

      if (
        line.includes("Property Issue Summary") ||
        line.includes("Area-wise Observations") ||
        line.includes("Probable Root Cause") ||
        line.includes("Severity Assessment") ||
        line.includes("Recommended Actions") ||
        line.includes("Additional Notes") ||
        line.includes("Missing or Unclear Information")
      ) {
        y += 5;
        doc.setDrawColor(220);
        doc.line(15, y, 195, y);

        y += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.text(line, 15, y);
        y += 8;
        continue;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);

      const wrapped = doc.splitTextToSize(line, 180);
      doc.text(wrapped, 15, y);

      y += wrapped.length * 5 + 2;
    }

    const inspectionImgs = images.filter(
      (img) => img.source === "inspection"
    );

    const thermalImgs = images.filter(
      (img) => img.source === "thermal"
    );

    const addImagePage = async (title, list) => {
      if (list.length === 0) return;

      doc.addPage();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(title, 15, 18);

      let x = 15;
      let yImg = 28;
      let count = 0;

      for (const img of list) {
        if (yImg > 240) {
          doc.addPage();

          doc.setFont("helvetica", "bold");
          doc.setFontSize(18);
          doc.text(title + " (cont.)", 15, 18);

          x = 15;
          yImg = 28;
        }

        try {
          const url = `http://127.0.0.1:5000/images/${img.filename}`;
          const res = await fetch(url);
          const blob = await res.blob();

          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });

          doc.addImage(dataUrl, "PNG", x, yImg, 80, 55);

          x += 90;
          count++;

          if (count % 2 === 0) {
            x = 15;
            yImg += 65;
          }

        } catch {}
      }
    };

    await addImagePage("Inspection Source Images", inspectionImgs);
    await addImagePage("Thermal Source Images", thermalImgs);

    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Page ${i} of ${totalPages}`, 170, 290);
    }

    doc.save("DDR_Report.pdf");
  };

  const inspectionImages = images.filter(
    (img) => img.source === "inspection"
  );

  const thermalImages = images.filter(
    (img) => img.source === "thermal"
  );

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">🏢 AI DDR Generator</div>
        <div className="status">● Online</div>
      </header>

      <div className="container">
        <div className="hero">
          <h1>Detailed Diagnostic Report Automation</h1>
          <p>
            Upload inspection and thermal PDFs to generate a
            professional client-ready DDR report.
          </p>
        </div>

        <div className="upload-grid">
          <UploadCard
            label="Inspection Report"
            file={inspection}
            onSelect={setInspection}
          />

          <UploadCard
            label="Thermal Report"
            file={thermal}
            onSelect={setThermal}
          />
        </div>

        {error && <div className="error-box">{error}</div>}

        <button
          className="primary-btn"
          onClick={generate}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate DDR"}
        </button>

        {meta && (
          <div className="meta-bar">
            <span>{meta.inspection_chars} chars inspection</span>
            <span>{meta.thermal_chars} chars thermal</span>
            <span>{meta.total_images} images extracted</span>
          </div>
        )}

        {report && (
          <>
            <div className="section-head">
              <h2>Generated DDR Report</h2>

              <button
                className="secondary-btn"
                onClick={exportPDF}
              >
                Download PDF
              </button>
            </div>

            <div className="report-card">
              <ReportRenderer text={report} />
            </div>

            {inspectionImages.length > 0 && (
              <>
                <h2 className="gallery-title">
                  Inspection Source Images
                </h2>

                <div className="img-grid">
                  {inspectionImages.map((img, i) => (
                    <div className="img-card" key={i}>
                      <img
                        src={`http://127.0.0.1:5000/images/${img.filename}`}
                        alt=""
                      />
                      <div className="img-caption">
                        Inspection {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {thermalImages.length > 0 && (
              <>
                <h2 className="gallery-title">
                  Thermal Source Images
                </h2>

                <div className="img-grid">
                  {thermalImages.map((img, i) => (
                    <div className="img-card" key={i}>
                      <img
                        src={`http://127.0.0.1:5000/images/${img.filename}`}
                        alt=""
                      />
                      <div className="img-caption">
                        Thermal {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;