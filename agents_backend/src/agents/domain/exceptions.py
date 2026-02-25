class CharacterNameNotFound(Exception):
    """Exception raised when a character's name is not found."""

    def __init__(self, character_id: str):
        self.message = f"Character name for {character_id} not found."
        super().__init__(self.message)


class CharacterPerspectiveNotFound(Exception):
    """Exception raised when a character's perspective is not found."""

    def __init__(self, character_id: str):
        self.message = f"Character perspective for {character_id} not found."
        super().__init__(self.message)


class CharacterStyleNotFound(Exception):
    """Exception raised when a character's style is not found."""

    def __init__(self, character_id: str):
        self.message = f"Character style for {character_id} not found."
        super().__init__(self.message)


class CharacterContextNotFound(Exception):
    """Exception raised when a character's context is not found."""

    def __init__(self, character_id: str):
        self.message = f"Character context for {character_id} not found."
        super().__init__(self.message)


# Backward-compatible aliases used by older imports.
PhilosopherNameNotFound = CharacterNameNotFound
PhilosopherPerspectiveNotFound = CharacterPerspectiveNotFound
PhilosopherStyleNotFound = CharacterStyleNotFound
PhilosopherContextNotFound = CharacterContextNotFound
