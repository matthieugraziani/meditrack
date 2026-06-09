"""
meditrack.ocr
~~~~~~~~~~~~~
Pipeline OCR pour la reconnaissance de médicaments sur ordonnances.

Usage::

    from meditrack.ocr import MedicamentMatcher, process_prescription

    matcher = MedicamentMatcher.from_db("bdpm-database/data/bdpm.db")
    results = process_prescription("ordonnance.jpg", matcher)
    for r in results:
        print(r.denomination, r.cis, r.confidence)
"""

from .matcher import MedicamentMatcher, MatchResult
from .pipeline import process_prescription

__all__ = ["MedicamentMatcher", "MatchResult", "process_prescription"]
