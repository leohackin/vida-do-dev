import Phaser from 'phaser';
import { BootScene } from './game/BootScene';
import { OfficeScene } from './game/OfficeScene';
import type { ActorId, DestinationId } from './data/sceneManifest';

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'game',
  width: 1536,
  height: 1024,
  backgroundColor: '#090a0d',
  scene: [BootScene, OfficeScene],
  render: { antialias: true, pixelArt: false, roundPixels: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});

const office = (): OfficeScene | undefined => game.scene.getScene('office') as OfficeScene | undefined;
const character = document.querySelector<HTMLSelectElement>('#character');
document.querySelectorAll<HTMLButtonElement>('[data-destination]').forEach(button => {
  button.addEventListener('click', () => {
    const sent = office()?.send(character?.value as ActorId, button.dataset.destination as DestinationId);
    if (!sent) {
      const status = document.querySelector('#statusText');
      if (status) status.textContent = 'O destino está ocupado ou o personagem ainda está em movimento.';
    }
  });
});

const pause = document.querySelector<HTMLButtonElement>('#pause');
pause?.addEventListener('click', () => {
  const scene = office();
  if (!scene) return;
  scene.setRunning(!scene.isRunning());
  pause.textContent = scene.isRunning() ? 'Pausar' : 'Continuar';
  pause.setAttribute('aria-pressed', String(!scene.isRunning()));
});

export { game };
