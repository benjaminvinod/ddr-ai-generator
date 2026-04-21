from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

from parser import extract_text_from_pdf, extract_images_from_pdf
from ai import generate_ddr

app = Flask(__name__)
CORS(app)

UPLOAD = "uploads"
IMG = "extracted_images"

os.makedirs(UPLOAD, exist_ok=True)
os.makedirs(IMG, exist_ok=True)


@app.route("/generate", methods=["POST"])
def generate():

    # Validate both files are present
    if "inspection" not in request.files or "thermal" not in request.files:
        return jsonify({"error": "Both 'inspection' and 'thermal' PDF files are required."}), 400

    inspection = request.files["inspection"]
    thermal = request.files["thermal"]

    if inspection.filename == "" or thermal.filename == "":
        return jsonify({"error": "File names cannot be empty."}), 400

    ipath = os.path.join(UPLOAD, inspection.filename)
    tpath = os.path.join(UPLOAD, thermal.filename)

    inspection.save(ipath)
    thermal.save(tpath)

    # Extract text
    inspection_text = extract_text_from_pdf(ipath)
    thermal_text = extract_text_from_pdf(tpath)

    # Warn if extraction returned nothing useful
    if len(inspection_text.strip()) < 50:
        inspection_text = "No readable text could be extracted from the inspection PDF. It may be a scanned image."

    if len(thermal_text.strip()) < 50:
        thermal_text = "No readable text could be extracted from the thermal PDF. It may be a scanned image."

    # Extract images, tagged with source
    imgs_inspection = extract_images_from_pdf(ipath, "inspection")
    imgs_thermal = extract_images_from_pdf(tpath, "thermal")

    # Generate the report
    report = generate_ddr(inspection_text, thermal_text)

    # Return images with metadata so frontend knows their source
    image_data = (
        [{"filename": f, "source": "inspection"} for f in imgs_inspection] +
        [{"filename": f, "source": "thermal"} for f in imgs_thermal]
    )

    return jsonify({
        "report": report,
        "images": image_data,
        "meta": {
            "inspection_chars": len(inspection_text),
            "thermal_chars": len(thermal_text),
            "total_images": len(image_data)
        }
    })


@app.route("/images/<filename>")
def image(filename):
    return send_from_directory(IMG, filename)


if __name__ == "__main__":
    app.run(debug=True)
