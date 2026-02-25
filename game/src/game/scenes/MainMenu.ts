import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    background!: GameObjects.Image;
    title!: GameObjects.Text;
    tagline!: GameObjects.Text;
    startBtn!: GameObjects.Text;
    private glowTween!: Phaser.Tweens.Tween;
    private scanlineGraphics!: GameObjects.Graphics;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const { width, height } = this.scale;

        // Dark background
        this.cameras.main.setBackgroundColor(0x05070B);
        this.background = this.add.image(width / 2, height / 2, 'background');
        this.background.setDisplaySize(width, height);
        this.background.setTint(0x111122);
        this.background.setAlpha(0.6);

        // Scanline overlay effect
        this.scanlineGraphics = this.add.graphics();
        this.scanlineGraphics.setDepth(100);
        this.scanlineGraphics.setAlpha(0.03);
        for (let y = 0; y < height; y += 3) {
            this.scanlineGraphics.fillStyle(0x000000);
            this.scanlineGraphics.fillRect(0, y, width, 1);
        }

        // Subtle vignette
        const vignette = this.add.graphics();
        vignette.setDepth(99);
        const vignetteRadius = Math.max(width, height) * 0.7;
        for (let i = 0; i < 20; i++) {
            const alpha = (i / 20) * 0.4;
            vignette.fillStyle(0x000000, alpha);
            vignette.fillRect(0, 0, width, height);
        }

        // Title
        this.title = this.add.text(width / 2, height * 0.3, 'THE QUIET\nPROTOCOL', {
            fontFamily: '"Courier New", monospace',
            fontSize: '56px',
            color: '#DDE7FF',
            align: 'center',
            lineSpacing: 8,
            letterSpacing: 12,
        }).setOrigin(0.5).setDepth(101);

        // Glowing effect on title
        this.glowTween = this.tweens.add({
            targets: this.title,
            alpha: { from: 0.85, to: 1 },
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Tagline
        this.tagline = this.add.text(width / 2, height * 0.52, '"The mind was never meant to be archived."', {
            fontFamily: '"Courier New", monospace',
            fontSize: '16px',
            color: '#667799',
            fontStyle: 'italic'
        }).setOrigin(0.5).setDepth(101);

        // Decorative line
        const lineGfx = this.add.graphics();
        lineGfx.lineStyle(1, 0x445577, 0.5);
        lineGfx.lineBetween(width / 2 - 150, height * 0.58, width / 2 + 150, height * 0.58);
        lineGfx.setDepth(101);

        // Start button
        this.startBtn = this.add.text(width / 2, height * 0.68, '[ ENTER THE ARCHIVE ]', {
            fontFamily: '"Courier New", monospace',
            fontSize: '22px',
            color: '#8899CC',
            letterSpacing: 4,
        }).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true });

        // Button hover effects
        this.startBtn.on('pointerover', () => {
            this.startBtn.setColor('#FFFFFF');
            this.startBtn.setScale(1.05);
        });

        this.startBtn.on('pointerout', () => {
            this.startBtn.setColor('#8899CC');
            this.startBtn.setScale(1.0);
        });

        this.startBtn.on('pointerdown', () => {
            // Fade out transition
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('Act1Scene');
            });
        });

        // Pulsing start button
        this.tweens.add({
            targets: this.startBtn,
            alpha: { from: 0.7, to: 1 },
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Version / footer text
        this.add.text(width / 2, height - 30, 'PROTOTYPE v0.1 — HACKATHON BUILD', {
            fontFamily: '"Courier New", monospace',
            fontSize: '10px',
            color: '#334455'
        }).setOrigin(0.5).setDepth(101);

        // Fade in
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('Act1Scene');
    }
}
