from contextlib import asynccontextmanager
import json
from pathlib import Path

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from opik.integrations.langchain import OpikTracer
from pydantic import BaseModel

from agents.application.conversation_service.generate_response import (
    get_response,
    get_streaming_response,
)
from agents.application.conversation_service.reset_conversation import (
    reset_conversation_state,
)
from agents.domain.philosopher_factory import PhilosopherFactory
from agents.infrastructure.token_server import token_router

from .opik_utils import configure
from .token_server import token_router

configure()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown events for the API."""
    # Startup code (if any) goes here
    yield
    # Shutdown code goes here
    opik_tracer = OpikTracer()
    opik_tracer.flush()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(token_router)

_STATE_PATH = Path(__file__).resolve().parents[3] / "data" / "game_state.json"
_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)


def _read_state() -> dict:
    if not _STATE_PATH.exists():
        return {"save_slots": {}, "profile_stats": {}, "events": []}
    try:
        return json.loads(_STATE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"save_slots": {}, "profile_stats": {}, "events": []}


def _write_state(state: dict) -> None:
    _STATE_PATH.write_text(json.dumps(state, ensure_ascii=True), encoding="utf-8")


class ChatMessage(BaseModel):
    message: str
    character_id: str | None = None
    philosopher_id: str | None = None


class SavePayload(BaseModel):
    payload: dict


class DialogueOutcomePayload(BaseModel):
    character_id: str
    intent: str
    trust_delta: float = 0
    suspicion_delta: float = 0
    stress_delta: float = 0


class ClueResolvePayload(BaseModel):
    clue_id: str
    clue_type: str
    source: str | None = None


class RunEventPayload(BaseModel):
    event_type: str
    payload: dict | None = None


def _resolve_character_id(
    character_id: str | None, philosopher_id: str | None
) -> str:
    if character_id:
        return character_id
    if philosopher_id:
        return philosopher_id
    raise HTTPException(
        status_code=400, detail="Missing required field: character_id"
    )


# @app.post("/chat")
# async def chat(chat_message: ChatMessage):
#     try:
#         charter_factory = PhilosopherFactory()
#         philosopher = charter_factory.get_philosopher(chat_message.philosopher_id)

#         response, _ = await get_response(
#             messages=chat_message.message,
#             philosopher_id=chat_message.philosopher_id,
#             philosopher_name=philosopher.name,
#             philosopher_perspective=philosopher.perspective,
#             philosopher_style=philosopher.style,
#             philosopher_context="",
#         )
#         return {"response": response}
#     except Exception as e:
#         opik_tracer = OpikTracer()
#         opik_tracer.flush()

#         raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()

            character_id = data.get("character_id") or data.get("philosopher_id")
            if "message" not in data or not character_id:
                await websocket.send_json(
                    {
                        "error": "Invalid message format. Required fields: 'message' and 'character_id'"
                    }
                )
                continue

            try:
                charter_factory = PhilosopherFactory()
                philosopher = charter_factory.get_character(character_id)

                # Use streaming response instead of get_response
                response_stream = get_streaming_response(
                    messages=data["message"],
                    philosopher_id=character_id,
                    philosopher_name=philosopher.name,
                    philosopher_perspective=philosopher.perspective,
                    philosopher_style=philosopher.style,
                    philosopher_context="",
                )

                # Send initial message to indicate streaming has started
                await websocket.send_json({"streaming": True})

                # Stream each chunk of the response
                full_response = ""
                async for chunk in response_stream:
                    full_response += chunk
                    await websocket.send_json({"chunk": chunk})

                await websocket.send_json(
                    {"response": full_response, "streaming": False}
                )

            except Exception as e:
                opik_tracer = OpikTracer()
                opik_tracer.flush()

                await websocket.send_json({"error": str(e)})

    except WebSocketDisconnect:
        pass


@app.post("/reset-memory")
async def reset_conversation():
    """Resets the conversation state. It deletes the two collections needed for keeping LangGraph state in MongoDB.

    Raises:
        HTTPException: If there is an error resetting the conversation state.
    Returns:
        dict: A dictionary containing the result of the reset operation.
    """
    try:
        result = await reset_conversation_state()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/save/{slot}")
async def get_save_slot(slot: int):
    state = _read_state()
    save = state["save_slots"].get(str(slot))
    return {"slot": slot, "save": save}


@app.put("/save/{slot}")
async def put_save_slot(slot: int, body: SavePayload):
    state = _read_state()
    state["save_slots"][str(slot)] = body.payload
    _write_state(state)
    return {"slot": slot, "status": "saved"}


@app.get("/profile/stats")
async def get_profile_stats():
    state = _read_state()
    return {"stats": state.get("profile_stats", {})}


@app.post("/npc/dialogueOutcome")
async def post_dialogue_outcome(body: DialogueOutcomePayload):
    state = _read_state()
    stats = state.setdefault("profile_stats", {})
    stats["dialogue_interactions"] = int(stats.get("dialogue_interactions", 0)) + 1
    stats["last_character_id"] = body.character_id
    stats["last_intent"] = body.intent
    stats["total_trust_delta"] = float(stats.get("total_trust_delta", 0)) + body.trust_delta
    stats["total_suspicion_delta"] = float(stats.get("total_suspicion_delta", 0)) + body.suspicion_delta
    stats["total_stress_delta"] = float(stats.get("total_stress_delta", 0)) + body.stress_delta
    _write_state(state)
    return {"status": "ok"}


@app.post("/clue/resolve")
async def post_clue_resolve(body: ClueResolvePayload):
    state = _read_state()
    stats = state.setdefault("profile_stats", {})
    stats["clues_resolved"] = int(stats.get("clues_resolved", 0)) + 1
    stats["last_clue_id"] = body.clue_id
    _write_state(state)
    return {"status": "ok"}


@app.post("/run/event")
async def post_run_event(body: RunEventPayload):
    state = _read_state()
    events = state.setdefault("events", [])
    events.append({"event_type": body.event_type, "payload": body.payload or {}})
    if len(events) > 250:
        del events[:-250]
    _write_state(state)
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
