import json
from pathlib import Path
from typing import List

from pydantic import BaseModel, Field


class CharacterExtract(BaseModel):
    """A class representing raw character data extracted from external sources.

    This class follows the structure of the characters.json file and contains
    basic information about characters   before enrichment.

    Args:
        id (str): Unique identifier for the character.
        urls (List[str]): List of URLs with information about the character.
    """

    id: str = Field(description="Unique identifier for the character")
    urls: List[str] = Field(
        description="List of URLs with information about the character"
    )

    @classmethod
    def from_json(cls, metadata_file: Path) -> list["CharacterExtract"]:
        with open(metadata_file, "r") as f:
            characters_data = json.load(f)

        return [cls(**character) for character in characters_data]


class Character(BaseModel):
    """A class representing a character agent with memory capabilities.

    Args:
        id (str): Unique identifier for the character.
        name (str): Name of the character.
        perspective (str): Description of the character's theoretical views
            about AI.
        style (str): Description of the character's talking style.
    """

    id: str = Field(description="Unique identifier for the character")
    name: str = Field(description="Name of the character")
    perspective: str = Field(
        description="Description of the character's theoretical views about AI"
    )
    style: str = Field(description="Description of the character's talking style")
    context: str = Field(
        default="",
        description="Additional context used to steer responses.",
    )

    def __str__(self) -> str:
        return (
            "Character("
            f"id={self.id}, "
            f"name={self.name}, "
            f"perspective={self.perspective}, "
            f"style={self.style})"
        )


# Backward-compatible aliases used across the codebase.
PhilosopherExtract = CharacterExtract
Philosopher = Character
