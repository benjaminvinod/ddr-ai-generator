# AI DDR Generator
### AI-Powered Detailed Diagnostic Report Automation for Civil Inspection Workflows

> Built for an Applied AI Builder assessment focused on solving a real business workflow using practical AI systems engineering.

---

## 📌 Executive Summary

AI DDR Generator is an end-to-end AI application that converts raw **Inspection Reports** and **Thermal Reports** into a professional, structured **Detailed Diagnostic Report (DDR)**.

Instead of manually reviewing technical site reports and preparing client deliverables, the system automates the workflow by:

- Reading two independent source reports
- Extracting textual findings and embedded images
- Merging observations logically
- Handling missing / conflicting data
- Generating a client-ready DDR
- Exporting a polished PDF report

This project demonstrates applied AI beyond prompting — combining document intelligence, local LLM orchestration, workflow automation, report generation, and engineering tradeoffs under real constraints.

---

## 🎯 Why This Problem Matters

In civil diagnostics, waterproofing inspections, structural maintenance, and property audits, engineers often work with fragmented inputs such as:

- Visual inspection notes
- Dampness / seepage findings
- Thermal camera reports
- Temperature observations
- Site photographs

Preparing final reports manually is often time-consuming, repetitive, inconsistent between engineers, difficult to scale, and error-prone when handling multiple observations. This project automates that process into a repeatable workflow.

---

## ✅ Solution Overview

The system accepts two source documents:

**Input 1 — Inspection Report PDF**
- Area-wise observations
- Cracks / dampness / seepage notes
- Visible defects
- Embedded photographs

**Input 2 — Thermal Report PDF**
- Temperature readings
- Thermal anomalies
- Infrared imagery
- Moisture / heat indicators

**Final Output — Detailed Diagnostic Report**

The AI system generates a structured DDR containing:

1. Property Issue Summary
2. Area-wise Observations
3. Probable Root Cause
4. Severity Assessment (with reasoning)
5. Recommended Actions
6. Additional Notes
7. Missing / Unclear Information

The report can also be exported as a professional PDF with supporting images.

---

## 🧠 AI Layer

**Model Used:** `llama3.1:latest`, served locally via [Ollama](https://ollama.com)

**Why a Local LLM?**

This project was completed without paid cloud API access. Using a local model enabled:

- Zero API cost
- Offline execution
- Privacy of uploaded reports
- Faster development iteration
- Demonstration of self-hosted AI workflows

**⚠️ Real Engineering Constraint Solved**

Running the model on consumer hardware introduced practical limits — large prompts or excessive extracted text can lead to slow inference, high memory usage, internal server errors, and response throttling.

**Mitigations implemented:**

- Text cleanup and duplicate removal
- Safe character limits on input
- Compact prompting strategy
- Controlled token generation
- Stable inference settings

This ensured consistent output under local constraints.

---

## 🧱 System Architecture

![System Architecture](architecture_diagram.png)

The solution uses a modular architecture with five distinct layers:

| Layer | Responsibility |
|---|---|
| **React Frontend** | File uploads, previews, report viewing, PDF export |
| **Flask Backend** | API management and processing orchestration |
| **Parser Layer** | Text and image extraction from PDFs |
| **AI Layer** | DDR generation via Ollama + Llama 3.1 |
| **Output Layer** | Structured report delivery with mapped evidence images |

---

## 🔄 Pipeline Flow

![Pipeline Flow](pipeline_flow_diagram.png)

The system follows a clear eight-step processing pipeline from raw inputs to final deliverable:

1. User uploads both PDFs via the frontend
2. Backend receives and parses the uploaded content
3. Text is extracted page-wise from each document
4. Images are extracted and filtered for relevance
5. Data is cleaned and prepared for the prompt
6. A structured prompt is generated and sent to the LLM
7. AI returns the structured DDR sections
8. Frontend renders the report; user exports as a polished PDF

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), CSS3, jsPDF |
| Backend | Python, Flask, PyMuPDF (fitz) |
| AI | Ollama, Llama 3.1 (local) |

---

## 🔍 Core Engineering Components

### 1. Document Parsing Engine

Extracts readable text from uploaded PDFs with:

- Page-wise extraction
- Whitespace cleanup
- Duplicate line removal
- Safe context truncation for LLM input quality

### 2. Image Extraction Pipeline

Extracts relevant embedded images from both source reports. Filters out tiny icons, decorative graphics, duplicate assets, UI overlays, and unrelated shapes — retaining only useful evidence images.

### 3. AI Report Generation Engine

The structured prompt instructs the model to:

- Use only facts present in the source documents
- Avoid invented or hallucinated claims
- Explicitly flag conflicting information
- Clearly note missing data
- Use client-friendly language
- Return all required DDR sections

### 4. Reliability Controls

The application prioritizes stable real-world behavior through conservative inference settings, controlled output length, and truncated input size. Fallback wording includes:

- `Further inspection recommended`
- `Not Available`
- `Conflicting findings detected`

### 5. Report Delivery Layer

Users receive two output formats:

- **On-Screen Report** — readable structured DDR rendered in the browser
- **Downloadable PDF** — includes cover page, styled sections, full findings, source images, and page numbering

---

## 🖼️ Image Placement Logic

Images are mapped to their relevant report sections using a deterministic heuristic approach:

- Hall observations → related hall images
- Bathroom findings → related bathroom images
- Thermal evidence → thermal image blocks

Where a relevant image is unavailable, the section notes: `Relevant image not available`.

---

## 🧪 Validation & Testing

The system was tested using provided sample reports across the following scenarios:

- ✅ Successful dual PDF upload
- ✅ Missing file handling
- ✅ AI generation success
- ✅ Large input stability
- ✅ Image extraction correctness
- ✅ PDF export correctness
- ✅ Backend connectivity handling

---

## 📈 Design Decisions & Tradeoffs

**Why not OCR?**
The provided files were machine-readable PDFs, so direct parsing was faster and more accurate. OCR would be added for scanned reports in a production build.

**Why not GPT / Claude APIs?**
Local LLM usage demonstrated stronger engineering ownership under zero-budget constraints.

**Why character limits on input?**
To keep inference stable and predictable on consumer-grade local hardware.

**Why heuristic image mapping?**
Full semantic image-to-room matching would require additional AI vision infrastructure. For a 24-hour assignment, a practical deterministic mapping approach was the right tradeoff.

---

## 🚀 Future Improvements

**AI**
- Better thermal anomaly reasoning
- Human review / correction mode
- Fine-tuned domain-specific model

**Document Intelligence**
- OCR support for scanned PDFs
- Table extraction
- Handwritten note parsing

**Product**
- Multi-property batch uploads
- Client-facing dashboard
- Cloud deployment
- Report version history

---

## 📂 Project Structure

```
ddr-ai-generator/
├── backend/
│   ├── app.py
│   ├── ai.py
│   └── parser.py
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── index.css
├── uploads/
├── extracted_images/
├── architecture_diagram.png
├── pipeline_flow_diagram.png
└── README.md
```

---

## ⚙️ How to Run Locally

**1. Start Ollama**
```bash
ollama run llama3.1:latest
```

**2. Start Backend**
```bash
cd backend
python app.py
```

**3. Start Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## 🎥 Demo

This project demonstrates:

- Applied AI system design
- Workflow automation thinking
- Practical constraint handling
- Full-stack implementation
- Real deliverable generation


