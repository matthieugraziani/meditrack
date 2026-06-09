"""
meditrack.ocr.reader
~~~~~~~~~~~~~~~~~~~~
Wrapper léger autour d'EasyOCR.
Instanciation paresseuse : le modèle n'est chargé qu'au premier appel.
"""

from __future__ import annotations

from pathlib import Path
from typing import List


class OCRReader:
    """Wrapper autour d'EasyOCR avec instanciation paresseuse."""

    def __init__(
        self,
        languages: List[str] | None = None,
        gpu: bool = False,
    ) -> None:
        self.languages = languages or ["fr", "en"]
        self.gpu = gpu
        self._reader = None  # chargé à la première utilisation

    # ------------------------------------------------------------------
    # Propriété paresseuse
    # ------------------------------------------------------------------

    @property
    def reader(self):
        if self._reader is None:
            import easyocr  # import différé pour ne pas pénaliser les imports

            self._reader = easyocr.Reader(self.languages, gpu=self.gpu)
        return self._reader

    # ------------------------------------------------------------------
    # API publique
    # ------------------------------------------------------------------

    def extract_text(self, image_path: str | Path, min_length: int = 4) -> List[str]:
        """
        Extrait les lignes de texte d'une image.

        Args:
            image_path: Chemin vers l'image (JPG, PNG…).
            min_length:  Longueur minimale d'un token pour être retenu.

        Returns:
            Liste de chaînes de caractères détectées.
        """
        raw: List[str] = self.reader.readtext(str(image_path), detail=0)
        return [token for token in raw if len(token) >= min_length]
