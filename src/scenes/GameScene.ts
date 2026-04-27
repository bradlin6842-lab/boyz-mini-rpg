import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { MAP_LAYOUT, TILE_SIZE } from '../data/mapData';
import { MovementInputState, MovementSystem } from '../systems/MovementSystem';

type VirtualDirection = 'up' | 'down' | 'left' | 'right';

type VirtualPadState = Record<VirtualDirection, boolean>;

export class GameScene extends Phaser.Scene {
  private player?: Player;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private readonly movementSystem = new MovementSystem();
  private readonly virtualPadState: VirtualPadState = {
    up: false,
    down: false,
    left: false,
    right: false
  };

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
    const wasd = this.input.keyboard?.addKeys('W,S,A,D') as
      | {
          W: Phaser.Input.Keyboard.Key;
          S: Phaser.Input.Keyboard.Key;
          A: Phaser.Input.Keyboard.Key;
          D: Phaser.Input.Keyboard.Key;
        }
      | undefined;
    this.wasdKeys = wasd
      ? {
          up: wasd.W,
          down: wasd.S,
          left: wasd.A,
          right: wasd.D
        }
      : undefined;

    this.createVirtualDPad();

    this.add
      .text(12, 10, 'Boyz Mini RPG', {
        color: '#ffffff',
        fontFamily: 'Arial',
        fontSize: '18px'
      })
      .setScrollFactor(0)
      .setDepth(20);
  }

  update(): void {
    if (!this.player || !this.cursors) {
      return;
    }

    const movementInput: MovementInputState = {
      left: Boolean(this.cursors.left?.isDown || this.wasdKeys?.left?.isDown || this.virtualPadState.left),
      right: Boolean(this.cursors.right?.isDown || this.wasdKeys?.right?.isDown || this.virtualPadState.right),
      up: Boolean(this.cursors.up?.isDown || this.wasdKeys?.up?.isDown || this.virtualPadState.up),
      down: Boolean(this.cursors.down?.isDown || this.wasdKeys?.down?.isDown || this.virtualPadState.down)
    };

    this.movementSystem.move(this.player, movementInput);
  }

  private createVirtualDPad(): void {
    const buttonSize = 58;
    const spacing = 8;
    const edgePadding = 16;
    const bottomOffset = 18;

    const baseX = this.scale.width - edgePadding - buttonSize;
    const baseY = this.scale.height - edgePadding - buttonSize - bottomOffset;

    this.createDirectionButton(baseX, baseY - (buttonSize + spacing), buttonSize, '↑', 'up');
    this.createDirectionButton(baseX, baseY + (buttonSize + spacing), buttonSize, '↓', 'down');
    this.createDirectionButton(baseX - (buttonSize + spacing), baseY, buttonSize, '←', 'left');
    this.createDirectionButton(baseX + (buttonSize + spacing), baseY, buttonSize, '→', 'right');
  }

  private createDirectionButton(
    x: number,
    y: number,
    size: number,
    label: string,
    direction: VirtualDirection
  ): void {
    const button = this.add
      .rectangle(x, y, size, size, 0x000000, 0.35)
      .setStrokeStyle(2, 0xffffff, 0.45)
      .setScrollFactor(0)
      .setDepth(25)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, label, {
        color: '#ffffff',
        fontFamily: 'Arial',
        fontSize: '28px'
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(26);

    button.on('pointerdown', () => {
      this.virtualPadState[direction] = true;
      button.setFillStyle(0x000000, 0.55);
    });

    const releaseDirection = () => {
      this.virtualPadState[direction] = false;
      button.setFillStyle(0x000000, 0.35);
    };

    button.on('pointerup', releaseDirection);
    button.on('pointerout', releaseDirection);
    button.on('pointerupoutside', releaseDirection as any);
  }
}
