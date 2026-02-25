from typing import Any

from langchain_core.messages import BaseMessage

from .graph import create_workflow_graph
from .state import PhilosopherState


def state_to_str(state: PhilosopherState | dict[str, Any]) -> str:
    if isinstance(state, dict):
        summary = state.get("summary")
        messages = state.get("messages", [])
    else:
        summary = state.summary
        messages = state.messages

    if summary:
        return str(summary)

    contents = [
        message.content
        for message in messages
        if isinstance(message, BaseMessage) and isinstance(message.content, str)
    ]
    return "\n".join(contents)


__all__ = ["create_workflow_graph", "PhilosopherState", "state_to_str"]
