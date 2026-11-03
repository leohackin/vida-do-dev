export type Point = Readonly<{ x: number; y: number }>;
export type ActorId = 'guest' | 'dev' | 'ana' | 'ops' | 'pm';
export type DestinationId = 'entrance' | 'lounge' | 'arcade';

export interface LaneNode extends Point {
  id: string;
  links: readonly string[];
}

export interface InteractionSpot {
  id: string;
  approachNode: string;
  pose: Point & { depth: number; facing: number };
}

export interface Destination {
  id: DestinationId;
  label: string;
  approachNode: string;
  spots?: readonly InteractionSpot[];
}

export const laneNodes: readonly LaneNode[] = [
  { id: 'entrance', x: 850, y: 840, links: ['entry-hall'] },
  { id: 'entry-hall', x: 850, y: 760, links: ['entrance', 'center'] },
  { id: 'center', x: 850, y: 690, links: ['entry-hall', 'lounge-branch', 'east-gate'] },
  { id: 'lounge-branch', x: 760, y: 650, links: ['center', 'sofa-lane'] },
  { id: 'sofa-lane', x: 720, y: 600, links: ['lounge-branch', 'lounge'] },
  { id: 'lounge', x: 650, y: 560, links: ['sofa-lane'] },
  { id: 'east-gate', x: 950, y: 640, links: ['center', 'arcade-door'] },
  { id: 'arcade-door', x: 1160, y: 620, links: ['east-gate', 'arcade-lane'] },
  { id: 'arcade-lane', x: 1160, y: 720, links: ['arcade-door', 'arcade-front'] },
  { id: 'arcade-front', x: 1280, y: 740, links: ['arcade-lane', 'arcade'] },
  { id: 'arcade', x: 1350, y: 720, links: ['arcade-front'] },
] as const;

export const destinations: Record<DestinationId, Destination> = {
  entrance: { id: 'entrance', label: 'Entrada', approachNode: 'entrance' },
  lounge: {
    id: 'lounge', label: 'Descompressão', approachNode: 'lounge',
    spots: [
      { id: 'lounge-left', approachNode: 'lounge', pose: { x: 640, y: 485, depth: 500, facing: 0 } },
      { id: 'lounge-right', approachNode: 'lounge', pose: { x: 755, y: 480, depth: 500, facing: 0 } },
    ],
  },
  arcade: {
    id: 'arcade', label: 'Fliperama', approachNode: 'arcade',
    spots: [
      { id: 'arcade-right', approachNode: 'arcade', pose: { x: 1370, y: 710, depth: 710, facing: 0 } },
    ],
  },
};

export const actors: readonly { id: ActorId; name: string; speed: number }[] = [
  { id: 'guest', name: 'Visitante', speed: 95 },
  { id: 'dev', name: 'O Dev', speed: 84 },
  { id: 'ana', name: 'Ana', speed: 102 },
  { id: 'ops', name: 'Ops', speed: 90 },
  { id: 'pm', name: 'PM', speed: 92 },
] as const;
