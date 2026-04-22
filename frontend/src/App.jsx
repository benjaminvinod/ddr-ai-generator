import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import "./index.css";

/* ─── REPORT RENDERER ────────────────────────────────────────── */
function ReportRenderer({ text }) {
  const lines = text.split("\n");

  const headings = [
    "Property Issue Summary",
    "Area-wise Observations",
    "Probable Root Cause",
    "Severity Assessment",
    "Recommended Actions",
    "Additional Notes",
    "Missing or Unclear Information",
  ];

  return (
    <div className="report-body">
      {lines.map((raw, i) => {
        let line = raw.trim();

        line = line.replace(/^##\s*/, "");
        line = line.replace(/^###\s*/, "");
        line = line.replace(/^#\s*/, "");
        if (!line) return <div key={i} className="report-space" />;

        line = line.replace(/\*\*/g, "");

        if (headings.includes(line)) {
          return (
            <h2 key={i} className="report-h2">
              {line}
            </h2>
          );
        }

        if (/^\d+\./.test(line)) {
          return (
            <p key={i} className="report-p">
              {line}
            </p>
          );
        }

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

/* ─── SECTION IMAGE MAPPING ──────────────────────────────────── */
function MappedSectionImages({ title, images }) {
  if (!images.length) {
    return (
      <div className="mapped-empty">
        Relevant image not available.
      </div>
    );
  }

  return (
    <div className="mapped-img-grid">
      {images.slice(0, 2).map((img, i) => (
        <div className="mapped-img-card" key={i}>
          <img
            src={`http://127.0.0.1:5000/images/${img.filename}`}
            alt={title}
          />
          <div className="mapped-caption">{title}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── UPLOAD CARD ────────────────────────────────────────────── */
function UploadCard({ label, badge, icon, file, onSelect }) {
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

      <div className="upload-type-badge">{badge}</div>

      <div className="upload-icon-wrap">
        {file ? "✓" : icon}
      </div>

      {!file ? (
        <>
          <div className="upload-title">{label}</div>
          <div className="upload-sub">Click to upload PDF</div>
        </>
      ) : (
        <>
          <div className="upload-title">{file.name}</div>
          <div className="upload-sub">
            {(file.size / 1024 / 1024).toFixed(2)} MB · Ready
          </div>
        </>
      )}
    </div>
  );
}

/* ─── STEP INDICATOR ─────────────────────────────────────────── */
function Steps({ step }) {
  const items = [
    { n: "01", label: "Upload" },
    { n: "02", label: "Process" },
    { n: "03", label: "Report" },
  ];

  return (
    <div className="steps">
      {items.map((s, i) => {
        const state =
          step > i ? "done" : step === i ? "active" : "";
        return (
          <div key={i} className={`step ${state}`}>
            <div className="step-num">
              {step > i ? "✓" : s.n}
            </div>
            <div className="step-label">{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── MAIN APP ───────────────────────────────────────────────── */
export default function App() {
  const [inspection, setInspection] = useState(null);
  const [thermal, setThermal] = useState(null);
  const [report, setReport] = useState("");
  const [images, setImages] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentStep = report ? 2 : loading ? 1 : 0;

  const generate = async () => {
    if (!inspection || !thermal) {
      setError("Please upload both PDF documents to proceed.");
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
        setError(data.error || "Server returned an error.");
        return;
      }

      if (data.report?.startsWith("ERROR:")) {
        setError(data.report);
        return;
      }

      setReport(data.report || "");
      setImages(data.images || []);
      setMeta(data.meta || null);
    } catch {
      setError(
        "Cannot connect to backend. Make sure the server is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageW = 210;
    let y = 20;

    doc.setFillColor(11, 13, 17);
    doc.rect(0, 0, pageW, 50, "F");
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 0, 4, 50, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Detailed Diagnostic Report", 15, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("AI DDR Generator  ·  UrbanRoof", 15, 32);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 40);

    y = 62;
    doc.setTextColor(0, 0, 0);

    const lines = report.split("\n");

    for (let raw of lines) {
      let line = raw.trim();

      line = line.replace(/^##\s*/, "");
      line = line.replace(/^###\s*/, "");
      line = line.replace(/^#\s*/, "");

      if (y > 275) {
        doc.addPage();
        y = 20;
      }

      line = line.replace(/\*\*/g, "");

      const isHeading = [
        "Property Issue Summary",
        "Area-wise Observations",
        "Probable Root Cause",
        "Severity Assessment",
        "Recommended Actions",
        "Additional Notes",
        "Missing or Unclear Information",
      ].includes(line);

      if (isHeading) {
        y += 6;
        doc.setFillColor(245, 158, 11);
        doc.rect(15, y, 3, 12, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(30, 30, 30);
        doc.text(line, 22, y + 8);

        y += 18;
        doc.setDrawColor(230, 230, 230);
        doc.line(15, y, 195, y);
        y += 6;
        continue;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(70, 70, 70);

      const wrapped = doc.splitTextToSize(line, 175);
      doc.text(wrapped, 18, y);
      y += wrapped.length * 5.5 + 1;
    }

    const addImgPage = async (title, list) => {
      doc.addPage();

      doc.setFillColor(11, 13, 17);
      doc.rect(0, 0, 210, 30, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(title, 15, 20);

      if (!list.length) {
        doc.setTextColor(90, 90, 90);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text("Relevant image not available.", 15, 45);
        return;
      }

      let x = 15;
      let yImg = 38;
      let count = 0;

      for (const img of list) {
        if (yImg > 240) {
          doc.addPage();

          doc.setFillColor(11, 13, 17);
          doc.rect(0, 0, 210, 30, "F");

          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.text(title + " (cont.)", 15, 20);

          x = 15;
          yImg = 38;
        }

        try {
          const r = await fetch(
            `http://127.0.0.1:5000/images/${img.filename}`
          );
          const blob = await r.blob();

          const dataUrl = await new Promise((res) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result);
            reader.readAsDataURL(blob);
          });

          doc.addImage(dataUrl, "PNG", x, yImg, 85, 58);

          x += 95;
          count++;

          if (count % 2 === 0) {
            x = 15;
            yImg += 68;
          }
        } catch {}
      }
    };

    await addImgPage(
      "Inspection Images",
      images.filter((i) => i.source === "inspection")
    );

    await addImgPage(
      "Thermal Images",
      images.filter((i) => i.source === "thermal")
    );

    const total = doc.getNumberOfPages();

    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160);
      doc.text(`${i} / ${total}`, 197, 290, {
        align: "right",
      });
    }

    doc.save("DDR_Report.pdf");
  };

  const inspectionImages = images.filter(
    (i) => i.source === "inspection"
  );

  const thermalImages = images.filter(
    (i) => i.source === "thermal"
  );

  const hallImgs = inspectionImages.slice(0, 2);
  const bathImgs = inspectionImages.slice(2, 4);
  const bedroomImgs = inspectionImages.slice(4, 6);
  const kitchenImgs = inspectionImages.slice(6, 8);
  const thermalMapped = thermalImages.slice(0, 2);

  return (
    <div className="page">
      <div className="ambient ambient-1" />
      <div className="ambient ambient-2" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">🏢</div>
          AI<span>&nbsp;DDR</span>&nbsp;Generator
        </div>
        <div className="status">SYSTEM ONLINE</div>
      </header>

      <div className="container">
        <div className="hero fade-up fade-up-1">
          <div className="hero-label">
            Structural Diagnostics AI
          </div>

          <h1>
            Detailed Diagnostic
            <br />
            <em>Report Automation</em>
          </h1>

          <p>
            Upload your inspection and thermal PDF
            documents. The AI extracts observations,
            merges findings, and generates a professional
            client-ready DDR in seconds.
          </p>
        </div>

        <div className="fade-up fade-up-2">
          <Steps step={currentStep} />
        </div>

        <div className="upload-grid fade-up fade-up-3">
          <UploadCard
            label="Inspection Report"
            badge="DOC · 01"
            icon="📋"
            file={inspection}
            onSelect={setInspection}
          />

          <UploadCard
            label="Thermal Report"
            badge="DOC · 02"
            icon="🌡️"
            file={thermal}
            onSelect={setThermal}
          />
        </div>

        <p className="upload-hint fade-up fade-up-3">
          Accepts PDF format · Max recommended size
          50 MB per file
        </p>

        {error && (
          <div className="error-box fade-up">
            {error}
          </div>
        )}

        <button
          className="primary-btn fade-up fade-up-4"
          onClick={generate}
          disabled={loading}
          style={{ marginBottom: "8px" }}
        >
          {loading ? (
            <>
              <span style={{ opacity: 0.7 }}>⚙</span>
              Analysing Documents…
            </>
          ) : (
            <>
              <span>▶</span>
              Generate DDR Report
            </>
          )}
        </button>

        {loading && (
          <div className="fade-up">
            <div className="loading-bar">
              <div className="loading-bar-inner" />
            </div>

            <div className="loading-status">
              EXTRACTING · MERGING · STRUCTURING…
            </div>
          </div>
        )}

        {meta && (
          <div className="meta-bar fade-up">
            <div className="meta-chip">
              <span>≈</span>
              {meta.inspection_chars.toLocaleString()} chars
              from inspection
            </div>

            <div className="meta-chip">
              <span>≈</span>
              {meta.thermal_chars.toLocaleString()} chars
              from thermal
            </div>

            <div className="meta-chip">
              <span>⬡</span>
              {meta.total_images} images extracted
            </div>
          </div>
        )}

        {report && (
          <div className="fade-up">
            <div className="divider" />

            <div className="section-head">
              <h2>Generated DDR Report</h2>

              <button
                className="secondary-btn"
                onClick={exportPDF}
              >
                ↓ Export PDF
              </button>
            </div>

            <div className="report-card">
              <div className="report-card-header">
                <div className="report-card-header-dot red" />
                <div className="report-card-header-dot amber" />
                <div className="report-card-header-dot green" />

                <div className="report-card-title">
                  DDR_REPORT.TXT — READ ONLY
                </div>

                <div
                  style={{
                    fontFamily:
                      "var(--font-mono)",
                    fontSize: "10px",
                    color:
                      "var(--green-ok)",
                    letterSpacing:
                      "0.06em",
                  }}
                >
                  ● COMPLETE
                </div>
              </div>

              <ReportRenderer text={report} />

              <div className="mapped-sections">
                <h3 className="gallery-title">
                  Relevant Section Images
                </h3>

                <div className="mapped-block">
                  <h4>Hall</h4>
                  <MappedSectionImages
                    title="Hall"
                    images={hallImgs}
                  />
                </div>

                <div className="mapped-block">
                  <h4>Common Bathroom</h4>
                  <MappedSectionImages
                    title="Common Bathroom"
                    images={bathImgs}
                  />
                </div>

                <div className="mapped-block">
                  <h4>Master Bedroom</h4>
                  <MappedSectionImages
                    title="Master Bedroom"
                    images={bedroomImgs}
                  />
                </div>

                <div className="mapped-block">
                  <h4>Kitchen</h4>
                  <MappedSectionImages
                    title="Kitchen"
                    images={kitchenImgs}
                  />
                </div>

                <div className="mapped-block">
                  <h4>Thermal Evidence</h4>
                  <MappedSectionImages
                    title="Thermal"
                    images={thermalMapped}
                  />
                </div>
              </div>
            </div>

            {inspectionImages.length > 0 && (
              <>
                <h2 className="gallery-title">
                  Inspection Images
                </h2>

                <div className="img-grid">
                  {inspectionImages.map(
                    (img, i) => (
                      <div
                        className="img-card"
                        key={i}
                      >
                        <img
                          src={`http://127.0.0.1:5000/images/${img.filename}`}
                          alt={`Inspection ${i + 1}`}
                        />

                        <div className="img-caption">
                          INS_
                          {String(
                            i + 1
                          ).padStart(
                            3,
                            "0"
                          )}

                          <span className="img-type">
                            Inspection
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            )}

            {thermalImages.length > 0 && (
              <>
                <h2 className="gallery-title">
                  Thermal Images
                </h2>

                <div className="img-grid">
                  {thermalImages.map(
                    (img, i) => (
                      <div
                        className="img-card"
                        key={i}
                      >
                        <img
                          src={`http://127.0.0.1:5000/images/${img.filename}`}
                          alt={`Thermal ${i + 1}`}
                        />

                        <div className="img-caption">
                          THR_
                          {String(
                            i + 1
                          ).padStart(
                            3,
                            "0"
                          )}

                          <span className="img-type">
                            Thermal
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            )}

            <div className="footer-strip">
              <span>
                AI DDR Generator · UrbanRoof
              </span>

              <span>
                Generated{" "}
                {new Date().toLocaleDateString(
                  "en-IN"
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}