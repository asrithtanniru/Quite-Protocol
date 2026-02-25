import json
import hashlib
import requests
from .config import DATAHAVEN_URL, DATAHAVEN_API_KEY, DATAHAVEN_BUCKET


class DataHavenClient:
    def __init__(self):
        self.base_url = DATAHAVEN_URL
        self.api_key = DATAHAVEN_API_KEY
        self.bucket = DATAHAVEN_BUCKET

    def _hash(self, data: dict) -> str:
        return hashlib.sha256(
            json.dumps(data, sort_keys=True).encode()
        ).hexdigest()

    def upload(self, key: str, data: dict) -> dict:
        """
        Upload JSON data to DataHaven using REST API.
        """
        content_hash = self._hash(data)

        payload = {
            "bucket": self.bucket,
            "key": key,
            "data": data
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        response = requests.post(
            f"{self.base_url}/upload",
            headers=headers,
            json=payload
        )

        response.raise_for_status()

        return {
            "storage_pointer": f"{self.bucket}/{key}",
            "content_hash": content_hash
        }