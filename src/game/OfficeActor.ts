import Phaser from 'phaser';
import type { ActorId, InteractionSpot, Point } from '../data/sceneManifest';

export type ActorState = 'idle' | 'walking' | 'entering' | 'seated' | 'exiting';

export class OfficeActor {
  readonly sprite: Phaser.GameObjects.Sprite;
  state: ActorState = 'idle';
  currentNode = 'entrance';
  currentSpot: InteractionSpot | null = null;
  private route: Point[] = [];
  private elapsed = 0;
  private onArrive: (() => void) | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly id: ActorId,
    readonly name: string,
    readonly speed: number,
    start: Point,
  ) {
    const texture = id === 'dev' ? 'dev-directional' : `walk-${id}`;
    const frame = id === 'dev' ? 'dev-0-1' : 0;
    this.sprite = scene.add.sprite(start.x, start.y, texture, frame).setOrigin(.5, 1).setVisible(id === 'guest');
    this.applyWalkingScale();
    this.sprite.setDepth(start.y);
  }

  activate(start: Point): void {
    if (this.sprite.visible) return;
    this.sprite.setPosition(start.x, start.y).setAlpha(1).setVisible(true).setDepth(start.y);
    this.currentNode = 'entrance';
  }

  walk(points: Point[], destinationNode: string, onArrive?: () => void): void {
    this.currentSpot = null;
    this.route = points.map(point => ({ ...point }));
    this.currentNode = destinationNode;
    this.onArrive = onArrive ?? null;
    this.state = this.route.length ? 'walking' : 'idle';
    if (!this.route.length) this.finishRoute();
  }

  leaveSeat(approach: Point, afterExit: () => void): void {
    if (this.state !== 'seated' || !this.currentSpot) { afterExit(); return; }
    this.state = 'exiting';
    const spot = this.currentSpot;
    this.sprite.setTexture(`sit-${this.id}`, 5).setDisplaySize(320 / 724 * 183, 183).setAlpha(1);
    this.sprite.play(`sit-${this.id}-exit`);
    const motion = { progress: 0 };
    this.scene.tweens.add({
      targets: motion, progress: 1, duration: 650, ease: 'Linear',
      onUpdate: () => this.placeTransition(spot, spot.pose, approach, motion.progress, true),
      onComplete: () => {
        this.currentSpot = null;
        this.sprite.anims.stop();
        this.sprite.setTexture(this.id === 'dev' ? 'dev-directional' : `walk-${this.id}`, this.id === 'dev' ? 'dev-0-1' : 0);
        this.applyWalkingScale();
        this.sprite.setPosition(approach.x, approach.y).setDepth(approach.y).setAlpha(1);
        afterExit();
      },
    });
  }

  sit(spot: InteractionSpot): void {
    this.state = 'entering';
    this.currentSpot = spot;
    this.sprite.setTexture(`sit-${this.id}`, 0).setDisplaySize(320 / 724 * 183, 183).setAlpha(1);
    this.sprite.play(`sit-${this.id}-enter`);
    const approach = { x: this.sprite.x, y: this.sprite.y };
    const motion = { progress: 0 };
    this.scene.tweens.add({
      targets: motion, progress: 1, duration: 650, ease: 'Linear',
      onUpdate: () => this.placeTransition(spot, approach, spot.pose, motion.progress, false),
      onComplete: () => {
        this.sprite.anims.stop();
        this.sprite.setTexture(`sit-${this.id}`, 5).setPosition(spot.pose.x, spot.pose.y).setDepth(spot.pose.depth).setAlpha(1);
        this.state = 'seated';
      },
    });
  }

  update(deltaMs: number): void {
    this.elapsed += deltaMs / 1000;
    if (this.state !== 'walking' || !this.route.length) return;
    const target = this.route[0];
    const dx = target.x - this.sprite.x;
    const dy = target.y - this.sprite.y;
    const distance = Math.hypot(dx, dy);
    const step = Math.min(this.speed * deltaMs / 1000, distance);
    if (distance > 0) this.sprite.setPosition(this.sprite.x + dx / distance * step, this.sprite.y + dy / distance * step);
    this.sprite.setDepth(this.sprite.y);
    this.applyWalkFrame(dx, dy);
    if (distance <= step + .001) {
      this.sprite.setPosition(target.x, target.y);
      this.route.shift();
      if (!this.route.length) this.finishRoute();
    }
  }

  setPaused(paused: boolean): void {
    if (paused) this.sprite.anims.pause();
    else this.sprite.anims.resume();
  }

  private placeTransition(spot: InteractionSpot, from: Point, to: Point, progress: number, exiting: boolean): void {
    const rules = spot.transition;
    const moveAfter = rules?.moveAfter ?? 0;
    const travel = Phaser.Math.Clamp((progress - moveAfter) / (1 - moveAfter), 0, 1);
    const eased = Phaser.Math.Easing.Sine.InOut(travel);
    this.sprite.setPosition(
      Phaser.Math.Linear(from.x, to.x, eased),
      Phaser.Math.Linear(from.y, to.y, eased),
    );
    if (!rules) {
      this.sprite.setDepth(this.sprite.y);
      return;
    }
    const behindForeground = exiting ? progress < rules.occludeAfter : progress >= rules.occludeAfter;
    this.sprite.setDepth(behindForeground ? spot.pose.depth : rules.frontDepth);
  }

  private finishRoute(): void {
    this.state = 'idle';
    const callback = this.onArrive;
    this.onArrive = null;
    callback?.();
  }

  private applyWalkFrame(dx: number, dy: number): void {
    const frame = Math.floor(this.elapsed * 8) % (this.id === 'dev' ? 4 : 6);
    if (this.id === 'dev') {
      const facing = dy >= 0 ? (dx >= 0 ? 0 : 1) : (dx >= 0 ? 2 : 3);
      this.sprite.setFrame(`dev-${facing}-${frame}`);
    } else {
      const row = dx < 0 ? 1 : 0;
      this.sprite.setFrame(row * 6 + frame);
    }
    this.applyWalkingScale();
  }

  private applyWalkingScale(): void {
    const targetHeight = this.id === 'dev' ? 148 : 183;
    this.sprite.setDisplaySize(this.sprite.width / this.sprite.height * targetHeight, targetHeight);
  }
}
