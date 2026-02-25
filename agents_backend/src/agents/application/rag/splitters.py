from langchain_text_splitters import RecursiveCharacterTextSplitter


Splitter = RecursiveCharacterTextSplitter


def get_splitter(chunk_size: int) -> Splitter:
    return RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=0,
    )
