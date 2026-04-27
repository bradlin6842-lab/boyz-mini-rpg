import Phaser from 'phaser';
import { MonsterData } from '../data/monsterData';

type BattleSceneData = {
  wildMonster: MonsterData;
  playerMonster: MonsterData;
};

export class BattleScene extends Phaser.Scene {
  private wildMonster?: MonsterData;
  private playerMonster?: MonsterData;

  constructor() {
    super('BattleScene');
  }

  init(data: BattleSceneData): void {
    this.wildMonster = data.wildMonster;
    this.playerMonster = data.playerMonster;
  }

  preload(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x664d2f, 1);
    graphics.fillRect(0, 0, 64, 64);
    graphics.fillStyle(0x9d7a54, 1);
    graphics.fillRect(8, 8, 48, 48);
    graphics.fillStyle(0x3b2f1f, 1);
    graphics.fillRect(18, 20, 8, 8);
    graphics.fillRect(38, 20, 8, 8);
    graphics.fillRect(22, 38, 20, 6);
    graphics.generateTexture('wild-monster-placeholder', 64, 64);

    graphics.clear();
    graphics.fillStyle(0x355e9a, 1);
    graphics.fillRect(0, 0, 64, 64);
    graphics.fillStyle(0x79a9e0, 1);
    graphics.fillRect(8, 8, 48, 48);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(18, 20, 8, 8);
    graphics.fillRect(38, 20, 8, 8);
    graphics.fillStyle(0x1d2f4a, 1);
    graphics.fillRect(22, 38, 20, 6);
    graphics.generateTexture('player-monster-placeholder', 64, 64);

    graphics.destroy();
  }

  create(): void {
    if (!this.wildMonster || !this.playerMonster) {
      this.scene.start('GameScene');
      return;
    }

    this.cameras.main.setBackgroundColor('#1f2230');

    this.add
      .rectangle(this.scale.width / 2, 100, this.scale.width - 40, 110, 0x000000, 0.55)
      .setStrokeStyle(2, 0xffffff, 0.55);

    this.add
      .image(120, 100, 'wild-monster-placeholder')
      .setScale(1.4)
      .setTint(0xfff0d0);

    this.add
      .text(220, 70, `野生 ${this.wildMonster.name}`, {
        color: '#ffffff',
        fontFamily: 'Arial',
        fontSize: '28px'
      })
      .setOrigin(0, 0.5);

    this.add
      .text(220, 110, `HP: ${this.wildMonster.hp}  屬性: ${this.wildMonster.element}`, {
        color: '#e6f0ff',
        fontFamily: 'Arial',
        fontSize: '22px'
      })
      .setOrigin(0, 0.5);

    this.add
      .rectangle(this.scale.width / 2, 270, this.scale.width - 40, 120, 0x000000, 0.55)
      .setStrokeStyle(2, 0xffffff, 0.55);

    this.add
      .image(120, 270, 'player-monster-placeholder')
      .setScale(1.4)
      .setTint(0xdaf0ff);

    this.add
      .text(220, 240, this.playerMonster.name, {
        color: '#ffffff',
        fontFamily: 'Arial',
        fontSize: '28px'
      })
      .setOrigin(0, 0.5);

    this.add
      .text(220, 280, `HP: ${this.playerMonster.hp}`, {
        color: '#e6f0ff',
        fontFamily: 'Arial',
        fontSize: '22px'
      })
      .setOrigin(0, 0.5);

    this.add
      .rectangle(this.scale.width / 2, 410, this.scale.width - 40, 120, 0x000000, 0.75)
      .setStrokeStyle(2, 0xffffff, 0.6);

    this.createMenuButton(160, 410, '攻擊', () => {
      this.showStubMessage('攻擊功能開發中');
    });
    this.createMenuButton(320, 410, '捕捉', () => {
      this.showStubMessage('捕捉功能開發中');
    });
    this.createMenuButton(480, 410, '逃跑', () => {
      this.scene.start('GameScene');
    });
  }

  private createMenuButton(x: number, y: number, label: string, onClick: () => void): void {
    const button = this.add
      .rectangle(x, y, 140, 68, 0x2b2f43, 0.95)
      .setStrokeStyle(2, 0xffffff, 0.7)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, label, {
        color: '#ffffff',
        fontFamily: 'Arial',
        fontSize: '28px'
      })
      .setOrigin(0.5);

    button.on('pointerdown', onClick);
  }

  private showStubMessage(text: string): void {
    const message = this.add
      .text(this.scale.width / 2, 352, text, {
        color: '#ffd5d5',
        fontFamily: 'Arial',
        fontSize: '20px'
      })
      .setOrigin(0.5);

    this.time.delayedCall(800, () => {
      message.destroy();
    });
  }
}
