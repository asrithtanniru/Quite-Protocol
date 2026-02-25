import { useRef } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';

function App()
{
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const currentScene = (scene: Phaser.Scene) => {
        // Scene tracking if needed
    }

    return (
        <div id="app" style={{ width: '100%', height: '100%' }}>
            <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
        </div>
    )
}

export default App
