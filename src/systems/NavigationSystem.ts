import { laneNodes, type LaneNode, type Point } from '../data/sceneManifest';

export class NavigationSystem {
  private readonly nodes = new Map<string, LaneNode>(laneNodes.map(node => [node.id, node]));

  point(id: string): Point {
    const node = this.nodes.get(id);
    if (!node) throw new Error(`Unknown lane node: ${id}`);
    return node;
  }

  route(from: string, to: string): Point[] {
    if (from === to) return [];
    const distance = new Map<string, number>([[from, 0]]);
    const previous = new Map<string, string>();
    const open = new Set<string>([from]);
    while (open.size) {
      const current = [...open].reduce((best, id) =>
        (distance.get(id) ?? Infinity) < (distance.get(best) ?? Infinity) ? id : best);
      open.delete(current);
      if (current === to) break;
      const node = this.nodes.get(current);
      if (!node) throw new Error(`Unknown lane node: ${current}`);
      for (const nextId of node.links) {
        const next = this.nodes.get(nextId);
        if (!next) throw new Error(`Unknown linked lane node: ${nextId}`);
        const candidate = (distance.get(current) ?? Infinity) + Math.hypot(next.x - node.x, next.y - node.y);
        if (candidate < (distance.get(nextId) ?? Infinity)) {
          distance.set(nextId, candidate);
          previous.set(nextId, current);
          open.add(nextId);
        }
      }
    }
    if (!distance.has(to)) throw new Error(`No lane route from ${from} to ${to}`);
    const ids: string[] = [];
    for (let cursor: string | undefined = to; cursor && cursor !== from; cursor = previous.get(cursor)) ids.unshift(cursor);
    return ids.map(id => this.point(id));
  }
}
