import { describe, it, expect, beforeEach } from 'vitest';
import { findNearestNeighbor } from '../spatialMath';
import { FocusableNode } from '../../types/navigation';

describe('Spatial Navigation Math', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
  });

  function createMockNode(id: string, left: number, top: number, width = 100, height = 50): FocusableNode {
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);

    // Mock getBoundingClientRect
    el.getBoundingClientRect = () => ({
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
      x: left,
      y: top,
      toJSON: () => {},
    });

    return {
      id,
      element: el,
    };
  }

  it('correctly navigates right across horizontally aligned nodes', () => {
    const nodeA = createMockNode('node-a', 0, 100);
    const nodeB = createMockNode('node-b', 150, 100);
    const nodeC = createMockNode('node-c', 300, 100);

    const neighbor = findNearestNeighbor(nodeA, [nodeA, nodeB, nodeC], 'right');
    expect(neighbor?.id).toBe('node-b');
  });

  it('correctly navigates down across vertically aligned nodes', () => {
    const nodeA = createMockNode('node-a', 100, 0);
    const nodeB = createMockNode('node-b', 100, 150);
    const nodeC = createMockNode('node-c', 100, 300);

    const neighbor = findNearestNeighbor(nodeA, [nodeA, nodeB, nodeC], 'down');
    expect(neighbor?.id).toBe('node-b');
  });

  it('correctly handles navigation left and up', () => {
    const nodeA = createMockNode('node-a', 200, 200);
    const nodeLeft = createMockNode('node-left', 50, 200);
    const nodeUp = createMockNode('node-up', 200, 50);

    const leftNeighbor = findNearestNeighbor(nodeA, [nodeA, nodeLeft, nodeUp], 'left');
    expect(leftNeighbor?.id).toBe('node-left');

    const upNeighbor = findNearestNeighbor(nodeA, [nodeA, nodeLeft, nodeUp], 'up');
    expect(upNeighbor?.id).toBe('node-up');
  });

  it('returns null if no node exists in requested direction', () => {
    const nodeA = createMockNode('node-a', 100, 100);
    const nodeBelow = createMockNode('node-below', 100, 300);

    const upNeighbor = findNearestNeighbor(nodeA, [nodeA, nodeBelow], 'up');
    expect(upNeighbor).toBeNull();
  });
});
