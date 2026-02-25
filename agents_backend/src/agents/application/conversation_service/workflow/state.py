from typing import TypedDict

from langchain_core.messages import BaseMessage
from pydantic import BaseModel, Field


class WorkflowState(TypedDict, total=False):
    messages: list[BaseMessage]
    philosopher_name: str
    philosopher_perspective: str
    philosopher_style: str
    philosopher_context: str
    summary: str


class PhilosopherState(BaseModel):
    messages: list[BaseMessage] = Field(default_factory=list)
    philosopher_name: str = ""
    philosopher_perspective: str = ""
    philosopher_style: str = ""
    philosopher_context: str = ""
    summary: str = ""
