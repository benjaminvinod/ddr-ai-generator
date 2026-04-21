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

            # Skip empty / garbage / tiny fragments
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

    # Cap to stay stable for Ollama context size
    return full_text[:3200]


def extract_images_from_pdf(file_path, prefix):
    doc = fitz.open(file_path)
    folder = "extracted_images"
    os.makedirs(folder, exist_ok=True)

    saved = []
    seen_sizes = set()

    for page_index in range(len(doc)):
        page = doc[page_index]
        images = page.get_images(full=True)

        for img_index, img in enumerate(images):
            xref = img[0]

            try:
                pix = fitz.Pixmap(doc, xref)

                if pix.n > 4:
                    pix = fitz.Pixmap(fitz.csRGB, pix)

                width = pix.width
                height = pix.height
                ratio = width / height if height else 1

                # Remove tiny icons / controls / symbols
                if width < 220 or height < 180:
                    pix = None
                    continue

                # Remove small square UI icons common in thermal PDFs
                if 0.85 <= ratio <= 1.15 and width < 350:
                    pix = None
                    continue

                # Remove extreme banner / strip shapes
                if ratio > 4 or ratio < 0.25:
                    pix = None
                    continue

                # Remove near-duplicate same-size repetitive assets
                size_key = (width, height)
                if size_key in seen_sizes and width < 500:
                    pix = None
                    continue

                seen_sizes.add(size_key)

                filename = f"{prefix}_p{page_index+1}_{img_index+1}.png"
                path = os.path.join(folder, filename)

                pix.save(path)
                saved.append(filename)
                pix = None

            except:
                continue

    # Return max 10 best images to keep UI clean
    return saved[:10]