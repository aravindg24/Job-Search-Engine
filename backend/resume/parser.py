"""
PDF text extraction using PyMuPDF.
"""
import fitz  # PyMuPDF
import logging

logger = logging.getLogger(__name__)


def extract_text(pdf_bytes: bytes) -> str:
    """Extract all text from a PDF given its raw bytes."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pages = [page.get_text() for page in doc]
        doc.close()
        text = "\n\n".join(pages).strip()
        logger.info(f"Extracted {len(text)} characters from PDF ({len(pages)} pages)")
        return text
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise ValueError(f"Could not extract text from PDF: {e}")
