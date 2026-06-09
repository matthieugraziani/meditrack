"""
meditrack.ocr.matcher
~~~~~~~~~~~~~~~~~~~~~
Correspondance floue entre un texte OCR et la base BDPM.

Exemple::

    matcher = MedicamentMatcher.from_db("bdpm-database/data/bdpm.db")
    result = matcher.find("doliprane 1000mg")
    if result:
        print(result.cis, result.denomination, result.confidence)
"""

from __future__ import annotations

import difflib
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

import pandas as pd


@dataclass(frozen=True)
class MatchResult:
    """Résultat d'une correspondance médicament."""

    cis: str
    denomination: str
    confidence: float  # entre 0.0 et 1.0

    def __str__(self) -> str:
        return f"{self.denomination} (CIS: {self.cis}) — confiance : {self.confidence:.1%}"


class MedicamentMatcher:
    """
    Compare un texte OCR brut à la liste des dénominations BDPM
    et retourne la meilleure correspondance floue.

    Args:
        dataframe: DataFrame avec colonnes ``CIS`` et ``Designation``.
        threshold: Score minimal pour accepter une correspondance (0–1).
    """

    def __init__(self, dataframe: pd.DataFrame, threshold: float = 0.6) -> None:
        self._df = dataframe.copy()
        self._df["_lower"] = self._df["Designation"].str.lower()
        self.threshold = threshold

    # ------------------------------------------------------------------
    # Constructeurs alternatifs
    # ------------------------------------------------------------------

    @classmethod
    def from_db(
        cls,
        db_path: str | Path,
        threshold: float = 0.6,
    ) -> "MedicamentMatcher":
        """Instancie le matcher directement depuis le fichier bdpm.db."""
        path = Path(db_path)
        if not path.exists():
            raise FileNotFoundError(f"Base de données introuvable : {path.resolve()}")

        conn = sqlite3.connect(path)
        try:
            df = pd.read_sql_query("SELECT CIS, DENOMINATION FROM medicaments;", conn)
        finally:
            conn.close()

        df = df.rename(columns={"DENOMINATION": "Designation"})
        return cls(df, threshold=threshold)

    @classmethod
    def from_dataframe(
        cls,
        df: pd.DataFrame,
        threshold: float = 0.6,
    ) -> "MedicamentMatcher":
        """Instancie le matcher depuis un DataFrame déjà chargé."""
        return cls(df, threshold=threshold)

    # ------------------------------------------------------------------
    # API publique
    # ------------------------------------------------------------------

    def find(self, ocr_text: str) -> Optional[MatchResult]:
        """
        Recherche la meilleure correspondance pour un texte OCR.

        Args:
            ocr_text: Texte brut issu de l'OCR.

        Returns:
            :class:`MatchResult` ou ``None`` si aucune correspondance
            ne dépasse le seuil.
        """
        query = ocr_text.lower().strip()
        all_denominations: List[str] = self._df["_lower"].tolist()

        matches = difflib.get_close_matches(
            query, all_denominations, n=1, cutoff=self.threshold
        )
        if not matches:
            return None

        best_match = matches[0]
        row = self._df[self._df["_lower"] == best_match].iloc[0]
        score = difflib.SequenceMatcher(None, query, best_match).ratio()

        return MatchResult(
            cis=str(row["CIS"]),
            denomination=str(row["Designation"]),
            confidence=score,
        )

    def find_all(self, texts: List[str]) -> List[MatchResult]:
        """
        Recherche des correspondances pour une liste de textes OCR.
        Les textes sans correspondance sont silencieusement ignorés.

        Args:
            texts: Liste de tokens / lignes issus de l'OCR.

        Returns:
            Liste de :class:`MatchResult` (peut être vide).
        """
        results: List[MatchResult] = []
        for text in texts:
            match = self.find(text)
            if match:
                results.append(match)
        return results

    # ------------------------------------------------------------------
    # Propriétés utiles
    # ------------------------------------------------------------------

    @property
    def size(self) -> int:
        """Nombre de médicaments dans la base."""
        return len(self._df)
