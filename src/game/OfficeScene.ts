import Phaser from 'phaser';
import { actors as actorDefs, destinations, laneNodes, type ActorId, type DestinationId, type InteractionSpot } from '../data/sceneManifest';
import { NavigationSystem } from '../systems/NavigationSystem';
import { OfficeActor } from './OfficeActor';

export class OfficeScene extends Phaser.Scene {
  readonly navigation = new NavigationSystem();
  readonly actors = new Map<ActorId, OfficeActor>();
  readonly reservations = new Map<string, ActorId>();
  private running = true;

  constructor() { super('office'); }

  create(): void {
    this.add.image(0, 0, 'office').setOrigin(0).setDepth(0);
    const entrance = this.navigation.point('entrance');
    for (const definition of actorDefs) {
      this.actors.set(definition.id, new OfficeActor(this, definition.id, definition.name, definition.speed, entrance));
    }
    // This transparent patch contains only the pixels that belong in front of
    // a seated body. Walking lanes never enter its footprint.
    this.add.image(0, 0, 'sofa-front').setOrigin(0).setDepth(560);
    if (new URLSearchParams(location.search).has('lanes')) this.drawLanes();
    (window as Window & { __officeV2?: OfficeScene }).__officeV2 = this;
    window.dispatchEvent(new Event('office-ready'));
  }

  update(_time: number, delta: number): void {
    if (!this.running) return;
    for (const actor of this.actors.values()) actor.update(delta);
  }

  send(actorId: ActorId, destinationId: DestinationId): boolean {
    const actor = this.actors.get(actorId);
    const destination = destinations[destinationId];
    if (!actor || !destination || ['walking', 'entering', 'exiting'].includes(actor.state)) return false;
    actor.activate(this.navigation.point('entrance'));

    let selectedSpot: InteractionSpot | null = null;
    if (destination.spots) {
      selectedSpot = destination.spots.find(spot => {
        const owner = this.reservations.get(spot.id);
        return owner === undefined || owner === actorId;
      }) ?? null;
      if (!selectedSpot) return false;
    }

    const previousSpot = actor.currentSpot;
    if (previousSpot) this.reservations.delete(previousSpot.id);
    if (selectedSpot) this.reservations.set(selectedSpot.id, actorId);
    const approachNode = selectedSpot?.approachNode ?? destination.approachNode;
    const beginRoute = () => {
      const route = this.navigation.route(actor.currentNode, approachNode);
      actor.walk(route, approachNode, selectedSpot ? () => actor.sit(selectedSpot!) : undefined);
      this.setStatus('A CAMINHO', `${actor.name} → ${destination.label}`);
    };
    if (previousSpot) actor.leaveSeat(this.navigation.point(actor.currentNode), beginRoute);
    else beginRoute();
    return true;
  }

  setRunning(running: boolean): void {
    this.running = running;
    this.tweens.timeScale = running ? 1 : 0;
    for (const actor of this.actors.values()) actor.setPaused(!running);
  }

  isRunning(): boolean { return this.running; }

  private setStatus(name: string, text: string): void {
    const statusName = document.querySelector('#statusName');
    const statusText = document.querySelector('#statusText');
    const stageNote = document.querySelector('#stageNote');
    if (statusName) statusName.textContent = name;
    if (statusText) statusText.textContent = text;
    if (stageNote) stageNote.textContent = text;
  }

  private drawLanes(): void {
    const graphics = this.add.graphics().setDepth(2000);
    graphics.lineStyle(4, 0x32ff90, .8);
    for (const node of laneNodes) {
      for (const link of node.links) {
        const target = laneNodes.find(candidate => candidate.id === link);
        if (target) graphics.lineBetween(node.x, node.y, target.x, target.y);
      }
      graphics.fillStyle(0xffd33d).fillCircle(node.x, node.y, 8);
    }
  }
}
