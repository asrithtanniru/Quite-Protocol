import { EventBus } from '../EventBus';
import { Scene, GameObjects } from 'phaser';

export class GameOver extends Scene
{
    private endingTitle!: GameObjects.Text;
    private endingDescription!: GameObjects.Text;

    constructor ()
    {
        super('GameOver');
    }

    create (data: { ending?: string; description?: string })
    {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor(0x030308);
        this.cameras.main.fadeIn(2000, 0, 0, 0);

        // Background with heavy dark tint
        const bg = this.add.image(width / 2, height / 2, 'background');
        bg.setDisplaySize(width, height);
        bg.setTint(0x080810);
        bg.setAlpha(0.3);

        // Scanlines
        const scanlines = this.add.graphics();
        scanlines.setDepth(200);
        scanlines.setAlpha(0.05);
        for (let y = 0; y < height; y += 2) {
            scanlines.fillStyle(0x000000);
            scanlines.fillRect(0, y, width, 1);
        }

        // Protocol complete text
        this.add.text(width / 2, height * 0.2, 'PROTOCOL COMPLETE', {
            fontFamily: '"Courier New", monospace',
            fontSize: '14px',
            color: '#556677',
            letterSpacing: 8
        }).setOrigin(0.5).setDepth(101);

        // Decorative line
        const line = this.add.graphics();
        line.lineStyle(1, 0x334455, 0.4);
        line.lineBetween(width / 2 - 120, height * 0.25, width / 2 + 120, height * 0.25);
        line.setDepth(101);

        // Ending choice display
        const endingText = data?.ending || 'THE QUIET PROTOCOL';
        this.endingTitle = this.add.text(width / 2, height * 0.35, endingText, {
            fontFamily: '"Courier New", monospace',
            fontSize: '28px',
            color: '#DDE7FF',
            align: 'center',
            letterSpacing: 4,
        }).setOrigin(0.5).setDepth(101);

        // Pulsing title
        this.tweens.add({
            targets: this.endingTitle,
            alpha: { from: 0.7, to: 1 },
            duration: 2000,
            yoyo: true,
            repeat: -1
        });

        // Ending description
        const descText = data?.description || 'The archive has been sealed.';
        this.endingDescription = this.add.text(width / 2, height * 0.45, descText, {
            fontFamily: '"Courier New", monospace',
            fontSize: '16px',
            color: '#778899',
            align: 'center',
            fontStyle: 'italic'
        }).setOrigin(0.5).setDepth(101);

        // Narrative conclusion
        const narrativeLines = [
            'The neural archive falls silent.',
            'The corridors of the asylum stand empty once more.',
            'But somewhere in the data streams,',
            'memories continue to echo...',
        ];

        narrativeLines.forEach((line, i) => {
            const text = this.add.text(width / 2, height * 0.55 + i * 25, line, {
                fontFamily: '"Courier New", monospace',
                fontSize: '13px',
                color: '#445566',
                align: 'center'
            }).setOrigin(0.5).setDepth(101).setAlpha(0);

            this.tweens.add({
                targets: text,
                alpha: 1,
                duration: 1000,
                delay: 2000 + i * 800
            });
        });

        // Decorative bottom line
        const line2 = this.add.graphics();
        line2.lineStyle(1, 0x334455, 0.3);
        line2.lineBetween(width / 2 - 180, height * 0.78, width / 2 + 180, height * 0.78);
        line2.setDepth(101);

        // Play again button (appears after delay)
        const playAgain = this.add.text(width / 2, height * 0.85, '[ RETURN TO ARCHIVE ]', {
            fontFamily: '"Courier New", monospace',
            fontSize: '18px',
            color: '#667799',
            letterSpacing: 3
        }).setOrigin(0.5).setDepth(101).setAlpha(0).setInteractive({ useHandCursor: true });

        this.tweens.add({
            targets: playAgain,
            alpha: 1,
            duration: 1000,
            delay: 6000
        });

        playAgain.on('pointerover', () => playAgain.setColor('#FFFFFF'));
        playAgain.on('pointerout', () => playAgain.setColor('#667799'));
        playAgain.on('pointerdown', () => {
            this.cameras.main.fadeOut(1000, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MainMenu');
            });
        });

        // Credits
        this.add.text(width / 2, height - 30, 'THE QUIET PROTOCOL — A HACKATHON PROJECT', {
            fontFamily: '"Courier New", monospace',
            fontSize: '9px',
            color: '#223344'
        }).setOrigin(0.5).setDepth(101);

        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('MainMenu');
    }
}
