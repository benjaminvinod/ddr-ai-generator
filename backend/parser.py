import fitz
import os
import re


def clean_line(line):
    line = line.strip()
    line = re.sub(r'\s+', ' ', line)
    return line


def extract_text_from_pdf(file_path):
    doc = fitz.open(file_path)
    pages = []

    for page_num, page in enumerate(doc, start=1):
        lines = page.get_text().split("\n")
        cleaned = []

        for line in lines:
            line = clean_line(line)
            # Only skip truly empty or garbage lines (single chars, page numbers)
            if len(line) > 5:
                cleaned.append(line)

        if cleaned:
            pages.append(f"[Page {page_num}]\n" + "\n".join(cleaned))

    # Deduplicate lines while preserving order
    seen = set()
    final_pages = []
    for page_block in pages:
        deduped = []
        for line in page_block.split("\n"):
            if line not in seen:
                deduped.append(line)
                seen.add(line)
        final_pages.append("\n".join(deduped))

    full_text = "\n\n".join(final_pages)

    # Cap at ~6000 chars to stay within Ollama context window safely
    return full_text[:3800]


def extract_images_from_pdf(file_path, prefix):
    doc = fitz.open(file_path)
    folder = "extracted_images"
    os.makedirs(folder, exist_ok=True)

    saved = []

    for page_index in range(len(doc)):
        page = doc[page_index]
        images = page.get_images(full=True)

        for img_index, img in enumerate(images):
            xref = img[0]

            try:
                pix = fitz.Pixmap(doc, xref)

                if pix.n > 4:
                    pix = fitz.Pixmap(fitz.csRGB, pix)

                # Remove tiny icons / symbols
                if pix.width < 220 or pix.height < 180:
                    pix = None
                    continue

                # Remove square UI icons common in thermal PDFs
                ratio = pix.width / pix.height
                if 0.85 <= ratio <= 1.15 and pix.width < 350:
                    pix = None
                    continue

                filename = f"{prefix}_p{page_index+1}_{img_index+1}.png"
                path = os.path.join(folder, filename)

                pix.save(path)
                saved.append(filename)
                pix = None

            except:
                continue

    return saved[:10]
