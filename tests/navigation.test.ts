import { describe, expect, it } from 'vitest';
import { destinations, laneNodes } from '../src/data/sceneManifest';
import { NavigationSystem } from '../src/systems/NavigationSystem';

describe('authored lane graph', () => {
  const navigation = new NavigationSystem();

  it('connects every destination in both directions', () => {
    const nodes = Object.values(destinations).map(destination => destination.approachNode);
    for (const from of nodes) for (const to of nodes) {
      expect(() => navigation.route(from, to)).not.toThrow();
      const route = navigation.route(from, to);
      if (from !== to) expect(route.at(-1)).toEqual(navigation.point(to));
    }
  });

  it('keeps links reciprocal and unique', () => {
    const ids = new Set(laneNodes.map(node => node.id));
    expect(ids.size).toBe(laneNodes.length);
    for (const node of laneNodes) for (const link of node.links) {
      expect(ids.has(link)).toBe(true);
      expect(laneNodes.find(candidate => candidate.id === link)?.links).toContain(node.id);
    }
  });

  it('defines a finite render pose for every interaction spot', () => {
    for (const destination of Object.values(destinations)) for (const spot of destination.spots ?? []) {
      const approach = navigation.point(spot.approachNode);
      expect([approach.x, approach.y, spot.pose.x, spot.pose.y, spot.pose.depth].every(Number.isFinite)).toBe(true);
    }
  });
});
