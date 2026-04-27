export class MovementSystem {
  private readonly speed = 140;

  public move(player: any, cursors: any): void {
    player.setVelocity(0);

    if (cursors.left?.isDown) {
      player.setVelocityX(-this.speed);
    } else if (cursors.right?.isDown) {
      player.setVelocityX(this.speed);
    }

    if (cursors.up?.isDown) {
      player.setVelocityY(-this.speed);
    } else if (cursors.down?.isDown) {
      player.setVelocityY(this.speed);
    }

    player.body.velocity.normalize().scale(this.speed);
  }
}
