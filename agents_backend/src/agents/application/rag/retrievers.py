from typing import Any

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch

from agents.config import settings


class Retriever:
    def __init__(self, vectorstore: MongoDBAtlasVectorSearch, top_k: int = 3) -> None:
        self.vectorstore = vectorstore
        self.top_k = top_k
        self.search_index_name = "vector_index"

    def invoke(self, query: str) -> list[Any]:
        return self.vectorstore.similarity_search(query, k=self.top_k)


def get_retriever(embedding_model_id: str, k: int, device: str = "cpu") -> Retriever:
    embedding_model = HuggingFaceEmbeddings(
        model_name=embedding_model_id,
        model_kwargs={"device": device},
    )

    vectorstore = MongoDBAtlasVectorSearch.from_connection_string(
        connection_string=settings.MONGO_URI,
        namespace=(
            settings.MONGO_DB_NAME,
            settings.MONGO_LONG_TERM_MEMORY_COLLECTION,
        ),
        embedding=embedding_model,
        index_name="vector_index",
    )

    return Retriever(vectorstore=vectorstore, top_k=k)
