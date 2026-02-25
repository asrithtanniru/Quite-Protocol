class SaveService {
  constructor() {
    this.version = 1;
  }

  buildSlotKey(playerName, slot = 1) {
    return `quiet_protocol_save_v${this.version}_${playerName}_${slot}`;
  }

  load(playerName, slot = 1) {
    const raw = window.localStorage.getItem(this.buildSlotKey(playerName, slot));
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Failed to parse save data', error);
      return null;
    }
  }

  save(playerName, payload, slot = 1) {
    const wrapped = {
      version: this.version,
      savedAt: Date.now(),
      ...payload,
    };
    window.localStorage.setItem(this.buildSlotKey(playerName, slot), JSON.stringify(wrapped));
    return wrapped;
  }
}

export default new SaveService();
