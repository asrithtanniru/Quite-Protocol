const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

class RunStateManager {
  constructor(initialState = {}) {
    this.state = {
      health: 100,
      stress: 10,
      suspicion: 0,
      xp: 0,
      threatTier: 0,
      timeSeconds: 0,
      clues: [],
      inventory: [],
      npcState: {},
      factions: {
        staff_echoes: 0,
        patients: 0,
        core_system: 0,
      },
      runComplete: false,
      ...initialState,
    };
  }

  tick(seconds) {
    this.state.timeSeconds += seconds;
    this.recalculateThreatTier();
  }

  applyDamage(amount) {
    this.state.health = clamp(this.state.health - amount, 0, 100);
    return this.state.health;
  }

  heal(amount) {
    this.state.health = clamp(this.state.health + amount, 0, 100);
    return this.state.health;
  }

  addStress(amount) {
    this.state.stress = clamp(this.state.stress + amount, 0, 100);
    this.recalculateThreatTier();
    return this.state.stress;
  }

  addSuspicion(amount) {
    this.state.suspicion = clamp(this.state.suspicion + amount, 0, 100);
    this.recalculateThreatTier();
    return this.state.suspicion;
  }

  addXp(amount) {
    this.state.xp += Math.max(0, amount);
    return this.state.xp;
  }

  addClue(clue) {
    if (!this.state.clues.find((c) => c.id === clue.id)) {
      this.state.clues.push(clue);
      return true;
    }
    return false;
  }

  addInventoryItem(item) {
    if (this.state.inventory.length >= 8) {
      return false;
    }
    this.state.inventory.push(item);
    return true;
  }

  setNpcState(characterId, patch) {
    const current = this.state.npcState[characterId] || {
      trust: 0,
      fear: 0,
      hostility: 0,
      knowledgeFlags: [],
    };

    const next = {
      ...current,
      ...patch,
    };

    next.trust = clamp(next.trust, -100, 100);
    next.fear = clamp(next.fear, 0, 100);
    next.hostility = clamp(next.hostility, 0, 100);
    this.state.npcState[characterId] = next;
    return next;
  }

  setFactionDelta(factionId, delta) {
    if (!Object.prototype.hasOwnProperty.call(this.state.factions, factionId)) {
      return;
    }
    this.state.factions[factionId] = clamp(this.state.factions[factionId] + delta, -100, 100);
  }

  recalculateThreatTier() {
    const suspicion = this.state.suspicion;
    const stress = this.state.stress;

    if (suspicion >= 75 || stress >= 85) {
      this.state.threatTier = 3;
    } else if (suspicion >= 50 || stress >= 65) {
      this.state.threatTier = 2;
    } else if (suspicion >= 25 || stress >= 35) {
      this.state.threatTier = 1;
    } else {
      this.state.threatTier = 0;
    }
  }

  toJSON() {
    return { ...this.state };
  }
}

export default RunStateManager;
