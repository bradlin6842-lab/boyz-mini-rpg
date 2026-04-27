import Phaser from 'phaser';
import { BattleScene } from './scenes/BattleScene';
import { GameScene } from './scenes/GameScene';

const config: any = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 640,
  height: 480,
  backgroundColor: '#2d2f36',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [GameScene, BattleScene]
};

new Phaser.Game(config);
