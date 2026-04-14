"""
PDF text extraction using PyMuPDF.
"""
import re
import fitz  # PyMuPDF
import logging

logger = logging.getLogger(__name__)


def _normalize_text(text: str) -> str:
    """Clean raw PDF text for reliable downstream LLM parsing."""
    # Em-dash and en-dash → hyphen
    text = text.replace('\u2014', '-').replace('\u2013', '-')
    # Smart quotes → straight
    text = text.replace('\u201c', '"').replace('\u201d', '"')
    text = text.replace('\u2018', "'").replace('\u2019', "'")
    # Common ligatures → expanded
    for lig, rep in [('\ufb01', 'fi'), ('\ufb02', 'fl'), ('\ufb00', 'ff'),
                     ('\ufb03', 'ffi'), ('\ufb04', 'ffl')]:
        text = text.replace(lig, rep)
    # Strip non-printable control characters (keep tabs, newlines, spaces)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    # Collapse runs of 3+ blank lines to 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def extract_text(pdf_bytes: bytes) -> str:
    """Extract all text from a PDF given its raw bytes."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pages = [page.get_text() for page in doc]
        doc.close()
        text = "\n\n".join(pages).strip()
        text = _normalize_text(text)
        logger.info(f"Extracted {len(text)} characters from PDF ({len(pages)} pages)")
        return text
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise ValueError(f"Could not extract text from PDF: {e}")
