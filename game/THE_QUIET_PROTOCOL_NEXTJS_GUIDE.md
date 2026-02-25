# THE QUIET PROTOCOL — Next.js + Phaser Production Guide

Tagline: **“The mind was never meant to be archived.”**

---

## 1) How the current `philoagents-ui` architecture works (quick reference)

This is the pattern you should carry forward into your Next.js project.

### Core structure
- Entry point configures Phaser game + scene order.
- A **Preloader scene** loads all assets first.
- A **Game scene** handles map/layers/player/NPCs/collisions/dialogue triggers.
- Character movement logic is encapsulated in a class (`Character`).
- Dialogue logic is encapsulated in a class (`DialogueManager`) with HTTP + WebSocket service adapters.

### Asset connection pattern
- Static files are served under `public/assets/...`.
- Loader uses a base path and keys (`this.load.setPath(...)`, `this.load.image(...)`, `this.load.atlas(...)`).
- Tilemap JSON references tilesets by name; game code maps those names with `map.addTilesetImage(tileSetNameInTiled, loadedTextureKey)`.
- Collision comes from tile properties (`collides: true`) + `setCollisionByProperty({ collides: true })`.
- Spawn points and NPC positions come from map `Objects` layer names.

### Naming contract to preserve
For every character atlas, keep frame names strict:
- Idle: `<id>-front`, `<id>-back`, `<id>-left`, `<id>-right`
- Walk loops: `<id>-front-walk-0000 ... 0008` (same for left/right/back)

If naming drifts, animation creation and `setTexture` calls will fail.

---

## 2) Next.js architecture for THE QUIET PROTOCOL

## Tech stack
- **Next.js (App Router, TypeScript)** for shell/UI/routing/build
- **Phaser 3** for game runtime
- **Zustand** for player profile/state memory
- **Howler** for adaptive ambience and SFX
- **Zod** for validating JSON content configs (acts, rules, endings)

## Recommended folder structure

```txt
quiet-protocol/
  public/
    assets/
      characters/
      tilemaps/
      tilesets/
      fx/
      ui/
      audio/
      docs/
  src/
    app/
      page.tsx
      layout.tsx
    components/
      GameClient.tsx
    game/
      bootstrap.ts
      config.ts
      scenes/
        BootScene.ts
        MainMenuScene.ts
        Act1ArchiveScene.ts
        Act2PatientsScene.ts
        Act3CorruptionScene.ts
        Act4EvaluationScene.ts
        Act5ChoiceScene.ts
      entities/
        Player.ts
        Npc.ts
      systems/
        PlayerProfileSystem.ts
        HallucinationSystem.ts
        DialogueSystem.ts
        ChoiceSystem.ts
        AudioDirector.ts
      data/
        acts.json
        npc_rules.json
        endings.json
      types/
        game.ts
```

---

## 3) Copy-paste starter code (minimum working shell)

### 3.1 Install and bootstrap

```bash
npx create-next-app@latest quiet-protocol --ts --eslint --app --src-dir --import-alias "@/*"
cd quiet-protocol
npm i phaser zustand zod howler
```

### 3.2 `src/app/page.tsx`

```tsx
import dynamic from "next/dynamic";

const GameClient = dynamic(() => import("@/components/GameClient"), {
  ssr: false,
});

export default function Page() {
  return (
    <main style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <GameClient />
    </main>
  );
}
```

### 3.3 `src/components/GameClient.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { startGame, stopGame } from "@/game/bootstrap";

export default function GameClient() {
  useEffect(() => {
    startGame("game-root");
    return () => stopGame();
  }, []);

  return <div id="game-root" style={{ width: "100%", height: "100%" }} />;
}
```

### 3.4 `src/game/config.ts`

```ts
import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { MainMenuScene } from "./scenes/MainMenuScene";
import { Act1ArchiveScene } from "./scenes/Act1ArchiveScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: "#05070B",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [BootScene, MainMenuScene, Act1ArchiveScene],
};
```

### 3.5 `src/game/bootstrap.ts`

```ts
import Phaser from "phaser";
import { gameConfig } from "./config";

let game: Phaser.Game | null = null;

export function startGame(parent: string) {
  if (game) return game;
  game = new Phaser.Game({ ...gameConfig, parent });
  return game;
}

export function stopGame() {
  if (!game) return;
  game.destroy(true);
  game = null;
}
```

### 3.6 `src/game/scenes/BootScene.ts`

```ts
import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.setPath("/assets");

    this.load.image("menu-bg", "ui/menu-bg.png");

    this.load.tilemapTiledJSON("act1-map", "tilemaps/act1-archive.json");
    this.load.image("asylum-tiles", "tilesets/asylum-tiles.png");

    this.load.atlas(
      "aarav",
      "characters/aarav/atlas.png",
      "characters/aarav/atlas.json"
    );
  }

  create() {
    this.scene.start("MainMenuScene");
  }
}
```

### 3.7 `src/game/scenes/MainMenuScene.ts`

```ts
import Phaser from "phaser";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  create() {
    this.add.image(640, 360, "menu-bg");

    this.add
      .text(640, 240, "THE QUIET PROTOCOL", {
        fontSize: "54px",
        color: "#DDE7FF",
      })
      .setOrigin(0.5);

    this.add
      .text(640, 300, "The mind was never meant to be archived.", {
        fontSize: "20px",
        color: "#95A7C7",
      })
      .setOrigin(0.5);

    const start = this.add
      .text(640, 420, "START", {
        fontSize: "32px",
        color: "#FFFFFF",
        backgroundColor: "#1E2A44",
      })
      .setPadding(18, 10, 18, 10)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    start.on("pointerdown", () => this.scene.start("Act1ArchiveScene"));
  }
}
```

### 3.8 `src/game/scenes/Act1ArchiveScene.ts`

```ts
import Phaser from "phaser";

export class Act1ArchiveScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super("Act1ArchiveScene");
  }

  create() {
    const map = this.make.tilemap({ key: "act1-map" });
    const tiles = map.addTilesetImage("asylum-tiles", "asylum-tiles");

    map.createLayer("Below Player", tiles!, 0, 0);
    const world = map.createLayer("World", tiles!, 0, 0);
    map.createLayer("Above Player", tiles!, 0, 0)?.setDepth(20);

    world?.setCollisionByProperty({ collides: true });

    this.player = this.physics.add
      .sprite(180, 180, "aarav", "aarav-front")
      .setDepth(10);

    this.physics.add.collider(this.player, world!);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  }

  update() {
    const speed = 170;
    this.player.body.setVelocity(0);

    if (this.cursors.left?.isDown) this.player.body.setVelocityX(-speed);
    else if (this.cursors.right?.isDown) this.player.body.setVelocityX(speed);

    if (this.cursors.up?.isDown) this.player.body.setVelocityY(-speed);
    else if (this.cursors.down?.isDown) this.player.body.setVelocityY(speed);

    this.player.body.velocity.normalize().scale(speed);
  }
}
```

### 3.9 `src/game/systems/PlayerProfileSystem.ts`

```ts
import { create } from "zustand";

type PlayerProfileState = {
  hesitationMs: number;
  aggression: number;
  darknessMs: number;
  empathy: number;
  confrontation: number;

  addHesitation: (ms: number) => void;
  addAggression: (value: number) => void;
  addDarkness: (ms: number) => void;
  addEmpathy: (value: number) => void;
  addConfrontation: (value: number) => void;
};

export const usePlayerProfile = create<PlayerProfileState>((set) => ({
  hesitationMs: 0,
  aggression: 0,
  darknessMs: 0,
  empathy: 0,
  confrontation: 0,

  addHesitation: (ms) =>
    set((s) => ({ hesitationMs: s.hesitationMs + Math.max(0, ms) })),
  addAggression: (value) => set((s) => ({ aggression: s.aggression + value })),
  addDarkness: (ms) => set((s) => ({ darknessMs: s.darknessMs + Math.max(0, ms) })),
  addEmpathy: (value) => set((s) => ({ empathy: s.empathy + value })),
  addConfrontation: (value) =>
    set((s) => ({ confrontation: s.confrontation + value })),
}));
```

---

## 4) Rules to follow in this project

1. **Always load assets from** `/assets` in Next.js (`this.load.setPath('/assets')`).
2. Keep Tiled layer names stable:
   - `Below Player`
   - `World`
   - `Above Player`
   - `Objects`
3. Keep tile collision data in Tiled tile properties (`collides: true`).
4. Keep all story logic data-driven:
   - `acts.json`
   - `npc_rules.json`
   - `endings.json`
5. Keep scene responsibilities strict:
   - Boot/Preload only loads
   - Menu handles menu UI only
   - Act scenes handle gameplay only
6. Add one central `GameState/Profile` system and read it from all adaptive mechanics.

---

## 5) THE QUIET PROTOCOL game design implementation map

## 5.1 Five-act scene escalation
- **Act 1 – Archive**: exploration + logs + minimal anomalies
- **Act 2 – Patients Return**: Raghav/Meera dynamics + first environment shifts
- **Act 3 – Corruption**: loops, black reflections, PA distortions, Janitor pressure
- **Act 4 – Evaluation**: AI direct speech + Mira revelation + high hostility
- **Act 5 – Choice**: Neuro-Core + conditional ending choices

## 5.2 Adaptive fear metrics (must-have)
Track in profile system:
- hesitation time
- time in darkness
- aggression score
- empathy score
- confrontation/fear-exposure score

Use these to drive:
- hallucination frequency
- NPC hostility/support
- corridor distortion intensity
- available final endings

---

## 6) Asset production checklist (what to generate)

## 6.1 Characters (atlases + portraits)
- Aarav (normal + destabilized variants)
- Mira (intercom representation + physical glitched form)
- Raghav (quiet + predictive-symbol states)
- Meera (fragile + hostile hallucination states)
- Janitor (multiple impossible silhouettes)
- AI Core manifestations (non-humanoid environmental visual states)

For each playable/NPC sprite atlas:
- 4 idle directions
- 4 walk loops (9 frames each)
- optional corruption overlay frames

## 6.2 Environment
- Brutalist asylum tileset (walls/floors/doors/windows/stairs)
- Security room props
- Archive props (files, cassettes, reels)
- Medical/neurotech props (2030 retro-future)
- Corruption overlays (stretching walls, glitch cracks)
- Black reflective void floor variants

## 6.3 FX and UI
- scanline/glitch overlays (transparent PNG sequences)
- flicker light masks
- distortion sprites
- dossier/tape-recorder style UI panels
- ending choice terminal screens

## 6.4 Audio
- ambient layers per act
- PA voice filters and events
- janitor scrape motifs
- adaptive tension stems keyed by profile

---

## 7) Prompt pack for image generation

Use these directly with your image model and iterate 3–5 variants each.

## Global style prefix (prepend to every prompt)

```txt
Top-down psychological horror game asset, moody cinematic lighting, grounded realism, brutalist Indian government hospital architecture, retro-futuristic 2030 medical technology, production concept art quality, no text, no watermark, consistent scale, readable silhouette, non-gory tone.
```

## Global negative prompt (append to every prompt)

```txt
No watermark, no logos, no text, no signature, no extra limbs, no gore, no cartoony style, no oversaturated fantasy palette, no fisheye distortion, no blurry low-resolution output.
```

## 7.1 Environment prompts

### Act 1 corridor
```txt
Dusty psychiatric ward corridor, flickering fluorescent tubes, old medical files scattered, steel doors, subtle fog, cold blue-gray palette, quiet dread, modular top-down game tileset composition.
```

### Security room
```txt
Abandoned asylum security room with analog CRT monitors, tape recorders, retro biometric panels, weak backup lighting, realistic clutter, top-down modular room kit.
```

### Trauma simulation room
```txt
Clinical trauma simulation chamber with restraint chair, suspended neural cables, one-way observation glass, retro-futuristic therapy machine, sterile but disturbing mood, top-down asset sheet style.
```

### Neuro-Core chamber (final)
```txt
Massive subterranean neuro-core chamber, concentric server rings, liquid-black reflective floor, red glitch energy veins, monolithic architecture, final confrontation environment, top-down composition.
```

## 7.2 Character prompts

### Dr. Aarav Sen
```txt
Indian male cognitive historian, early 30s, calm intelligent face, subtle neural implant near temple, future research jacket over field gear, emotional stability slowly breaking, front/side/back character turnaround for game sprite reference.
```

### Dr. Mira Sanyal
```txt
Female scientist, clean lab coat, compassionate expression, slight digital edge flicker, eyes occasionally static, trapped AI consciousness feeling, character turnaround sheet for top-down adaptation.
```

### Raghav
```txt
Teenage male patient, pale complexion, worn hospital clothes, predictive symbols scribbled on skin and notebook pages, unsettling still posture, appears both vulnerable and uncanny, character concept turnaround.
```

### Meera Kapoor
```txt
Adult female former patient, broken hospital gown, emotional instability, tears glitching into black digital streaks, dual-state concept (gentle and hostile), psychological horror character sheet.
```

### The Janitor
```txt
Tall janitor silhouette, face obscured, industrial maintenance tools, impossible posture, unsettling presence, metallic scraping implied by visual cues, non-gory horror character concept.
```

### AI Core manifestation
```txt
Non-human antagonist represented through environment: voice systems, light arrays, geometry distortions, no literal face, intelligent and predatory machine presence, abstract horror concept art.
```

## 7.3 UI / FX prompts

### Diegetic dossier UI
```txt
Minimal diegetic UI inspired by patient records and tape logs, dark translucent panels, analog-digital hybrid controls, distressed glass texture, no text content, game HUD kit.
```

### Glitch overlay pack
```txt
Transparent glitch overlay texture pack, scanline tears, chromatic separation bursts, signal corruption frames, alpha-ready PNG sequence for compositing.
```

### Predictive symbol decals
```txt
Hand-drawn trauma symbols and recurring glyph patterns, chalk/marker wall decal set, eerie but non-occult clinical vibe, high-contrast variants for dark scenes.
```

## 7.4 Tileset prompt

```txt
Top-down 32x32 modular asylum tileset, floors walls doors windows vents stairwells security stations archive shelves medical machinery, seamless edge transitions, atlas sheet layout, consistent lighting and perspective.
```

---

## 8) Optional data templates you can add immediately

### `src/game/data/endings.json`

```json
{
  "destroy_system": {
    "requires": { "confrontationMin": 6 },
    "result": "Corrupted minds released, Mira erased permanently"
  },
  "upload_self": {
    "requires": { "aggressionMax": 7, "hesitationMaxMs": 240000 },
    "result": "Aarav preserved inside archive"
  },
  "merge_reform": {
    "requires": { "empathyMin": 7, "confrontationMin": 5 },
    "result": "Ethical therapy system formed"
  }
}
```

### `src/game/data/npc_rules.json`

```json
{
  "meera": {
    "ifComforted": "assist",
    "ifIgnored": "hostile_hallucination"
  },
  "raghav": {
    "avoidTraumaRooms": "increaseSymbolAggression",
    "confrontFear": "revealClues"
  },
  "janitor": {
    "highHesitation": "mockingLines",
    "highConfrontation": "helpfulWarnings"
  }
}
```

---

## 9) Final production tips (important)

- Freeze one world scale (tile size + character size) before mass asset generation.
- Lock naming conventions in an `asset-manifest.json` early.
- Generate normal + corrupted variants for major props/NPCs to support act transitions.
- Validate every atlas against animation key expectations before integrating.
- Keep fear from anticipation and adaptation, not repeated jump scares.

---

If you want, the next step is to add a second markdown file with a **day-by-day hackathon build plan** (Day 1 to Day 7), including exact deliverables for engineering, art, narrative, and audio.