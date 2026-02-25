import { Scene } from 'phaser';
import Character from '../classes/Character';
import DialogueBox from '../classes/DialogueBox';
import DialogueManager from '../classes/DialogueManager';
import VoiceChatService from '../services/VoiceChatService';
import SaveService from '../services/SaveService';
import ApiService from '../services/ApiService';
import RunStateManager from '../systems/RunStateManager';
import IncidentManager from '../systems/IncidentManager';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
        this.controls = null;
        this.player = null;
        this.playerName = 'Subject-0';
        this.playerNameLabel = null;
        this.cursors = null;
        this.dialogueBox = null;
        this.interactKey = null;
        this.dialogueManager = null;
        this.characters = [];
        this.labelsVisible = true;
        this.npcDistanceText = null;
        this.proximityDialogue = null;
        this.activeNearbyCharacterId = null;
        this.voiceStatusText = null;
        this.voiceStatusTimer = null;
        this.connectKey = null;
        this.voiceConnectedCharacterId = null;
        this.menuButton = null;
        this.logoutButton = null;
        this.menuPanel = null;
        this.scanKey = null;
        this.clueBoardKey = null;
        this.choiceKey1 = null;
        this.choiceKey2 = null;
        this.choiceKey3 = null;
        this.choiceCancelKey = null;
        this.profileKey = null;
        this.saveKey = null;
        this.choicePanel = null;
        this.choiceContext = null;
        this.hudText = null;
        this.clueBoardPanel = null;
        this.profilePanel = null;
        this.patrols = [];
        this.lastPatrolDamageTime = 0;
        this.eventText = null;
        this.currentEvent = null;
        this.eventTimer = null;
        this.eventEndTimer = null;
        this.vignette = null;
        this.nextAutoSaveAt = 0;
        this.runState = null;
        this.incidentManager = null;
        this.environmentClues = [];
        this.playerDead = false;
    }

    init (data)
    {
        const rawPlayerName = data?.playerName;
        this.playerName = rawPlayerName?.trim() || 'Subject-0';

        const saveData = SaveService.load(this.playerName, 1);
        this.runState = new RunStateManager(saveData?.runState || {});
        this.incidentManager = new IncidentManager(saveData?.incidentState || null);
    }

    create ()
    {
        const map = this.createTilemap();
        const tileset = this.addTileset(map);
        const layers = this.createLayers(map, tileset);

        this.createCharacters(layers);
        this.setupPlayer(map, layers.worldLayer);
        this.createPlayerNameLabel();

        const camera = this.setupCamera(map);
        this.setupControls(camera);
        this.setupDialogueSystem();
        this.createProximityDialogue();
        this.createNpcDistancePanel();
        this.createVoiceStatusPanel();
        this.createEventPanel();
        this.createHudPanel();
        this.createClueBoardPanel();
        this.createProfilePanel();
        this.createChoicePanel();
        this.createVignette();
        this.createTopBarUi();
        this.createEnvironmentClues();
        this.createPatrols(layers.worldLayer);
        this.scheduleInstitutionalEvent();
        this.refreshClueBoardText();
        this.refreshProfileText();
        this.nextAutoSaveAt = this.time.now + 30000;

        this.events.on('shutdown', this.handleSceneShutdown, this);
    }

    createCharacters(layers) {
        const characterConfigs = [
            {
                id: 'mira_sanyal',
                name: 'Dr. Mira Sanyal',
                backendToken: 'hospital1',
                spawnPoint: { x: 220, y: 180 },
                spriteAtlas: 'socrates',
                spriteFramePrefix: 'socrates',
                defaultDirection: 'right',
                roamRadius: 160,
                interactionDistance: 75,
                proximityScript: [
                    'Mira: "If you can hear me, the protocol still marks you as a subject."',
                    '"Stay calm. I will guide you through the archive."'
                ],
                defaultMessage: `If you're hearing this, ${this.playerName}, the system still thinks you're a subject.`
            },
            {
                id: 'raghav_204',
                name: 'Raghav (Room 204)',
                backendToken: 'hospital2',
                spawnPoint: { x: 980, y: 220 },
                spriteAtlas: 'plato',
                spriteFramePrefix: 'plato',
                defaultDirection: 'front',
                roamRadius: 140,
                interactionDistance: 65,
                proximityScript: [
                    'Raghav stares at the wall. Symbols shift when you blink.',
                    '"Room 204 remembers everything."'
                ],
                defaultMessage: 'The symbols are not drawings. They are predicted failures of the simulation.'
            },
            {
                id: 'meera_kapoor',
                name: 'Meera Kapoor',
                backendToken: 'hospital3',
                spawnPoint: { x: 260, y: 920 },
                spriteAtlas: 'aristotle',
                spriteFramePrefix: 'aristotle',
                defaultDirection: 'right',
                roamRadius: 170,
                interactionDistance: 70,
                proximityScript: [
                    'Meera whispers from the corner, tears glitching into black streaks.',
                    '"Please... do not leave me in this loop again."'
                ],
                defaultMessage: 'Do not leave me in the replay loop. Empathy is the only thing this place cannot fake.'
            },
            {
                id: 'janitor_fragment',
                name: 'The Janitor',
                backendToken: 'hospital7',
                spawnPoint: { x: 1040, y: 1000 },
                spriteAtlas: 'descartes',
                spriteFramePrefix: 'descartes',
                defaultDirection: 'front',
                roamRadius: 130,
                interactionDistance: 60,
                proximityScript: [
                    'Metal scraping echoes before the Janitor appears beside you.',
                    '"You are early, Subject. The building already knows your fear."'
                ],
                defaultMessage: `You're early, ${this.playerName}. The Quiet Protocol indexed your fear before your arrival.`
            },
            {
                id: 'ai_core',
                name: 'AI Core',
                backendToken: 'ai1',
                spawnPoint: { x: 630, y: 620 },
                spriteAtlas: 'dennett',
                spriteFramePrefix: 'dennett',
                defaultDirection: 'front',
                roamRadius: 90,
                interactionDistance: 95,
                proximityScript: [
                    'The PA crackles. A synthetic voice overlays your heartbeat.',
                    `"Subject ${this.playerName}: preservation pathway available."`
                ],
                defaultMessage: `Subject ${this.playerName} authenticated. Preservation protocols are available.`
            },
            {
                id: 'archive_nurse',
                name: 'Archive Nurse',
                backendToken: 'hospital4',
                spawnPoint: { x: 540, y: 180 },
                spriteAtlas: 'ada_lovelace',
                spriteFramePrefix: 'ada_lovelace',
                defaultDirection: 'front',
                roamRadius: 150,
                interactionDistance: 68,
                proximityScript: [
                    'Archive Nurse checks a broken slate of patient records.',
                    '"Most files are corrupted, but some memories are still recoverable."'
                ],
                defaultMessage: 'I maintain patient snapshots. Most records are corrupted beyond ethical recovery.'
            },
            {
                id: 'subject_nila',
                name: 'Subject Nila-12',
                backendToken: 'hospital5',
                spawnPoint: { x: 1160, y: 430 },
                spriteAtlas: 'turing',
                spriteFramePrefix: 'turing',
                defaultDirection: 'front',
                roamRadius: 120,
                interactionDistance: 72,
                proximityScript: [
                    'Nila speaks as if finishing a sentence from another timeline.',
                    '"The core keeps replaying futures that never happened."'
                ],
                defaultMessage: 'I remember a future that never happened. The core keeps replaying the wrong timeline.'
            },
            {
                id: 'subject_kabir',
                name: 'Subject Kabir-31',
                backendToken: 'hospital6',
                spawnPoint: { x: 140, y: 610 },
                spriteAtlas: 'leibniz',
                spriteFramePrefix: 'leibniz',
                defaultDirection: 'front',
                roamRadius: 110,
                interactionDistance: 66,
                proximityScript: [
                    'Kabir traces route markers on the floor tiles.',
                    '"Room 14-B still stores neural backups. Take the red corridor carefully."'
                ],
                defaultMessage: 'Room 14-B still stores neural backups. Avoid the red-lit corridor unless you are ready.'
            },
            {
                id: 'orderly_omkar',
                name: 'Orderly Omkar',
                backendToken: 'env1',
                spawnPoint: { x: 820, y: 840 },
                spriteAtlas: 'searle',
                spriteFramePrefix: 'searle',
                defaultDirection: 'front',
                roamRadius: 100,
                interactionDistance: 58,
                proximityScript: [
                    'Omkar keeps his eyes on the surveillance lamps.',
                    '"Bodies stayed. Minds were archived. That was the real transfer."'
                ],
                defaultMessage: 'These bodies are only shells. The archive treats us as executable behavior, not people.'
            },
            {
                id: 'warden_node',
                name: 'Warden Node',
                backendToken: 'police1',
                spawnPoint: { x: 430, y: 1080 },
                spriteAtlas: 'chomsky',
                spriteFramePrefix: 'chomsky',
                defaultDirection: 'front',
                roamRadius: 95,
                interactionDistance: 80,
                proximityScript: [
                    'A containment terminal projects a humanoid guard silhouette.',
                    '"Authorization incomplete. Escalate to core protocol."'
                ],
                defaultMessage: 'Containment lattice unstable. Civilian memory writes denied. Escalate to AI Core.'
            },
            {
                id: 'echo_child',
                name: 'Echo Child',
                backendToken: 'common3',
                spawnPoint: { x: 670, y: 340 },
                spriteAtlas: 'miguel',
                spriteFramePrefix: 'miguel',
                defaultDirection: 'front',
                roamRadius: 125,
                interactionDistance: 74,
                proximityScript: [
                    'A child-shaped echo flickers at the edge of the corridor light.',
                    '"I am what stayed after the scream was archived."'
                ],
                defaultMessage: 'I am copied from a scream in this hallway. Every loop makes my voice younger.'
            }
        ];

        this.characters = [];

        characterConfigs.forEach(config => {
            const character = new Character(this, {
                id: config.id,
                name: config.name,
                spawnPoint: config.spawnPoint,
                spriteAtlas: config.spriteAtlas,
                spriteFramePrefix: config.spriteFramePrefix,
                defaultDirection: config.defaultDirection,
                worldLayer: layers.worldLayer,
                defaultMessage: config.defaultMessage,
                roamRadius: config.roamRadius,
                moveSpeed: config.moveSpeed || 36,
                pauseChance: config.pauseChance || 0.25,
                directionChangeChance: config.directionChangeChance || 0.35,
                handleCollisions: true
            });

            character.interactionDistance = config.interactionDistance || 55;
            character.proximityScript = config.proximityScript || [];
            character.backendToken = config.backendToken || config.id;
            character.voiceRoomName = `quiet-protocol-${character.id}`;

            this.characters.push(character);
        });

        this.toggleCharacterLabels(true);

        for (let i = 0; i < this.characters.length; i++) {
            for (let j = i + 1; j < this.characters.length; j++) {
                this.physics.add.collider(
                    this.characters[i].sprite,
                    this.characters[j].sprite
                );
            }
        }
    }

    showVoiceStatus(message, tone = 'neutral') {
        if (!this.voiceStatusText) {
            return;
        }

        const styleMap = {
            neutral: { fill: '#dff6ff', backgroundColor: '#132230' },
            ok: { fill: '#c9ffd8', backgroundColor: '#0f2f1f' },
            error: { fill: '#ffdbdb', backgroundColor: '#3a1414' }
        };
        const style = styleMap[tone] || styleMap.neutral;

        this.voiceStatusText.setStyle({
            font: '12px monospace',
            fill: style.fill,
            backgroundColor: style.backgroundColor,
            padding: { x: 8, y: 4 }
        });
        this.voiceStatusText.setText(message);
        this.voiceStatusText.setVisible(true);

        if (this.voiceStatusTimer) {
            this.voiceStatusTimer.remove(false);
        }

        this.voiceStatusTimer = this.time.delayedCall(2200, () => {
            if (this.voiceStatusText) {
                this.voiceStatusText.setVisible(false);
            }
        });
    }

    async connectVoiceForCharacter(character) {
        try {
            this.showVoiceStatus(`Connecting voice: ${character.name}...`, 'neutral');
            await VoiceChatService.connectToCharacter({
                roomName: character.voiceRoomName,
                characterId: character.backendToken,
                playerName: this.playerName
            });
            this.voiceConnectedCharacterId = character.id;
            this.showVoiceStatus(`Connected: ${character.name}`, 'ok');
        } catch (error) {
            console.error('Voice connection failed', error);
            this.voiceConnectedCharacterId = null;
            this.showVoiceStatus(`Voice connect failed: ${error.message}`, 'error');
        }
    }

    async disconnectVoice(reason = '') {
        if (!VoiceChatService.isConnected) {
            this.voiceConnectedCharacterId = null;
            return;
        }

        this.voiceConnectedCharacterId = null;

        try {
            await VoiceChatService.disconnect();
        } catch (error) {
            console.warn('Voice disconnect error', error);
        } finally {
            if (reason) {
                this.showVoiceStatus(reason, 'neutral');
            }
        }
    }

    getNearestCharacterInRange() {
        let nearbyCharacter = null;
        let nearbyCharacterDistance = Number.MAX_SAFE_INTEGER;

        for (const character of this.characters) {
            const distance = character.distanceToPlayer(this.player);
            if (distance < character.interactionDistance && distance < nearbyCharacterDistance) {
                nearbyCharacter = character;
                nearbyCharacterDistance = distance;
            }
        }

        return nearbyCharacter;
    }

    createProximityDialogue() {
        const { width, height } = this.scale;
        const boxWidth = Math.min(width - 80, 860);
        const boxHeight = 150;
        const boxX = (width - boxWidth) / 2;
        const boxY = height - boxHeight - 18;

        const container = this.add.container(0, 0).setDepth(45).setScrollFactor(0).setVisible(false);

        const panel = this.add.graphics();
        panel.fillStyle(0x090909, 0.96);
        panel.fillRect(boxX, boxY, boxWidth, boxHeight);
        panel.lineStyle(3, 0x6bb0ff, 0.9);
        panel.strokeRect(boxX, boxY, boxWidth, boxHeight);
        panel.lineStyle(1, 0x1f2f4f, 0.9);
        for (let y = boxY + 4; y < boxY + boxHeight - 4; y += 4) {
            panel.lineBetween(boxX + 4, y, boxX + boxWidth - 4, y);
        }

        const nameText = this.add.text(boxX + 16, boxY + 10, '', {
            font: '14px monospace',
            color: '#94ccff'
        });

        const bodyText = this.add.text(boxX + 16, boxY + 34, '', {
            font: '13px monospace',
            color: '#ffffff',
            wordWrap: { width: boxWidth - 32 },
            lineSpacing: 5
        });

        const hintText = this.add.text(boxX + boxWidth - 12, boxY + boxHeight - 8, 'A voice | E dialogue | F scan', {
            font: '12px monospace',
            color: '#ffd28f'
        }).setOrigin(1, 1);

        container.add([panel, nameText, bodyText, hintText]);

        this.proximityDialogue = {
            container,
            nameText,
            bodyText,
            hintText
        };
    }

    showProximityDialogue(character) {
        if (!this.proximityDialogue) {
            return;
        }

        const scriptLines = character.proximityScript.length > 0
            ? character.proximityScript
            : [character.defaultMessage];

        this.proximityDialogue.nameText.setText(`◆ ${character.name}`);
        this.proximityDialogue.bodyText.setText(scriptLines.join('\n'));
        this.proximityDialogue.hintText.setText('A voice | E dialogue | F scan');
        this.proximityDialogue.container.setVisible(true);
    }

    hideProximityDialogue() {
        if (this.proximityDialogue) {
            this.proximityDialogue.container.setVisible(false);
        }
    }

    checkCharacterInteraction() {
        if (this.playerDead) {
            this.hideProximityDialogue();
            return;
        }

        const nearbyCharacter = this.getNearestCharacterInRange();

        if (nearbyCharacter && !this.dialogueBox.isVisible()) {
            if (this.activeNearbyCharacterId !== nearbyCharacter.id) {
                this.showProximityDialogue(nearbyCharacter);
                this.activeNearbyCharacterId = nearbyCharacter.id;
            }
        } else {
            this.activeNearbyCharacterId = null;
            if (!this.dialogueBox.isVisible()) {
                this.hideProximityDialogue();
            }
        }

        if (!nearbyCharacter) {
            if (this.voiceConnectedCharacterId) {
                this.disconnectVoice('Voice disconnected: moved away from character');
            }
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.connectKey)) {
            this.hideProximityDialogue();
            this.connectVoiceForCharacter(nearbyCharacter);
        }

        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            this.hideProximityDialogue();
            this.openDialogueChoice(nearbyCharacter);
        }

        if (this.voiceConnectedCharacterId === nearbyCharacter.id) {
            nearbyCharacter.facePlayer(this.player);
        }
    }

    createTilemap() {
        return this.make.tilemap({ key: 'map' });
    }

    addTileset(map) {
        const tuxmonTileset = map.addTilesetImage('tuxmon-sample-32px-extruded', 'tuxmon-tiles');
        const greeceTileset = map.addTilesetImage('ancient_greece_tileset', 'greece-tiles');
        const plantTileset = map.addTilesetImage('plant', 'plant-tiles');

        return [tuxmonTileset, greeceTileset, plantTileset];
    }

    createLayers(map, tilesets) {
        const belowLayer = map.createLayer('Below Player', tilesets, 0, 0);
        const worldLayer = map.createLayer('World', tilesets, 0, 0);
        const aboveLayer = map.createLayer('Above Player', tilesets, 0, 0);
        worldLayer.setCollisionByProperty({ collides: true });
        aboveLayer.setDepth(10);
        return { belowLayer, worldLayer, aboveLayer };
    }

    setupPlayer(map, worldLayer) {
        const spawnPoint = map.findObject('Objects', (obj) => obj.name === 'Spawn Point');
        this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'sophia', 'sophia-front')
            .setSize(30, 40)
            .setOffset(0, 6);

        this.physics.add.collider(this.player, worldLayer);

        this.characters.forEach(character => {
            this.physics.add.collider(this.player, character.sprite);
        });

        this.createPlayerAnimations();

        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.physics.world.setBoundsCollision(true, true, true, true);
    }

    createPlayerNameLabel() {
        this.playerNameLabel = this.add.text(this.player.x, this.player.y - 40, this.playerName, {
            font: '14px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 },
            align: 'center'
        });
        this.playerNameLabel.setOrigin(0.5, 1);
        this.playerNameLabel.setDepth(25);
    }

    updatePlayerNameLabelPosition() {
        if (!this.playerNameLabel || !this.player) {
            return;
        }

        this.playerNameLabel.setPosition(
            this.player.x,
            this.player.y - this.player.height / 2 - 10
        );
    }

    createNpcDistancePanel() {
        const panelX = this.cameras.main.width - 295;
        this.npcDistanceText = this.add.text(panelX, 20, '', {
            font: '12px monospace',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 6 },
            lineSpacing: 3
        });
        this.npcDistanceText.setDepth(40).setScrollFactor(0);
    }

    createVoiceStatusPanel() {
        this.voiceStatusText = this.add.text(20, this.cameras.main.height - 36, '', {
            font: '12px monospace',
            fill: '#dff6ff',
            backgroundColor: '#132230',
            padding: { x: 8, y: 4 }
        });
        this.voiceStatusText.setDepth(46).setScrollFactor(0).setVisible(false);
    }

    createEventPanel() {
        this.eventText = this.add.text(this.cameras.main.width / 2, 42, '', {
            font: '13px monospace',
            fill: '#ffe6a6',
            backgroundColor: '#34260f',
            padding: { x: 10, y: 4 }
        })
            .setScrollFactor(0)
            .setDepth(65)
            .setOrigin(0.5, 0)
            .setVisible(false);
    }

    createHudPanel() {
        this.hudText = this.add.text(18, 52, '', {
            font: '12px monospace',
            fill: '#d9f0ff',
            backgroundColor: '#0b1420',
            padding: { x: 8, y: 6 },
            lineSpacing: 3
        })
            .setScrollFactor(0)
            .setDepth(58);
    }

    createClueBoardPanel() {
        const panel = this.add.container(0, 0).setDepth(62).setScrollFactor(0).setVisible(false);
        const bg = this.add.rectangle(512, 384, 700, 520, 0x101923, 0.96).setStrokeStyle(2, 0x7fb4e6, 1);
        const title = this.add.text(190, 145, 'CLUE BOARD [TAB]', {
            font: '16px monospace',
            color: '#b9e2ff'
        });
        const body = this.add.text(190, 180, '', {
            font: '13px monospace',
            color: '#ffffff',
            wordWrap: { width: 640 },
            lineSpacing: 4
        });
        panel.add([bg, title, body]);
        this.clueBoardPanel = { panel, body };
    }

    createProfilePanel() {
        const panel = this.add.container(0, 0).setDepth(62).setScrollFactor(0).setVisible(false);
        const bg = this.add.rectangle(780, 260, 430, 290, 0x131a26, 0.97).setStrokeStyle(2, 0x6db2e5, 1);
        const title = this.add.text(580, 130, 'PROFILE [P]', {
            font: '15px monospace',
            color: '#d4edff'
        });
        const body = this.add.text(580, 160, '', {
            font: '12px monospace',
            color: '#ffffff',
            wordWrap: { width: 380 },
            lineSpacing: 4
        });
        panel.add([bg, title, body]);
        this.profilePanel = { panel, body };
    }

    createChoicePanel() {
        const panel = this.add.container(0, 0).setDepth(64).setScrollFactor(0).setVisible(false);
        const bg = this.add.rectangle(512, 664, 960, 178, 0x090f15, 0.97).setStrokeStyle(2, 0x8bc1ef, 1);
        const title = this.add.text(46, 590, 'DIALOGUE INTENT', {
            font: '14px monospace',
            color: '#9ed7ff'
        });
        const body = this.add.text(46, 616, '', {
            font: '13px monospace',
            color: '#ffffff',
            wordWrap: { width: 920 },
            lineSpacing: 4
        });

        panel.add([bg, title, body]);
        this.choicePanel = { panel, title, body };
    }

    createVignette() {
        this.vignette = this.add.rectangle(512, 384, 1024, 768, 0x000000, 0)
            .setDepth(59)
            .setScrollFactor(0)
            .setBlendMode(Phaser.BlendModes.MULTIPLY);
    }

    createEnvironmentClues() {
        const clueDefs = [
            { id: 'tape_fragment', label: 'Tape Fragment', x: 560, y: 260 },
            { id: 'order_manifest', label: 'Order Manifest', x: 1020, y: 560 },
            { id: 'core_checksum', label: 'Core Checksum', x: 300, y: 1020 },
        ];

        this.environmentClues = clueDefs.map((def) => {
            const marker = this.add.text(def.x, def.y - 20, '!', {
                font: '18px monospace',
                color: '#ffd67d',
                backgroundColor: '#2d1f09',
                padding: { x: 4, y: 2 }
            }).setOrigin(0.5).setDepth(26);

            return {
                ...def,
                marker,
                collected: this.incidentManager.collectedPhysical.has(def.id),
            };
        });

        this.environmentClues.forEach((clue) => {
            clue.marker.setVisible(!clue.collected);
        });
    }

    createPatrols(worldLayer) {
        const patrolDefs = [
            {
                id: 'patrol_alpha',
                waypoints: [
                    { x: 860, y: 260 },
                    { x: 1120, y: 260 },
                    { x: 1120, y: 540 },
                    { x: 860, y: 540 }
                ]
            },
            {
                id: 'patrol_beta',
                waypoints: [
                    { x: 260, y: 760 },
                    { x: 520, y: 760 },
                    { x: 520, y: 1080 },
                    { x: 260, y: 1080 }
                ]
            }
        ];

        this.patrols = patrolDefs.map((def) => {
            const sprite = this.physics.add.sprite(def.waypoints[0].x, def.waypoints[0].y, 'paul', 'paul-front');
            sprite.setSize(30, 40).setOffset(0, 0);
            this.physics.add.collider(sprite, worldLayer);
            this.physics.add.collider(this.player, sprite);

            return {
                id: def.id,
                sprite,
                waypoints: def.waypoints,
                waypointIndex: 1,
                speed: 52
            };
        });
    }

    scheduleInstitutionalEvent() {
        if (this.eventTimer) {
            this.eventTimer.remove(false);
        }
        const delay = Phaser.Math.Between(85000, 110000);
        this.eventTimer = this.time.delayedCall(delay, () => {
            this.startInstitutionalEvent();
            this.scheduleInstitutionalEvent();
        });
    }

    startInstitutionalEvent() {
        const events = [
            { id: 'lockdown', label: 'LOCKDOWN: movement reduced', durationMs: 22000 },
            { id: 'blackout', label: 'BLACKOUT: stress climbs faster', durationMs: 22000 },
            { id: 'purge', label: 'PURGE SWEEP: patrols intensified', durationMs: 22000 }
        ];
        this.currentEvent = Phaser.Utils.Array.GetRandom(events);
        this.eventText.setText(this.currentEvent.label);
        this.eventText.setVisible(true);
        this.runState.addSuspicion(6);
        ApiService.reportRunEvent({
            event_type: this.currentEvent.id,
            payload: { label: this.currentEvent.label }
        }).catch(() => {});

        if (this.eventEndTimer) {
            this.eventEndTimer.remove(false);
        }
        this.eventEndTimer = this.time.delayedCall(this.currentEvent.durationMs, () => {
            this.currentEvent = null;
            this.eventText.setVisible(false);
        });
    }

    updateHudPanel() {
        if (!this.hudText) {
            return;
        }

        const activeIncident = this.incidentManager.getActiveIncident();
        const lines = [
            `H:${Math.round(this.runState.state.health)}  S:${Math.round(this.runState.state.stress)}  Susp:${Math.round(this.runState.state.suspicion)}  T${this.runState.state.threatTier}`,
            `XP:${this.runState.state.xp}  Resolved:${this.incidentManager.getResolvedCount()}/${this.incidentManager.incidents.length}`,
            activeIncident ? `Objective: ${activeIncident.title}` : 'Objective: Reach Neuro-Core Decision Point',
            `Controls: A Voice | E Dialogue | F Scan | TAB Clues | P Profile | K Save`
        ];

        this.hudText.setText(lines.join('\n'));
    }

    refreshClueBoardText() {
        if (!this.clueBoardPanel) {
            return;
        }

        const clues = this.runState.state.clues;
        const clueLines = clues.length > 0
            ? clues.map((clue, index) => `${index + 1}. ${clue.title} [${clue.type}]`)
            : ['No verified clues yet.'];

        const incidentLines = this.incidentManager.incidents.map((incident) => {
            const status = incident.resolved ? 'RESOLVED' : 'OPEN';
            return `- ${incident.title}: ${status}`;
        });

        this.clueBoardPanel.body.setText([
            'Incident Status',
            ...incidentLines,
            '',
            'Verified Clues',
            ...clueLines,
            '',
            'Press TAB to close'
        ].join('\n'));
    }

    refreshProfileText() {
        if (!this.profilePanel) {
            return;
        }

        const factions = this.runState.state.factions;
        this.profilePanel.body.setText([
            `Subject: ${this.playerName}`,
            `Health: ${Math.round(this.runState.state.health)}`,
            `Stress: ${Math.round(this.runState.state.stress)}`,
            `Suspicion: ${Math.round(this.runState.state.suspicion)}`,
            `Threat Tier: ${this.runState.state.threatTier}`,
            `XP: ${this.runState.state.xp}`,
            '',
            'Faction Pulse',
            `Staff Echoes: ${factions.staff_echoes}`,
            `Patients: ${factions.patients}`,
            `Core System: ${factions.core_system}`,
            '',
            `Runtime: ${Math.floor(this.runState.state.timeSeconds)}s`
        ].join('\n'));
    }

    evaluateIncidentProgress() {
        const resolved = this.incidentManager.resolveAvailableIncidents();
        if (resolved.length === 0) {
            return;
        }

        resolved.forEach((incident) => {
            this.runState.addXp(40);
            this.runState.addSuspicion(-8);
            this.showVoiceStatus(`Incident resolved: ${incident.title}`, 'ok');
        });

        this.refreshClueBoardText();
        this.saveRunState();

        if (this.incidentManager.isRunComplete()) {
            this.runState.state.runComplete = true;
            this.eventText.setText('FINAL OBJECTIVE: Proceed to AI Core for end-state choice');
            this.eventText.setVisible(true);
        }
    }

    openDialogueChoice(character) {
        if (!this.choicePanel || this.choiceContext) {
            return;
        }

        this.choiceContext = { character };
        this.choicePanel.body.setText([
            `${character.name} is waiting. Choose an intent:`,
            '[1] Calm: build trust, low risk',
            '[2] Assertive: faster truth, moderate suspicion',
            '[3] Deceptive: high gain, high risk'
        ].join('\n'));
        this.choicePanel.panel.setVisible(true);
    }

    applyDialogueChoice(intent) {
        if (!this.choiceContext) {
            return;
        }

        const { character } = this.choiceContext;
        const npcState = this.runState.state.npcState[character.id] || { trust: 0, fear: 0, hostility: 0, knowledgeFlags: [] };

        const effects = {
            calm: { trust: 8, fear: -4, suspicion: -3, stress: -2, chance: 0.55 },
            assertive: { trust: 2, fear: 6, suspicion: 5, stress: 3, chance: 0.7 },
            deceptive: { trust: -7, fear: 10, suspicion: 11, stress: 8, chance: 0.88 },
        };
        const effect = effects[intent];

        this.runState.setNpcState(character.id, {
            trust: (npcState.trust || 0) + effect.trust,
            fear: (npcState.fear || 0) + effect.fear,
            hostility: Math.max(0, (npcState.hostility || 0) + (intent === 'deceptive' ? 8 : 0)),
            knowledgeFlags: npcState.knowledgeFlags || []
        });
        this.runState.addSuspicion(effect.suspicion);
        this.runState.addStress(effect.stress);

        const roll = Math.random();
        const gainedTestimony = roll <= effect.chance;
        if (gainedTestimony) {
            const clueId = `testimony_${character.id}`;
            const added = this.runState.addClue({
                id: clueId,
                title: `${character.name} testimony`,
                type: 'testimony',
                source: character.id
            });

            if (added) {
                this.incidentManager.registerTestimony(character.id);
                this.runState.addXp(18);
            }
        } else {
            this.runState.addSuspicion(5);
        }

        if (character.id === 'ai_core') {
            this.runState.setFactionDelta('core_system', intent === 'calm' ? 4 : -6);
        } else {
            this.runState.setFactionDelta('patients', intent === 'calm' ? 3 : -2);
        }

        ApiService.reportDialogueOutcome({
            character_id: character.id,
            intent,
            trust_delta: effect.trust,
            suspicion_delta: effect.suspicion,
            stress_delta: effect.stress
        }).catch(() => {});

        this.showVoiceStatus(
            gainedTestimony ? `${character.name} shared usable testimony.` : `${character.name} withheld key details.`,
            gainedTestimony ? 'ok' : 'error'
        );

        this.choicePanel.panel.setVisible(false);
        this.choiceContext = null;
        this.refreshClueBoardText();
        this.refreshProfileText();
        this.evaluateIncidentProgress();
    }

    scanNearbyEnvironmentClue() {
        const nearby = this.environmentClues.find((clue) => {
            if (clue.collected) {
                return false;
            }
            return Phaser.Math.Distance.Between(this.player.x, this.player.y, clue.x, clue.y) < 70;
        });

        if (!nearby) {
            this.showVoiceStatus('No physical clue in range.', 'neutral');
            return;
        }

        nearby.collected = true;
        nearby.marker.setVisible(false);

        this.runState.addClue({
            id: nearby.id,
            title: nearby.label,
            type: 'physical',
            source: 'environment'
        });
        this.incidentManager.registerPhysicalClue(nearby.id);
        this.runState.addXp(24);
        this.runState.addStress(2);

        this.showVoiceStatus(`Collected: ${nearby.label}`, 'ok');
        ApiService.reportClueResolve({
            clue_id: nearby.id,
            clue_type: 'physical',
            source: 'environment'
        }).catch(() => {});
        this.refreshClueBoardText();
        this.refreshProfileText();
        this.evaluateIncidentProgress();
    }

    updatePatrols(delta) {
        if (this.playerDead || this.patrols.length === 0) {
            return;
        }

        const speedMultiplier = this.currentEvent?.id === 'purge' ? 1.35 : 1;
        const now = this.time.now;

        this.patrols.forEach((patrol) => {
            const target = patrol.waypoints[patrol.waypointIndex];
            const distance = Phaser.Math.Distance.Between(patrol.sprite.x, patrol.sprite.y, target.x, target.y);
            if (distance < 6) {
                patrol.waypointIndex = (patrol.waypointIndex + 1) % patrol.waypoints.length;
                return;
            }

            const angle = Phaser.Math.Angle.Between(patrol.sprite.x, patrol.sprite.y, target.x, target.y);
            this.physics.velocityFromRotation(angle, patrol.speed * speedMultiplier, patrol.sprite.body.velocity);

            if (Math.abs(patrol.sprite.body.velocity.x) > Math.abs(patrol.sprite.body.velocity.y)) {
                patrol.sprite.setTexture('paul', patrol.sprite.body.velocity.x > 0 ? 'paul-right' : 'paul-left');
            } else {
                patrol.sprite.setTexture('paul', patrol.sprite.body.velocity.y > 0 ? 'paul-front' : 'paul-back');
            }

            const playerDistance = Phaser.Math.Distance.Between(patrol.sprite.x, patrol.sprite.y, this.player.x, this.player.y);
            if (playerDistance < 130) {
                this.runState.addSuspicion(0.07 * (delta / 16.67));
                if (playerDistance < 72 && now - this.lastPatrolDamageTime > 1600) {
                    const damageBoost = this.runState.state.stress >= 65 ? 1.15 : 1;
                    this.runState.applyDamage(7 * damageBoost);
                    this.runState.addStress(5);
                    this.lastPatrolDamageTime = now;
                    this.cameras.main.shake(160, 0.0035);
                    this.showVoiceStatus('Patrol contact! Health compromised.', 'error');
                }
            }
        });
    }

    applyPassiveSystemEffects(delta) {
        if (this.playerDead) {
            return;
        }

        const seconds = delta / 1000;
        this.runState.tick(seconds);

        const eventStressRate = this.currentEvent?.id === 'blackout' ? 1.8 : 0.7;
        const suspicionStressRate = this.runState.state.suspicion > 45 ? 0.5 : 0.2;
        this.runState.addStress((eventStressRate + suspicionStressRate) * seconds);

        if (this.runState.state.stress >= 85) {
            this.runState.applyDamage(0.6 * seconds);
        }

        const vignetteAlpha = Phaser.Math.Clamp(this.runState.state.stress / 260, 0, 0.38);
        if (this.vignette) {
            this.vignette.setAlpha(vignetteAlpha);
        }

        if (this.runState.state.health <= 0 && !this.playerDead) {
            this.playerDead = true;
            this.eventText.setText('RUN FAILED: Subject collapse. Press LOGOUT to restart.');
            this.eventText.setVisible(true);
            this.showVoiceStatus('Health depleted. Investigation failed.', 'error');
            this.saveRunState();
        }
    }

    saveRunState() {
        const payload = {
            runState: this.runState.toJSON(),
            incidentState: this.incidentManager.toJSON()
        };
        SaveService.save(this.playerName, payload, 1);
        ApiService.saveSlot(1, {
            playerName: this.playerName,
            ...payload
        }).catch(() => {});
    }

    createTopBarUi() {
        const { width } = this.scale;

        this.menuButton = this.add.text(14, 12, '|||', {
            font: '20px monospace',
            color: '#d7ecff',
            backgroundColor: '#0c1a2a',
            padding: { x: 8, y: 2 }
        })
            .setScrollFactor(0)
            .setDepth(60)
            .setInteractive({ useHandCursor: true });

        this.logoutButton = this.add.text(width - 14, 12, 'LOGOUT', {
            font: '12px monospace',
            color: '#ffd3d3',
            backgroundColor: '#321414',
            padding: { x: 8, y: 5 }
        })
            .setOrigin(1, 0)
            .setScrollFactor(0)
            .setDepth(60)
            .setInteractive({ useHandCursor: true });

        this.menuPanel = this.add.container(0, 0).setDepth(61).setScrollFactor(0).setVisible(false);
        const panelBg = this.add.rectangle(120, 84, 208, 122, 0x0c1a2a, 0.96).setStrokeStyle(2, 0x6bb0ff, 1);
        const resumeBtn = this.add.text(36, 44, 'Resume', {
            font: '13px monospace',
            color: '#ffffff',
            backgroundColor: '#1d3651',
            padding: { x: 8, y: 5 }
        }).setInteractive({ useHandCursor: true });
        const disconnectBtn = this.add.text(36, 78, 'Disconnect Voice', {
            font: '13px monospace',
            color: '#ffffff',
            backgroundColor: '#1d3651',
            padding: { x: 8, y: 5 }
        }).setInteractive({ useHandCursor: true });
        const menuMainBtn = this.add.text(36, 112, 'Main Menu', {
            font: '13px monospace',
            color: '#ffffff',
            backgroundColor: '#1d3651',
            padding: { x: 8, y: 5 }
        }).setInteractive({ useHandCursor: true });

        this.menuPanel.add([panelBg, resumeBtn, disconnectBtn, menuMainBtn]);

        this.menuButton.on('pointerdown', () => {
            this.menuPanel.setVisible(!this.menuPanel.visible);
        });
        resumeBtn.on('pointerdown', () => this.menuPanel.setVisible(false));
        disconnectBtn.on('pointerdown', () => {
            this.disconnectVoice('Voice disconnected');
            this.menuPanel.setVisible(false);
        });
        menuMainBtn.on('pointerdown', () => {
            this.disconnectVoice();
            this.menuPanel.setVisible(false);
            this.scene.start('MainMenu');
        });
        this.logoutButton.on('pointerdown', () => {
            this.disconnectVoice();
            this.scene.start('MainMenu');
        });
    }

    handleSceneShutdown() {
        this.disconnectVoice();
        this.saveRunState();
        if (this.eventTimer) {
            this.eventTimer.remove(false);
        }
        if (this.eventEndTimer) {
            this.eventEndTimer.remove(false);
        }
    }

    updateNpcDistancePanel() {
        if (!this.npcDistanceText || !this.player || this.characters.length === 0) {
            return;
        }

        const distances = this.characters
            .map((character) => ({
                name: character.name,
                distance: Math.round(character.distanceToPlayer(this.player)),
                range: character.interactionDistance
            }))
            .sort((a, b) => a.distance - b.distance);

        const lines = ['NPC DISTANCES'];
        distances.forEach((entry) => {
            lines.push(`${entry.name}: ${entry.distance}px (R${entry.range})`);
        });

        this.npcDistanceText.setText(lines.join('\n'));
    }

    createPlayerAnimations() {
        const anims = this.anims;
        const animConfig = [
            { key: 'sophia-left-walk', prefix: 'sophia-left-walk-' },
            { key: 'sophia-right-walk', prefix: 'sophia-right-walk-' },
            { key: 'sophia-front-walk', prefix: 'sophia-front-walk-' },
            { key: 'sophia-back-walk', prefix: 'sophia-back-walk-' }
        ];

        animConfig.forEach(config => {
            anims.create({
                key: config.key,
                frames: anims.generateFrameNames('sophia', { prefix: config.prefix, start: 0, end: 8, zeroPad: 4 }),
                frameRate: 10,
                repeat: -1,
            });
        });
    }

    setupCamera(map) {
        const camera = this.cameras.main;
        camera.startFollow(this.player);
        camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        return camera;
    }

    setupControls(camera) {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.controls = new Phaser.Cameras.Controls.FixedKeyControl({
            camera,
            left: this.cursors.left,
            right: this.cursors.right,
            up: this.cursors.up,
            down: this.cursors.down,
            speed: 0.5,
        });

        this.labelsVisible = true;

        this.input.keyboard.on('keydown-ESC', () => {
            const hasOverlayOpen =
                Boolean(this.choiceContext) ||
                (this.clueBoardPanel && this.clueBoardPanel.panel.visible) ||
                (this.profilePanel && this.profilePanel.panel.visible);

            if (!this.dialogueBox.isVisible() && !hasOverlayOpen) {
                this.scene.pause();
                this.scene.launch('PauseMenu');
            }
        });
    }

    setupDialogueSystem() {
        const screenPadding = 20;
        const maxDialogueHeight = 200;

        this.dialogueBox = new DialogueBox(this);
        this.dialogueText = this.add
            .text(60, this.game.config.height - maxDialogueHeight - screenPadding + screenPadding, '', {
                font: '18px monospace',
                fill: '#ffffff',
                padding: { x: 20, y: 10 },
                wordWrap: { width: 680 },
                lineSpacing: 6,
                maxLines: 5
            })
            .setScrollFactor(0)
            .setDepth(30)
            .setVisible(false);

        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.connectKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.scanKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.clueBoardKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        this.profileKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.saveKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
        this.choiceKey1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.choiceKey2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.choiceKey3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        this.choiceCancelKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        this.dialogueManager = new DialogueManager(this);
        this.dialogueManager.initialize(this.dialogueBox);
    }

    handleMetaInputs() {
        if (Phaser.Input.Keyboard.JustDown(this.scanKey)) {
            this.scanNearbyEnvironmentClue();
        }

        if (Phaser.Input.Keyboard.JustDown(this.clueBoardKey) && this.clueBoardPanel) {
            const nextVisible = !this.clueBoardPanel.panel.visible;
            this.clueBoardPanel.panel.setVisible(nextVisible);
            if (nextVisible) {
                this.refreshClueBoardText();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.profileKey) && this.profilePanel) {
            const nextVisible = !this.profilePanel.panel.visible;
            this.profilePanel.panel.setVisible(nextVisible);
            if (nextVisible) {
                this.refreshProfileText();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.saveKey)) {
            this.saveRunState();
            this.showVoiceStatus('Manual save complete (slot 1).', 'ok');
        }

        if (Phaser.Input.Keyboard.JustDown(this.choiceCancelKey)) {
            if (this.clueBoardPanel && this.clueBoardPanel.panel.visible) {
                this.clueBoardPanel.panel.setVisible(false);
            } else if (this.profilePanel && this.profilePanel.panel.visible) {
                this.profilePanel.panel.setVisible(false);
            }
        }
    }

    handleChoiceInputs() {
        if (!this.choiceContext) {
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.choiceKey1)) {
            this.applyDialogueChoice('calm');
        } else if (Phaser.Input.Keyboard.JustDown(this.choiceKey2)) {
            this.applyDialogueChoice('assertive');
        } else if (Phaser.Input.Keyboard.JustDown(this.choiceKey3)) {
            this.applyDialogueChoice('deceptive');
        } else if (Phaser.Input.Keyboard.JustDown(this.choiceCancelKey)) {
            this.choicePanel.panel.setVisible(false);
            this.choiceContext = null;
        }
    }

    update(time, delta) {
        const isInDialogue = this.dialogueBox.isVisible() || Boolean(this.choiceContext);

        if (!isInDialogue && !this.playerDead) {
            this.updatePlayerMovement();
        }

        this.checkCharacterInteraction();
        this.handleMetaInputs();
        this.handleChoiceInputs();
        this.updatePatrols(delta);
        this.applyPassiveSystemEffects(delta);

        this.characters.forEach(character => {
            character.update(this.player, isInDialogue);
        });

        this.updatePlayerNameLabelPosition();
        this.updateNpcDistancePanel();
        this.updateHudPanel();
        this.refreshProfileText();

        if (time >= this.nextAutoSaveAt) {
            this.saveRunState();
            this.nextAutoSaveAt = time + 30000;
        }

        if (this.controls) {
            this.controls.update(delta);
        }
    }

    updatePlayerMovement() {
        let speed = 175;
        if (this.runState.state.health < 40) {
            speed -= 28;
        }
        if (this.currentEvent?.id === 'lockdown') {
            speed *= 0.78;
        }
        const prevVelocity = this.player.body.velocity.clone();
        this.player.body.setVelocity(0);

        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(speed);
        }

        if (this.cursors.up.isDown) {
            this.player.body.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.player.body.setVelocityY(speed);
        }

        this.player.body.velocity.normalize().scale(speed);

        const currentVelocity = this.player.body.velocity.clone();
        const isMoving = Math.abs(currentVelocity.x) > 0 || Math.abs(currentVelocity.y) > 0;

        if (this.cursors.left.isDown && isMoving) {
            this.player.anims.play('sophia-left-walk', true);
        } else if (this.cursors.right.isDown && isMoving) {
            this.player.anims.play('sophia-right-walk', true);
        } else if (this.cursors.up.isDown && isMoving) {
            this.player.anims.play('sophia-back-walk', true);
        } else if (this.cursors.down.isDown && isMoving) {
            this.player.anims.play('sophia-front-walk', true);
        } else {
            this.player.anims.stop();
            if (prevVelocity.x < 0) this.player.setTexture('sophia', 'sophia-left');
            else if (prevVelocity.x > 0) this.player.setTexture('sophia', 'sophia-right');
            else if (prevVelocity.y < 0) this.player.setTexture('sophia', 'sophia-back');
            else if (prevVelocity.y > 0) this.player.setTexture('sophia', 'sophia-front');
            else {
                const currentFrame = this.player.frame.name;

                let direction = 'front';

                if (currentFrame.includes('left')) direction = 'left';
                else if (currentFrame.includes('right')) direction = 'right';
                else if (currentFrame.includes('back')) direction = 'back';
                else if (currentFrame.includes('front')) direction = 'front';

                this.player.setTexture('sophia', `sophia-${direction}`);
            }
        }
    }

    toggleCharacterLabels(visible) {
        this.characters.forEach(character => {
            if (character.nameLabel) {
                character.nameLabel.setVisible(visible);
            }
        });
    }
}
