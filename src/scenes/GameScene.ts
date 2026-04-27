import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { BLOCKED_TILES, MAP_LAYOUT, TILE_SIZE, TILE_TYPES, TileType } from '../data/mapData';
import { PLAYER_MONSTER, getRandomWildMonster } from '../data/monsterData';
import { MovementInputState, MovementSystem } from '../systems/MovementSystem';

type VirtualDirection = 'up' | 'down' | 'left' | 'right';
const HERO_TEXTURE_SIZE = 48;
const NPC_TEXTURE_SIZE = 48;

type VirtualPadState = Record<VirtualDirection, boolean>;

type Interactable = {
  id: string;
  x: number;
  y: number;
  message: string;
};

export class GameScene extends Phaser.Scene {
  private player?: Player;
  private cursors?: any;
  private wasdKeys?: {
    up: any;
    down: any;
    left: any;
    right: any;
  };
  private interactKey?: any;
  private readonly movementSystem = new MovementSystem();
  private readonly virtualPadState: VirtualPadState = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  private readonly interactables: Interactable[] = [];
  private nearestInteractable?: Interactable;

  private interactionHintText?: any;
  private interactionButton?: any;

  private dialogBackground?: any;
  private dialogText?: any;
  private dialogPortrait?: any;
  private dialogOpen = false;
  private previousBushTileKey?: string;

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

    this.generateNpcTexture(graphics);

    this.generateHeroTextures(graphics);
    this.generatePortraitTexture(graphics);

    graphics.destroy();
  }

  create(): void {
    const blockers: any[] = [];

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

        if (tileType === TILE_TYPES.NPC) {
          this.interactables.push({
            id: `npc-${x}-${y}`,
            x: centerX,
            y: centerY,
            message: '歡迎來到 Boyz 村，草叢裡聽說有妖怪出沒。'
          });
        }

        if (tileType === TILE_TYPES.SIGN) {
          this.interactables.push({
            id: `sign-${x}-${y}`,
            x: centerX,
            y: centerY,
            message: '北方是神社，東方是道館。'
          });
        }

        if (tileType === TILE_TYPES.SHRINE) {
          this.interactables.push({
            id: `shrine-${x}-${y}`,
            x: centerX,
            y: centerY,
            message: '神社散發溫暖的光，目前補血功能尚未開放。'
          });
        }
      }
    }

    this.interactables.push({
      id: 'dojo-entrance',
      x: TILE_SIZE * 14 + TILE_SIZE / 2,
      y: TILE_SIZE * 8 + TILE_SIZE / 2,
      message: '道館大門緊閉，似乎需要先獲得第一隻妖怪。'
    });

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
    this.interactKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    const wasd = this.input.keyboard?.addKeys('W,S,A,D') as
      | {
          W: any;
          S: any;
          A: any;
          D: any;
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
    this.createInteractionUi();
    this.createPlayerAnimations();

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

    this.nearestInteractable = this.getNearestInteractable();
    const canInteract = Boolean(this.nearestInteractable) && !this.dialogOpen;

    if (this.interactionHintText) {
      this.interactionHintText.setVisible(canInteract);
    }
    if (this.interactionButton) {
      this.interactionButton.setVisible(canInteract);
    }

    const pressedInteractKey = Boolean(this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey));

    if (pressedInteractKey) {
      this.handleInteractionInput();
    }

    if (this.dialogOpen) {
      this.player.setVelocity(0, 0);
      return;
    }

    const movementInput: MovementInputState = {
      left: Boolean(this.cursors.left?.isDown || this.wasdKeys?.left?.isDown || this.virtualPadState.left),
      right: Boolean(this.cursors.right?.isDown || this.wasdKeys?.right?.isDown || this.virtualPadState.right),
      up: Boolean(this.cursors.up?.isDown || this.wasdKeys?.up?.isDown || this.virtualPadState.up),
      down: Boolean(this.cursors.down?.isDown || this.wasdKeys?.down?.isDown || this.virtualPadState.down)
    };

    this.movementSystem.move(this.player, movementInput);
    this.player.updateAnimationFromMovement();
    this.tryTriggerWildEncounter(movementInput);
  }

  private tryTriggerWildEncounter(movementInput: MovementInputState): void {
    if (!this.player) {
      return;
    }

    const isMoving = movementInput.left || movementInput.right || movementInput.up || movementInput.down;
    if (!isMoving) {
      return;
    }

    const tileX = Math.floor(this.player.x / TILE_SIZE);
    const tileY = Math.floor(this.player.y / TILE_SIZE);
    const tileType = MAP_LAYOUT[tileY]?.[tileX];

    if (tileType !== TILE_TYPES.BUSH) {
      this.previousBushTileKey = undefined;
      return;
    }

    const tileKey = `${tileX},${tileY}`;
    if (this.previousBushTileKey === tileKey) {
      return;
    }
    this.previousBushTileKey = tileKey;

    const encounterChance = 0.08;
    if (Math.random() >= encounterChance) {
      return;
    }

    const wildMonster = getRandomWildMonster();
    this.scene.start('BattleScene', {
      wildMonster,
      playerMonster: PLAYER_MONSTER
    });
  }

  private getNearestInteractable(): Interactable | undefined {
    if (!this.player) {
      return undefined;
    }

    const interactionDistance = TILE_SIZE * 1.25;
    const playerX = this.player.x;
    const playerY = this.player.y;

    let closest: Interactable | undefined;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const interactable of this.interactables) {
      const distance = Phaser.Math.Distance.Between(playerX, playerY, interactable.x, interactable.y);
      if (distance <= interactionDistance && distance < closestDistance) {
        closest = interactable;
        closestDistance = distance;
      }
    }

    return closest;
  }

  private handleInteractionInput(): void {
    if (this.dialogOpen) {
      this.closeDialog();
      return;
    }

    if (this.nearestInteractable) {
      this.openDialog(this.nearestInteractable.message);
    }
  }

  private openDialog(message: string): void {
    this.dialogOpen = true;

    if (this.dialogBackground && this.dialogText && this.dialogPortrait) {
      this.dialogBackground.setVisible(true);
      this.dialogPortrait.setVisible(true);
      this.dialogText.setText(message).setVisible(true);
    }

    if (this.interactionHintText) {
      this.interactionHintText.setVisible(false);
    }
    if (this.interactionButton) {
      this.interactionButton.setVisible(false);
    }
  }

  private closeDialog(): void {
    this.dialogOpen = false;

    if (this.dialogBackground && this.dialogText && this.dialogPortrait) {
      this.dialogBackground.setVisible(false);
      this.dialogPortrait.setVisible(false);
      this.dialogText.setVisible(false);
    }
  }

  private createInteractionUi(): void {
    this.interactionHintText = this.add
      .text(this.scale.width / 2, this.scale.height - 18, '按 E 互動', {
        color: '#ffffff',
        fontFamily: 'Arial',
        fontSize: '20px'
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(30)
      .setVisible(false);

    const buttonWidth = 92;
    const buttonHeight = 52;
    this.interactionButton = this.add
      .rectangle(90, this.scale.height - 44, buttonWidth, buttonHeight, 0x000000, 0.4)
      .setStrokeStyle(2, 0xffffff, 0.5)
      .setScrollFactor(0)
      .setDepth(30)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);

    this.add
      .text(90, this.scale.height - 44, '互動', {
        color: '#ffffff',
        fontFamily: 'Arial',
        fontSize: '22px'
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(31);

    this.interactionButton.on('pointerdown', () => {
      this.handleInteractionInput();
    });

    this.dialogBackground = this.add
      .rectangle(this.scale.width / 2, this.scale.height - 82, this.scale.width - 40, 130, 0x000000, 0.86)
      .setStrokeStyle(2, 0xffffff, 0.7)
      .setScrollFactor(0)
      .setDepth(40)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);

    this.dialogPortrait = this.add
      .image(82, this.scale.height - 82, 'hero-portrait')
      .setScale(1.3)
      .setScrollFactor(0)
      .setDepth(41)
      .setVisible(false);

    this.dialogText = this.add
      .text(this.scale.width / 2 + 26, this.scale.height - 82, '', {
        color: '#ffffff',
        fontFamily: 'Arial',
        fontSize: '20px',
        align: 'left',
        wordWrap: { width: this.scale.width - 170, useAdvancedWrap: true }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(41)
      .setVisible(false);

    this.dialogBackground.on('pointerdown', () => {
      this.closeDialog();
    });
    this.dialogText.on('pointerdown', () => {
      this.closeDialog();
    });
    this.dialogText.setInteractive({ useHandCursor: true });
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
  }

  private createPlayerAnimations(): void {
    const directions: VirtualDirection[] = ['down', 'up', 'left', 'right'];

    for (const direction of directions) {
      this.anims.create({
        key: `player-walk-${direction}`,
        frames: [
          { key: `player-${direction}-walk-1` },
          { key: `player-${direction}-idle` },
          { key: `player-${direction}-walk-2` }
        ],
        frameRate: 8,
        repeat: -1
      });
    }
  }

  private generateHeroTextures(graphics: any): void {
    const directions: VirtualDirection[] = ['up', 'down', 'left', 'right'];
    const states: Array<'idle' | 'walk-1' | 'walk-2'> = ['idle', 'walk-1', 'walk-2'];

    for (const direction of directions) {
      for (const state of states) {
        const key = `player-${direction}-${state}`;
        graphics.clear();
        this.drawHeroFrame(graphics, direction, state);
        graphics.generateTexture(key, HERO_TEXTURE_SIZE, HERO_TEXTURE_SIZE);
      }
    }
  }

  private drawHeroFrame(
    graphics: any,
    direction: VirtualDirection,
    state: 'idle' | 'walk-1' | 'walk-2'
  ): void {
    const skin = 0xf4c8a0;
    const skinShadow = 0xd9a982;
    const hair = 0x22222a;
    const headbandLight = 0xe7efff;
    const headbandDark = 0xc0d0ff;
    const robeDark = 0x2e4e86;
    const robeMid = 0x3f63a3;
    const robeLight = 0x6485bf;
    const cloth = 0xeff3fa;
    const shoe = 0x1f2330;

    const leftStep = state === 'walk-1' ? -2 : state === 'walk-2' ? 2 : 0;
    const rightStep = state === 'walk-1' ? 2 : state === 'walk-2' ? -2 : 0;
    const sideBias = direction === 'left' ? -2 : direction === 'right' ? 2 : 0;

    graphics.fillStyle(hair, 1);
    graphics.fillRect(14 + sideBias, 6, 20, 10);

    graphics.fillStyle(headbandLight, 1);
    graphics.fillRect(14 + sideBias, 12, 20, 3);
    graphics.fillStyle(headbandDark, 1);
    graphics.fillRect(15 + sideBias, 13, 18, 1);

    if (direction === 'up') {
      graphics.fillStyle(hair, 1);
      graphics.fillRect(15 + sideBias, 15, 18, 9);
    } else {
      graphics.fillStyle(skin, 1);
      graphics.fillRect(15 + sideBias, 15, 18, 10);
      graphics.fillStyle(skinShadow, 1);
      graphics.fillRect(15 + sideBias, 23, 18, 2);

      if (direction === 'down') {
        graphics.fillStyle(hair, 1);
        graphics.fillRect(17 + sideBias, 17, 3, 3);
        graphics.fillRect(28 + sideBias, 17, 3, 3);
        graphics.fillStyle(0x84473c, 1);
        graphics.fillRect(22 + sideBias, 21, 4, 1);
      }
    }

    graphics.fillStyle(robeDark, 1);
    graphics.fillRect(12 + sideBias, 25, 24, 14);
    graphics.fillStyle(robeMid, 1);
    graphics.fillRect(14 + sideBias, 26, 20, 12);
    graphics.fillStyle(robeLight, 1);
    graphics.fillRect(18 + sideBias, 27, 12, 10);
    graphics.fillStyle(cloth, 1);
    graphics.fillRect(22 + sideBias, 25, 4, 10);

    if (direction === 'left' || direction === 'right') {
      const armX = direction === 'left' ? 10 : 35;
      graphics.fillStyle(skin, 1);
      graphics.fillRect(armX + sideBias, 28, 3, 7);
      graphics.fillStyle(robeLight, 1);
      graphics.fillRect(armX + sideBias + (direction === 'left' ? 1 : -1), 26, 2, 8);
    } else {
      graphics.fillStyle(skin, 1);
      graphics.fillRect(10 + sideBias, 29, 3, 7);
      graphics.fillRect(35 + sideBias, 29, 3, 7);
      graphics.fillStyle(robeLight, 1);
      graphics.fillRect(12 + sideBias, 27, 2, 8);
      graphics.fillRect(34 + sideBias, 27, 2, 8);
    }

    const leftLegX = 17 + sideBias;
    const rightLegX = 25 + sideBias;
    const leftLegY = 38 + leftStep;
    const rightLegY = 38 + rightStep;

    graphics.fillStyle(robeDark, 1);
    graphics.fillRect(leftLegX, leftLegY, 6, 4);
    graphics.fillRect(rightLegX, rightLegY, 6, 4);
    graphics.fillStyle(shoe, 1);
    graphics.fillRect(leftLegX, leftLegY + 4, 7, 3);
    graphics.fillRect(rightLegX, rightLegY + 4, 7, 3);
  }

  private generateNpcTexture(graphics: any): void {
    const skin = 0xf0c39c;
    const hair = 0x3a281f;
    const robeDark = 0x6f4c88;
    const robeLight = 0x8a63aa;
    const apron = 0xd9d1ec;

    graphics.clear();
    graphics.fillStyle(hair, 1);
    graphics.fillRect(14, 6, 20, 11);
    graphics.fillStyle(0xe6f0ff, 1);
    graphics.fillRect(14, 12, 20, 3);

    graphics.fillStyle(skin, 1);
    graphics.fillRect(15, 15, 18, 10);
    graphics.fillStyle(0x6d3e34, 1);
    graphics.fillRect(19, 18, 2, 2);
    graphics.fillRect(27, 18, 2, 2);
    graphics.fillRect(22, 22, 4, 1);

    graphics.fillStyle(robeDark, 1);
    graphics.fillRect(12, 25, 24, 13);
    graphics.fillStyle(robeLight, 1);
    graphics.fillRect(14, 26, 20, 12);
    graphics.fillStyle(apron, 1);
    graphics.fillRect(20, 27, 8, 10);

    graphics.fillStyle(skin, 1);
    graphics.fillRect(10, 28, 3, 7);
    graphics.fillRect(35, 28, 3, 7);

    graphics.fillStyle(0x2d3240, 1);
    graphics.fillRect(17, 38, 6, 4);
    graphics.fillRect(25, 38, 6, 4);
    graphics.fillStyle(0x1c212e, 1);
    graphics.fillRect(17, 42, 7, 3);
    graphics.fillRect(25, 42, 7, 3);

    graphics.generateTexture('npc', NPC_TEXTURE_SIZE, NPC_TEXTURE_SIZE);
  }

  private generatePortraitTexture(graphics: any): void {
    graphics.clear();
    graphics.fillStyle(0x17243d, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0x274571, 1);
    graphics.fillRect(1, 1, 30, 30);

    graphics.fillStyle(0x1d1d21, 1);
    graphics.fillRect(7, 6, 18, 9);
    graphics.fillStyle(0xe8f0ff, 1);
    graphics.fillRect(8, 10, 16, 2);

    graphics.fillStyle(0xf4c8a0, 1);
    graphics.fillRect(9, 13, 14, 10);
    graphics.fillStyle(0x1d1d21, 1);
    graphics.fillRect(12, 16, 2, 2);
    graphics.fillRect(18, 16, 2, 2);
    graphics.fillStyle(0x8b4a3b, 1);
    graphics.fillRect(14, 20, 4, 1);

    graphics.fillStyle(0x2e4e86, 1);
    graphics.fillRect(6, 23, 20, 8);
    graphics.fillStyle(0x49689f, 1);
    graphics.fillRect(8, 24, 16, 7);

    graphics.generateTexture('hero-portrait', 32, 32);
  }
}
