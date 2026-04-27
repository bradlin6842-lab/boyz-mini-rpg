import Phaser from 'phaser';

type FacingDirection = 'up' | 'down' | 'left' | 'right';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private facing: FacingDirection = 'down';

  constructor(scene: any, x: number, y: number) {
    super(scene, x, y, 'player-down-idle');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(20, 16);
    this.setOffset(14, 30);
  }

  public updateAnimationFromMovement(): void {
    const velocityX = this.body.velocity.x;
    const velocityY = this.body.velocity.y;
    const moving = velocityX !== 0 || velocityY !== 0;

    if (Math.abs(velocityX) > Math.abs(velocityY)) {
      this.facing = velocityX > 0 ? 'right' : 'left';
    } else if (velocityY !== 0) {
      this.facing = velocityY > 0 ? 'down' : 'up';
    }

    if (moving) {
      this.play(`player-walk-${this.facing}`, true);
      return;
    }

    this.anims.stop();
    this.setTexture(`player-${this.facing}-idle`);
  }
}
