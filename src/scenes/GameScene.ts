import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { MAP_LAYOUT, TILE_SIZE } from '../data/mapData';
import { MovementSystem } from '../systems/MovementSystem';

export class GameScene extends Phaser.Scene {
  private player?: Player;
  private cursors?: any;
  private readonly movementSystem = new MovementSystem();

  constructor() {
    super('GameScene');
  }

  preload(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x4caf50, 1);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.generateTexture('grass', TILE_SIZE, TILE_SIZE);

    graphics.clear();
    graphics.fillStyle(0x5d4037, 1);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.generateTexture('wall', TILE_SIZE, TILE_SIZE);

    graphics.clear();
    graphics.fillStyle(0x4fc3f7, 1);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.generateTexture('player', TILE_SIZE, TILE_SIZE);

    graphics.destroy();
  }

  create(): void {
    for (let y = 0; y < MAP_LAYOUT.length; y += 1) {
      for (let x = 0; x < MAP_LAYOUT[y].length; x += 1) {
        const tileType = MAP_LAYOUT[y][x];
        const texture = tileType === 1 ? 'wall' : 'grass';
        this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, texture);
      }
    }

    const spawnX = TILE_SIZE * 2;
    const spawnY = TILE_SIZE * 2;
    this.player = new Player(this, spawnX, spawnY);

    const worldWidth = MAP_LAYOUT[0].length * TILE_SIZE;
    const worldHeight = MAP_LAYOUT.length * TILE_SIZE;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    this.cursors = this.input.keyboard?.createCursorKeys();

    this.add
      .text(12, 10, 'Boyz Mini RPG', {
        color: '#ffffff',
        fontFamily: 'Arial',
        fontSize: '18px'
      })
      .setScrollFactor(0);
  }

  update(): void {
    if (!this.player || !this.cursors) {
      return;
    }

    this.movementSystem.move(this.player, this.cursors);
  }
}
