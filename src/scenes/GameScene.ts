import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { BLOCKED_TILES, MAP_LAYOUT, TILE_SIZE, TILE_TYPES, TileType } from '../data/mapData';
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

    graphics.fillStyle(0x69c56f, 1);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.generateTexture('grass', TILE_SIZE, TILE_SIZE);

    graphics.clear();
    graphics.fillStyle(0x2f7f3a, 1);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0x3b9348, 1);
    graphics.fillRect(4, 4, 8, 8);
    graphics.fillRect(18, 10, 6, 6);
    graphics.generateTexture('bush', TILE_SIZE, TILE_SIZE);

    graphics.clear();
    graphics.fillStyle(0x9e9e9e, 1);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.lineStyle(2, 0x8a8a8a, 1);
    graphics.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
    graphics.generateTexture('road', TILE_SIZE, TILE_SIZE);

    graphics.clear();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0xc62828, 1);
    graphics.fillRect(0, 0, TILE_SIZE, 10);
    graphics.fillRect(10, 10, 12, 18);
    graphics.generateTexture('shrine', TILE_SIZE, TILE_SIZE);

    graphics.clear();
    graphics.fillStyle(0x5d4037, 1);
    graphics.fillRect(0, 6, TILE_SIZE, TILE_SIZE - 6);
    graphics.fillStyle(0x4e342e, 1);
    graphics.fillRect(0, 0, TILE_SIZE, 7);
    graphics.generateTexture('dojo', TILE_SIZE, TILE_SIZE);

    graphics.clear();
    graphics.fillStyle(0x795548, 1);
    graphics.fillRect(10, 5, 12, 22);
    graphics.fillStyle(0xa1887f, 1);
    graphics.fillRect(4, 7, 8, 18);
    graphics.generateTexture('sign', TILE_SIZE, TILE_SIZE);

    graphics.clear();
    graphics.fillStyle(0xd7ccc8, 1);
    graphics.fillRect(8, 3, 16, 20);
    graphics.fillStyle(0x8d6e63, 1);
    graphics.fillRect(13, 23, 6, 7);
    graphics.generateTexture('lantern', TILE_SIZE, TILE_SIZE);

    graphics.clear();
    graphics.fillStyle(0xfdd835, 1);
    graphics.fillRect(6, 6, 20, 20);
    graphics.generateTexture('npc', TILE_SIZE, TILE_SIZE);

    graphics.clear();
    graphics.fillStyle(0x4fc3f7, 1);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.generateTexture('player', TILE_SIZE, TILE_SIZE);

    graphics.destroy();
  }

  create(): void {
    const blockers: Phaser.GameObjects.Rectangle[] = [];

    for (let y = 0; y < MAP_LAYOUT.length; y += 1) {
      for (let x = 0; x < MAP_LAYOUT[y].length; x += 1) {
        const tileType = MAP_LAYOUT[y][x];
        const texture = this.getTextureByTile(tileType);
        const centerX = x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = y * TILE_SIZE + TILE_SIZE / 2;

        this.add.image(centerX, centerY, texture);

        if (BLOCKED_TILES.has(tileType)) {
          const blocker = this.add.rectangle(centerX, centerY, TILE_SIZE, TILE_SIZE, 0x000000, 0);
          this.physics.add.existing(blocker, true);
          blockers.push(blocker);
        }
      }
    }

    const spawnX = TILE_SIZE * 2;
    const spawnY = TILE_SIZE * 2;
    this.player = new Player(this, spawnX, spawnY);

    for (const bodyObject of blockers) {
      this.physics.add.collider(this.player, bodyObject);
    }

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
      .text(12, 10, 'Boyz Mini RPG - 戰國小村莊測試圖', {
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

  private getTextureByTile(tileType: TileType): string {
    switch (tileType) {
      case TILE_TYPES.BUSH:
        return 'bush';
      case TILE_TYPES.ROAD:
        return 'road';
      case TILE_TYPES.SHRINE:
        return 'shrine';
      case TILE_TYPES.DOJO:
        return 'dojo';
      case TILE_TYPES.SIGN:
        return 'sign';
      case TILE_TYPES.LANTERN:
        return 'lantern';
      case TILE_TYPES.NPC:
        return 'npc';
      default:
        return 'grass';
    }
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
