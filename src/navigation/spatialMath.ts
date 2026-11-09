import { Direction, FocusableNode } from '../types/navigation';

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

function getRect(element: HTMLElement): Rect {
  const domRect = element.getBoundingClientRect();
  return {
    left: domRect.left,
    right: domRect.right,
    top: domRect.top,
    bottom: domRect.bottom,
    centerX: domRect.left + domRect.width / 2,
    centerY: domRect.top + domRect.height / 2,
    width: domRect.width,
    height: domRect.height,
  };
}

/**
 * Spatial navigation algorithm:
 * Given a current focused node and candidates, find the most geometrically natural
 * node in the specified direction.
 */
export function findNearestNeighbor(
  current: FocusableNode,
  candidates: FocusableNode[],
  direction: Direction
): FocusableNode | null {
  const currentRect = getRect(current.element);
  let bestCandidate: FocusableNode | null = null;
  let minScore = Infinity;

  // Threshold to avoid slight pixel alignment miscalculations
  const SLOP = 4;

  for (const candidate of candidates) {
    if (candidate.id === current.id) continue;
    if (!candidate.element || !candidate.element.isConnected) continue;

    // Check visibility
    const style = window.getComputedStyle(candidate.element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      continue;
    }

    const targetRect = getRect(candidate.element);

    let primaryDist = 0;
    let secondaryDist = 0;
    let isValid = false;

    switch (direction) {
      case 'left':
        if (targetRect.centerX < currentRect.centerX - SLOP) {
          isValid = true;
          primaryDist = currentRect.centerX - targetRect.centerX;
          secondaryDist = Math.abs(currentRect.centerY - targetRect.centerY);
        }
        break;

      case 'right':
        if (targetRect.centerX > currentRect.centerX + SLOP) {
          isValid = true;
          primaryDist = targetRect.centerX - currentRect.centerX;
          secondaryDist = Math.abs(currentRect.centerY - targetRect.centerY);
        }
        break;

      case 'up':
        if (targetRect.centerY < currentRect.centerY - SLOP) {
          isValid = true;
          primaryDist = currentRect.centerY - targetRect.centerY;
          secondaryDist = Math.abs(currentRect.centerX - targetRect.centerX);
        }
        break;

      case 'down':
        if (targetRect.centerY > currentRect.centerY + SLOP) {
          isValid = true;
          primaryDist = targetRect.centerY - currentRect.centerY;
          secondaryDist = Math.abs(currentRect.centerX - targetRect.centerX);
        }
        break;
    }

    if (isValid) {
      // Prioritize the direction aligned on the primary axis; heavily penalize orthogonal divergence.
      // Score = primaryDistance + (secondaryDistance * 2.5)
      const score = primaryDist + secondaryDist * 2.5;

      if (score < minScore) {
        minScore = score;
        bestCandidate = candidate;
      }
    }
  }

  return bestCandidate;
}
