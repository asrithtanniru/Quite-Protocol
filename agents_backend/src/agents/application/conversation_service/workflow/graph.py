from langchain_core.messages import AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_groq import ChatGroq
from langgraph.graph import END, StateGraph

from agents.config import settings
from agents.domain import prompts

from .state import WorkflowState


async def _conversation_node(state: WorkflowState) -> WorkflowState:
    model = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.GROQ_LLM_MODEL,
        temperature=0.3,
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", prompts.PHILOSOPHER_CHARACTER_CARD.prompt),
            MessagesPlaceholder("messages"),
        ],
        template_format="jinja2",
    )

    chain = prompt | model
    response = await chain.ainvoke(
        {
            "messages": state.get("messages", []),
            "philosopher_name": state.get("philosopher_name", ""),
            "philosopher_perspective": state.get("philosopher_perspective", ""),
            "philosopher_style": state.get("philosopher_style", ""),
            "summary": state.get("summary", ""),
        }
    )

    if not isinstance(response, AIMessage):
        response = AIMessage(content=str(response.content))

    return {"messages": [response]}


def create_workflow_graph() -> StateGraph:
    graph_builder = StateGraph(WorkflowState)
    graph_builder.add_node("conversation_node", _conversation_node)
    graph_builder.set_entry_point("conversation_node")
    graph_builder.add_edge("conversation_node", END)

    return graph_builder
