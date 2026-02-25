# Agents API

Check the [INSTALL_AND_USAGE.md](../INSTALL_AND_USAGE.md) file for instructions on how to install and use the API.

# 🔧 Utlity Commands

## Formatting

```
make format-check
make format-fix
```

## Linting

```bash
make lint-check
make lint-fix
```

## Tests

```bash
make test
```

## LiveKit Multi-Character Voice Agent

Use `tools/livekit_multi_character.py` to run one LiveKit session that dynamically switches between 5 NPC personas (and voice IDs) per turn.

UI control packets:
- Topic `character_switch`: `{"character_token":"hospital1"}`
- Topic `character_engagement`: `{"engaged":true}` or `{"engaged":false}`

Agent replies are engagement-gated. It only responds while `engaged=true`.
Character switching while engaged is queued and applied after `engaged=false`.
Transcripts are stored in `data/call_transcripts/<room>.jsonl`.

No-UI test mode:
- `uv run python tools/send_room_control.py --character-token hospital1`
- `uv run python tools/send_room_control.py --engaged true`
- `uv run python tools/send_room_control.py --engaged false`

Single-agent file from base snippet:
- `tools/my_agent.py`
