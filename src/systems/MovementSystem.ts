export type MovementInputState = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

export class MovementSystem {
  private readonly speed = 140;

  public move(player: any, input: MovementInputState): void {
    player.setVelocity(0);

    if (input.left) {
      player.setVelocityX(-this.speed);
    } else if (input.right) {
      player.setVelocityX(this.speed);
    }

    if (input.up) {
      player.setVelocityY(-this.speed);
    } else if (input.down) {
      player.setVelocityY(this.speed);
    }

    player.body.velocity.normalize().scale(this.speed);
  }
}
