const phaser: any = (window as Window & { Phaser?: unknown }).Phaser;

if (!phaser) {
  throw new Error('Phaser global is not available. Ensure CDN script is loaded before app entry.');
}

export default phaser;
