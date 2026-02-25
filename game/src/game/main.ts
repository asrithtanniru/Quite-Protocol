import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { Act1Scene } from './scenes/Act1Scene';
import { Act2Scene } from './scenes/Act2Scene';
import { Act3Scene } from './scenes/Act3Scene';
import { AUTO, Game } from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#05070B',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
        },
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Act1Scene,
        Act2Scene,
        Act3Scene,
        GameOver,
    ],
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;
