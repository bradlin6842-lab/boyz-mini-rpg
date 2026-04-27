import Phaser from 'phaser';
import { MonsterData, PlayerBattleState, resetPlayerHp } from '../data/monsterData';

type BattleSceneData = {
  wildMonster: MonsterData;
  playerState: PlayerBattleState;
};

type BattleButtonState = 'command' | 'confirm';

type BattleMenuButton = {
  button: any;
  label: any;
};

export class BattleScene extends Phaser.Scene {
  private wildMonster?: MonsterData;
  private playerState?: PlayerBattleState;

  private wildCurrentHp = 0;

  private playerHpText?: any;
  private wildHpText?: any;
  private sealsText?: any;
  private messageText?: any;

  private attackButton?: BattleMenuButton;
  private catchButton?: BattleMenuButton;
  private runButton?: BattleMenuButton;
  private confirmButton?: BattleMenuButton;

  private messageQueue: string[] = [];
  private buttonState: BattleButtonState = 'command';
  private pendingReturnToMap = false;

  constructor() {
    super('BattleScene');
  }

  init(data: BattleSceneData): void {
    this.wildMonster = data.wildMonster;
    this.playerState = data.playerState;
    this.wildCurrentHp = data.wildMonster.hp;
    this.messageQueue = [];
    this.buttonState = 'command';
    this.pendingReturnToMap = false;
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
    if (!this.wildMonster || !this.playerState) {
      this.scene.start('GameScene');
      return;
    }

    this.cameras.main.setBackgroundColor('#1f2230');

    this.add
      .rectangle(this.scale.width / 2, 100, this.scale.width - 40, 110, 0x000000, 0.55)
      .setStrokeStyle(2, 0xffffff, 0.55);

    this.add.image(120, 100, 'wild-monster-placeholder').setScale(1.4).setTint(0xfff0d0);

    this.add
      .text(220, 70, `野生 ${this.wildMonster.name}`, {
        color: '#ffffff',
        fontFamily: 'Arial',
        fontSize: '28px'
      })
      .setOrigin(0, 0.5);

    this.wildHpText = this.add
      .text(220, 110, '', {
        color: '#e6f0ff',
        fontFamily: 'Arial',
        fontSize: '22px'
      })
      .setOrigin(0, 0.5);

    this.add
      .rectangle(this.scale.width / 2, 270, this.scale.width - 40, 120, 0x000000, 0.55)
      .setStrokeStyle(2, 0xffffff, 0.55);

    this.add.image(120, 270, 'player-monster-placeholder').setScale(1.4).setTint(0xdaf0ff);

    this.add
      .text(220, 240, this.playerState.monster.name, {
        color: '#ffffff',
        fontFamily: 'Arial',
        fontSize: '28px'
      })
      .setOrigin(0, 0.5);

    this.playerHpText = this.add
      .text(220, 280, '', {
        color: '#e6f0ff',
        fontFamily: 'Arial',
        fontSize: '22px'
      })
      .setOrigin(0, 0.5);

    this.sealsText = this.add
      .text(420, 280, '', {
        color: '#ffe6b0',
        fontFamily: 'Arial',
        fontSize: '20px'
      })
      .setOrigin(0, 0.5);

    this.add
      .rectangle(this.scale.width / 2, 410, this.scale.width - 40, 120, 0x000000, 0.75)
      .setStrokeStyle(2, 0xffffff, 0.6);

    this.messageText = this.add
      .text(38, 367, '', {
        color: '#ffffff',
        fontFamily: 'Arial',
        fontSize: '20px',
        wordWrap: { width: this.scale.width - 76, useAdvancedWrap: true }
      })
      .setOrigin(0, 0.5);

    this.attackButton = this.createMenuButton(160, 440, '攻擊', () => {
      this.handleAttack();
    });
    this.catchButton = this.createMenuButton(320, 440, '捕捉', () => {
      this.handleCatch();
    });
    this.runButton = this.createMenuButton(480, 440, '逃跑', () => {
      this.scene.start('GameScene');
    });
    this.confirmButton = this.createMenuButton(320, 440, '確認', () => {
      this.handleConfirm();
    });

    this.updateButtons();
    this.refreshUi();
    this.setMessage(`野生 ${this.wildMonster.name} 出現了！`);
  }

  private createMenuButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void
  ): BattleMenuButton {
    const button = this.add
      .rectangle(x, y, 140, 68, 0x2b2f43, 0.95)
      .setStrokeStyle(2, 0xffffff, 0.7)
      .setInteractive({ useHandCursor: true });

    const buttonLabel = this.add
      .text(x, y, label, {
        color: '#ffffff',
        fontFamily: 'Arial',
        fontSize: '28px'
      })
      .setOrigin(0.5);

    button.on('pointerdown', onClick);
    return { button, label: buttonLabel };
  }

  private handleAttack(): void {
    if (!this.wildMonster || !this.playerState || this.buttonState !== 'command') {
      return;
    }

    const playerDamage = this.calculateDamage(this.playerState.monster.attack, this.wildMonster.defense);
    this.wildCurrentHp = Math.max(0, this.wildCurrentHp - playerDamage);

    this.messageQueue = [`${this.playerState.monster.name} 造成了 ${playerDamage} 點傷害！`];

    if (this.wildCurrentHp <= 0) {
      this.messageQueue.push(`你打倒了 ${this.wildMonster.name}！`);
      this.pendingReturnToMap = true;
      this.openConfirmMode();
      this.refreshUi();
      return;
    }

    this.applyWildCounterAttack();
    this.openConfirmMode();
    this.refreshUi();
  }

  private handleCatch(): void {
    if (!this.wildMonster || !this.playerState || this.buttonState !== 'command') {
      return;
    }

    if (this.playerState.seals <= 0) {
      this.messageQueue = ['封印符用完了！'];
      this.openConfirmMode();
      return;
    }

    this.playerState.seals -= 1;

    const hpRatio = this.wildCurrentHp / this.wildMonster.hp;
    const baseCatchRate = this.wildMonster.baseCatchRate ?? 0.35;
    const catchChance = baseCatchRate * (1 - hpRatio * 0.6);
    const isCaught = Math.random() < catchChance;

    if (isCaught) {
      this.messageQueue = [`成功捕捉了 ${this.wildMonster.name}！`];
      this.pendingReturnToMap = true;
      this.openConfirmMode();
      this.refreshUi();
      return;
    }

    this.messageQueue = [`${this.wildMonster.name} 掙脫了封印！`];
    this.applyWildCounterAttack();
    this.openConfirmMode();
    this.refreshUi();
  }

  private applyWildCounterAttack(): void {
    if (!this.wildMonster || !this.playerState) {
      return;
    }

    const wildDamage = this.calculateDamage(this.wildMonster.attack, this.playerState.monster.defense);
    this.playerState.currentHp = Math.max(0, this.playerState.currentHp - wildDamage);
    this.messageQueue.push(`${this.wildMonster.name} 反擊造成 ${wildDamage} 點傷害！`);

    if (this.playerState.currentHp <= 0) {
      this.messageQueue.push('啾啾倒下了，你被送回村莊入口。');
      resetPlayerHp();
      this.pendingReturnToMap = true;
    }
  }

  private handleConfirm(): void {
    if (this.buttonState !== 'confirm') {
      return;
    }

    if (this.messageQueue.length > 0) {
      const nextMessage = this.messageQueue.shift();
      if (nextMessage) {
        this.setMessage(nextMessage);
      }

      if (this.messageQueue.length === 0) {
        if (this.pendingReturnToMap) {
          this.scene.start('GameScene');
          return;
        }

        this.closeConfirmMode();
      }
    }
  }

  private openConfirmMode(): void {
    this.buttonState = 'confirm';
    this.updateButtons();
    const firstMessage = this.messageQueue.shift();
    if (firstMessage) {
      this.setMessage(firstMessage);
    }
  }

  private closeConfirmMode(): void {
    this.buttonState = 'command';
    this.updateButtons();
    this.setMessage('選擇接下來要執行的行動。');
  }

  private updateButtons(): void {
    const commandVisible = this.buttonState === 'command';

    this.setButtonVisible(this.attackButton, commandVisible);
    this.setButtonVisible(this.catchButton, commandVisible);
    this.setButtonVisible(this.runButton, commandVisible);
    this.setButtonVisible(this.confirmButton, !commandVisible);
  }


  private setButtonVisible(menuButton: BattleMenuButton | undefined, visible: boolean): void {
    menuButton?.button.setVisible(visible).setActive(visible);
    menuButton?.label.setVisible(visible).setActive(visible);
  }
  private calculateDamage(attackerAttack: number, defenderDefense: number): number {
    const randomBonus = Phaser.Math.Between(0, 4);
    return Math.max(1, attackerAttack - defenderDefense + randomBonus);
  }

  private refreshUi(): void {
    if (!this.wildMonster || !this.playerState) {
      return;
    }

    this.wildHpText?.setText(`HP: ${this.wildCurrentHp}/${this.wildMonster.hp}  屬性: ${this.wildMonster.element}`);
    this.playerHpText?.setText(`HP: ${this.playerState.currentHp}/${this.playerState.maxHp}`);
    this.sealsText?.setText(`封印符: ${this.playerState.seals}`);
  }

  private setMessage(text: string): void {
    this.messageText?.setText(text);
  }
}
