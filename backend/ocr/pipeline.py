"""
meditrack.ocr.pipeline
~~~~~~~~~~~~~~~~~~~~~~
Point d'entrée principal du pipeline OCR.

Exemple minimal::

    from meditrack.ocr import MedicamentMatcher, process_prescription

    matcher = MedicamentMatcher.from_db("bdpm-database/data/bdpm.db")
    results = process_prescription("ordonnance.jpg", matcher)
    for r in results:
        print(r)
"""

from __future__ import annotations

from pathlib import Path
from typing import List

from .matcher import MatchResult, MedicamentMatcher
from .reader import OCRReader


def process_prescription(
    image_path: str | Path,
    matcher: MedicamentMatcher,
    *,
    languages: List[str] | None = None,
    gpu: bool = False,
    min_token_length: int = 4,
) -> List[MatchResult]:
    """
    Analyse une image d'ordonnance et retourne les médicaments identifiés.

    Args:
        image_path:        Chemin vers l'image (JPG, PNG…).
        matcher:           Instance de :class:`MedicamentMatcher` déjà configurée.
        languages:         Langues EasyOCR (défaut : ``["fr", "en"]``).
        gpu:               Utiliser le GPU pour EasyOCR (défaut : ``False``).
        min_token_length:  Longueur minimale d'un token OCR retenu.

    Returns:
        Liste de :class:`MatchResult`, triée par confiance décroissante.

    Raises:
        FileNotFoundError: Si ``image_path`` n'existe pas.
    """
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image introuvable : {path.resolve()}")

    reader = OCRReader(languages=languages, gpu=gpu)
    tokens = reader.extract_text(path, min_length=min_token_length)

    results = matcher.find_all(tokens)

    # Tri par confiance décroissante, dédoublonnage par CIS
    seen: set[str] = set()
    unique_results: List[MatchResult] = []
    for r in sorted(results, key=lambda x: x.confidence, reverse=True):
        if r.cis not in seen:
            seen.add(r.cis)
            unique_results.append(r)

    return unique_results
