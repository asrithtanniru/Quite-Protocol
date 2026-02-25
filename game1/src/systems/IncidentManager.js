class IncidentManager {
  constructor(initialState = null) {
    this.incidents = initialState?.incidents || [
      {
        id: 'incident_tape',
        title: 'Missing Session Tape',
        requiredPhysical: ['tape_fragment'],
        requiredTestimony: ['mira_sanyal'],
        resolved: false,
      },
      {
        id: 'incident_lockdown',
        title: 'False Lockdown Order',
        requiredPhysical: ['order_manifest'],
        requiredTestimony: ['janitor_fragment'],
        resolved: false,
      },
      {
        id: 'incident_core',
        title: 'Neuro-Core Breach',
        requiredPhysical: ['core_checksum'],
        requiredTestimony: ['ai_core'],
        resolved: false,
      },
    ];

    this.collectedPhysical = new Set(initialState?.collectedPhysical || []);
    this.collectedTestimony = new Set(initialState?.collectedTestimony || []);
  }

  registerPhysicalClue(clueId) {
    this.collectedPhysical.add(clueId);
    return this.resolveAvailableIncidents();
  }

  registerTestimony(characterId) {
    this.collectedTestimony.add(characterId);
    return this.resolveAvailableIncidents();
  }

  resolveAvailableIncidents() {
    const newlyResolved = [];
    this.incidents.forEach((incident) => {
      if (incident.resolved) {
        return;
      }

      const hasPhysical = incident.requiredPhysical.every((id) => this.collectedPhysical.has(id));
      const hasTestimony = incident.requiredTestimony.every((id) => this.collectedTestimony.has(id));

      if (hasPhysical && hasTestimony) {
        incident.resolved = true;
        newlyResolved.push(incident);
      }
    });
    return newlyResolved;
  }

  getActiveIncident() {
    return this.incidents.find((incident) => !incident.resolved) || null;
  }

  getResolvedCount() {
    return this.incidents.filter((incident) => incident.resolved).length;
  }

  isRunComplete() {
    return this.getResolvedCount() >= this.incidents.length;
  }

  toJSON() {
    return {
      incidents: this.incidents.map((incident) => ({ ...incident })),
      collectedPhysical: Array.from(this.collectedPhysical),
      collectedTestimony: Array.from(this.collectedTestimony),
    };
  }
}

export default IncidentManager;
