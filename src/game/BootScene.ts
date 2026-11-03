import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  preload(): void {
    this.load.image('office', 'assets/office-v2.png');
    this.load.image('sofa-front', 'assets/layers/sofa-front.png');
    this.load.spritesheet('walk-guest', 'assets/guest-walksheet.png', { frameWidth: 78, frameHeight: 183 });
    this.load.spritesheet('walk-ana', 'assets/ana-sheet.png', { frameWidth: 78, frameHeight: 183 });
    this.load.spritesheet('walk-ops', 'assets/ops-sheet.png', { frameWidth: 78, frameHeight: 183 });
    this.load.spritesheet('walk-pm', 'assets/pm-sheet.png', { frameWidth: 78, frameHeight: 183 });
    this.load.image('dev-directional', 'assets/dev-directional.png');
    for (const id of ['guest', 'dev', 'ana', 'ops', 'pm']) {
      this.load.spritesheet(`sit-${id}`, `assets/transitions/${id}-sit.png`, { frameWidth: 320, frameHeight: 724 });
    }
  }

  create(): void {
    const devFrames = [
      [[119,35,165,275],[425,36,126,276],[690,35,159,275],[992,36,147,275]],
      [[115,337,170,277],[420,337,133,276],[698,338,164,276],[1000,338,146,276]],
      [[116,638,163,276],[410,638,138,275],[697,638,163,277],[984,639,155,275]],
      [[113,933,161,282],[407,933,148,281],[691,933,166,282],[986,933,156,282]],
    ];
    const devTexture = this.textures.get('dev-directional');
    devFrames.forEach((row, facing) => row.forEach(([x, y, width, height], frame) =>
      devTexture.add(`dev-${facing}-${frame}`, 0, x, y, width, height)));

    for (const id of ['guest', 'dev', 'ana', 'ops', 'pm']) {
      this.anims.create({ key: `sit-${id}-enter`, frames: this.anims.generateFrameNumbers(`sit-${id}`, { start: 0, end: 5 }), frameRate: 9 });
      this.anims.create({ key: `sit-${id}-exit`, frames: [5, 4, 3, 2, 1, 0].map(frame => ({ key: `sit-${id}`, frame })), frameRate: 9 });
    }
    this.scene.start('office');
  }
}
