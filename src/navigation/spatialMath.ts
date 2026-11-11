import { ActiveView, Direction, FocusableNode } from '../types/navigation';

export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

export interface NavigationOptions {
  activeView: ActiveView;
  lastFocusedByGroup?: Map<string, string>;
  lastFocusedContentId?: string | null;
}

export function getRect(element: HTMLElement): Rect {
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

export function isVisible(element: HTMLElement): boolean {
  if (!element || !element.isConnected) return false;
  if (typeof window === 'undefined') return true;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

function findClosestByX(targetCenterX: number, candidates: FocusableNode[]): FocusableNode | null {
  if (candidates.length === 0) return null;
  let best: FocusableNode | null = null;
  let minDiff = Infinity;
  for (const c of candidates) {
    const rect = getRect(c.element);
    const diff = Math.abs(rect.centerX - targetCenterX);
    if (diff < minDiff) {
      minDiff = diff;
      best = c;
    }
  }
  return best;
}

export function findClosestByY(targetCenterY: number, candidates: FocusableNode[]): FocusableNode | null {
  if (candidates.length === 0) return null;
  let best: FocusableNode | null = null;
  let minDiff = Infinity;
  for (const c of candidates) {
    const rect = getRect(c.element);
    const diff = Math.abs(rect.centerY - targetCenterY);
    if (diff < minDiff) {
      minDiff = diff;
      best = c;
    }
  }
  return best;
}

/**
 * Groups grid items into visual rows by matching vertical proximity (centerY within 40px).
 * Rows are returned from top to bottom; each row is sorted from left to right.
 */
function getVisualRows(nodes: FocusableNode[]): FocusableNode[][] {
  if (nodes.length === 0) return [];

  // Sort by top ascending
  const sorted = [...nodes].sort((a, b) => {
    const rA = getRect(a.element);
    const rB = getRect(b.element);
    return rA.top - rB.top;
  });

  const rows: FocusableNode[][] = [];
  for (const node of sorted) {
    const rect = getRect(node.element);
    let added = false;
    for (const row of rows) {
      const rowCenterY = getRect(row[0].element).centerY;
      if (Math.abs(rect.centerY - rowCenterY) <= 45) {
        row.push(node);
        added = true;
        break;
      }
    }
    if (!added) {
      rows.push([node]);
    }
  }

  // Sort each row left-to-right
  for (const row of rows) {
    row.sort((a, b) => getRect(a.element).left - getRect(b.element).left);
  }

  return rows;
}

/**
 * Finds the appropriate active sidebar item matching the current view.
 */
export function getActiveSidebarItem(activeView: ActiveView, candidates: FocusableNode[]): FocusableNode | null {
  const sidebarItems = candidates.filter((c) => c.group === 'sidebar');
  if (sidebarItems.length === 0) return null;

  let targetId = 'sidebar-home';
  if (activeView === 'library' || activeView === 'albums' || activeView === 'album-detail' || activeView === 'artists' || activeView === 'artist-detail') {
    targetId = 'sidebar-library';
  } else if (activeView === 'now-playing') {
    targetId = 'sidebar-now-playing';
  } else if (activeView === 'search') {
    targetId = 'sidebar-search';
  } else if (activeView === 'settings') {
    targetId = 'sidebar-settings';
  }

  const exact = sidebarItems.find((s) => s.id === targetId);
  return exact || sidebarItems[0];
}

/**
 * Finds the default primary entry point for a view when entering from the sidebar rail.
 */
export function getViewEntryPoint(
  activeView: ActiveView,
  candidates: FocusableNode[],
  lastFocusedContentId?: string | null
): FocusableNode | null {
  // 1. Try to return to the last focused content element if still connected
  if (lastFocusedContentId) {
    const remembered = candidates.find((c) => c.id === lastFocusedContentId && isVisible(c.element));
    if (remembered) return remembered;
  }

  const contentCandidates = candidates.filter((c) => c.group !== 'sidebar' && c.group !== 'bottom-dock' && isVisible(c.element));
  if (contentCandidates.length === 0) return null;

  switch (activeView) {
    case 'home': {
      const heroResume = contentCandidates.find((c) => c.id === 'hero-resume');
      if (heroResume) return heroResume;
      const heroGroup = contentCandidates.filter((c) => c.group === 'hero-actions');
      if (heroGroup.length > 0) return heroGroup[0];
      const continueGroup = contentCandidates.filter((c) => c.group === 'continue-shelf');
      if (continueGroup.length > 0) return continueGroup[0];
      break;
    }
    case 'library':
    case 'albums': {
      const firstTab = contentCandidates.find((c) => c.id === 'library-tab-albums');
      if (firstTab) return firstTab;
      const tabGroup = contentCandidates.filter((c) => c.group === 'library-tabs');
      if (tabGroup.length > 0) return tabGroup[0];
      break;
    }
    case 'album-detail': {
      const playBtn = contentCandidates.find((c) => c.id === 'album-btn-play');
      if (playBtn) return playBtn;
      const actionGroup = contentCandidates.filter((c) => c.group === 'album-actions');
      if (actionGroup.length > 0) return actionGroup[0];
      break;
    }
    case 'artists': {
      const artistCards = contentCandidates.filter((c) => c.group === 'artists-grid');
      if (artistCards.length > 0) return artistCards[0];
      break;
    }
    case 'now-playing': {
      const playBtn = contentCandidates.find((c) => c.id === 'np-ctrl-play');
      if (playBtn) return playBtn;
      break;
    }
    case 'settings': {
      const firstInput = contentCandidates.find((c) => c.id === 'input-server-url');
      if (firstInput) return firstInput;
      break;
    }
  }

  return contentCandidates[0];
}

/**
 * Intelligent 10-foot Smart TV spatial navigation engine with row/zone hierarchy.
 */
export function findNextFocusableNode(
  current: FocusableNode,
  allCandidates: FocusableNode[],
  direction: Direction,
  options: NavigationOptions
): FocusableNode | null {
  const validCandidates = allCandidates.filter(
    (c) => c.id !== current.id && c.element && isVisible(c.element)
  );
  if (validCandidates.length === 0) return null;

  const currentRect = getRect(current.element);
  const currentGroup = current.group || 'default';
  const { activeView, lastFocusedByGroup, lastFocusedContentId } = options;

  // =========================================================================
  // 1. NAVIGATION WITHIN SIDEBAR RAIL
  // =========================================================================
  if (currentGroup === 'sidebar') {
    const sidebarNodes = validCandidates.filter((c) => c.group === 'sidebar');

    if (direction === 'up') {
      const above = sidebarNodes.filter((c) => getRect(c.element).centerY < currentRect.centerY - 2);
      if (above.length === 0) return null;
      // Closest above
      return above.reduce((best, c) => {
        const dist = currentRect.centerY - getRect(c.element).centerY;
        const bestDist = currentRect.centerY - getRect(best.element).centerY;
        return dist < bestDist ? c : best;
      });
    }

    if (direction === 'down') {
      const below = sidebarNodes.filter((c) => getRect(c.element).centerY > currentRect.centerY + 2);
      if (below.length === 0) return null;
      // Closest below
      return below.reduce((best, c) => {
        const dist = getRect(c.element).centerY - currentRect.centerY;
        const bestDist = getRect(best.element).centerY - currentRect.centerY;
        return dist < bestDist ? c : best;
      });
    }

    if (direction === 'left') {
      return null; // Leftmost rail barrier
    }

    if (direction === 'right') {
      // Transition from Sidebar into Main Content
      return getViewEntryPoint(activeView, validCandidates, lastFocusedContentId);
    }
  }

  // =========================================================================
  // 2. NAVIGATION WITHIN BOTTOM PLAYER DOCK
  // =========================================================================
  if (currentGroup === 'bottom-dock') {
    const dockNodes = validCandidates.filter((c) => c.group === 'bottom-dock');

    if (direction === 'left') {
      const toLeft = dockNodes.filter((c) => getRect(c.element).centerX < currentRect.centerX - 4);
      if (toLeft.length > 0) {
        // Nearest to the left
        return toLeft.reduce((best, c) => {
          const dist = currentRect.centerX - getRect(c.element).centerX;
          const bestDist = currentRect.centerX - getRect(best.element).centerX;
          return dist < bestDist ? c : best;
        });
      }
      // Reached leftmost item in bottom dock -> transition to Sidebar
      return getActiveSidebarItem(activeView, validCandidates);
    }

    if (direction === 'right') {
      const toRight = dockNodes.filter((c) => getRect(c.element).centerX > currentRect.centerX + 4);
      if (toRight.length > 0) {
        return toRight.reduce((best, c) => {
          const dist = getRect(c.element).centerX - currentRect.centerX;
          const bestDist = getRect(best.element).centerX - currentRect.centerX;
          return dist < bestDist ? c : best;
        });
      }
      return null;
    }

    if (direction === 'down') {
      return null; // Bottommost barrier
    }

    if (direction === 'up') {
      // Transition from Bottom Dock back into Main Content!
      if (lastFocusedContentId) {
        const remembered = validCandidates.find(
          (c) => c.id === lastFocusedContentId && c.group !== 'bottom-dock' && c.group !== 'sidebar'
        );
        if (remembered) return remembered;
      }

      // Default back to lowest visible content shelf/row
      if (activeView === 'home') {
        const recentNodes = validCandidates.filter((c) => c.group === 'recent-shelf');
        if (recentNodes.length > 0) {
          const lastId = lastFocusedByGroup?.get('recent-shelf');
          if (lastId) {
            const rememberedRecent = recentNodes.find((c) => c.id === lastId);
            if (rememberedRecent) return rememberedRecent;
          }
          return findClosestByX(currentRect.centerX, recentNodes) || recentNodes[0];
        }
        const continueNodes = validCandidates.filter((c) => c.group === 'continue-shelf');
        if (continueNodes.length > 0) {
          return findClosestByX(currentRect.centerX, continueNodes) || continueNodes[0];
        }
      } else if (activeView === 'library' || activeView === 'albums') {
        const gridNodes = validCandidates.filter((c) => c.group === 'library-grid');
        if (gridNodes.length > 0) {
          const rows = getVisualRows(gridNodes);
          const lastRow = rows[rows.length - 1];
          return findClosestByX(currentRect.centerX, lastRow) || lastRow[0];
        }
      } else if (activeView === 'album-detail') {
        const trackNodes = validCandidates.filter((c) => c.group === 'album-tracks');
        if (trackNodes.length > 0) {
          return trackNodes[trackNodes.length - 1];
        }
      }

      // Fallback: pick content node with highest Y (lowest on screen)
      const nonDockNodes = validCandidates.filter((c) => c.group !== 'bottom-dock' && c.group !== 'sidebar');
      if (nonDockNodes.length > 0) {
        return nonDockNodes.reduce((lowest, c) => {
          return getRect(c.element).centerY > getRect(lowest.element).centerY ? c : lowest;
        });
      }
      return null;
    }
  }

  // =========================================================================
  // 3. MAIN CONTENT: LEFT ESCAPE TO SIDEBAR RAIL
  // =========================================================================
  if (direction === 'left') {
    // Grid row navigation for multi-row collections
    if (currentGroup === 'library-grid' || currentGroup === 'artists-grid') {
      const gridNodes = validCandidates.filter((c) => c.group === currentGroup);
      const rows = getVisualRows([...gridNodes, current]);
      const currentRow = rows.find((r) => r.some((n) => n.id === current.id));
      if (currentRow) {
        const colIdx = currentRow.findIndex((n) => n.id === current.id);
        if (colIdx > 0) {
          return currentRow[colIdx - 1];
        }
        // At col 0 of grid -> jump directly to sidebar!
        return getActiveSidebarItem(activeView, validCandidates);
      }
    }

    // Special case for Album Detail tracklist: moving left goes to Album Actions
    if (currentGroup === 'album-tracks') {
      const actions = validCandidates.filter((c) => c.group === 'album-actions');
      if (actions.length > 0) {
        const playBtn = actions.find((c) => c.id === 'album-btn-play');
        return playBtn || actions[0];
      }
    }

    // Check if there is an item to the left in the SAME group and same visual row
    const sameGroupToLeft = validCandidates.filter((c) => {
      if (c.group !== currentGroup) return false;
      const rect = getRect(c.element);
      return rect.centerX < currentRect.centerX - 4 && Math.abs(rect.centerY - currentRect.centerY) <= 45;
    });

    if (sameGroupToLeft.length > 0) {
      return sameGroupToLeft.reduce((best, c) => {
        const dist = currentRect.centerX - getRect(c.element).centerX;
        const bestDist = currentRect.centerX - getRect(best.element).centerX;
        return dist < bestDist ? c : best;
      });
    }

    // No candidate to the left in content -> handoff to Sidebar rail if present
    const sidebarItem = getActiveSidebarItem(activeView, validCandidates);
    if (sidebarItem) {
      return sidebarItem;
    }
  }

  // =========================================================================
  // 4. MAIN CONTENT: RIGHT NAVIGATION
  // =========================================================================
  if (direction === 'right') {
    // Grid row navigation for multi-row collections
    if (currentGroup === 'library-grid' || currentGroup === 'artists-grid') {
      const gridNodes = validCandidates.filter((c) => c.group === currentGroup);
      const rows = getVisualRows([...gridNodes, current]);
      const currentRow = rows.find((r) => r.some((n) => n.id === current.id));
      if (currentRow) {
        const colIdx = currentRow.findIndex((n) => n.id === current.id);
        if (colIdx >= 0 && colIdx < currentRow.length - 1) {
          return currentRow[colIdx + 1];
        }
        return null; // Rightmost boundary of grid row
      }
    }

    // Album Actions: right goes to tracklist
    if (currentGroup === 'album-actions') {
      const trackNodes = validCandidates.filter((c) => c.group === 'album-tracks');
      if (trackNodes.length > 0) {
        return trackNodes[0];
      }
    }

    // Move within same group in the same visual row
    const sameGroupToRight = validCandidates.filter((c) => {
      if (c.group !== currentGroup) return false;
      const rect = getRect(c.element);
      return rect.centerX > currentRect.centerX + 4 && Math.abs(rect.centerY - currentRect.centerY) <= 45;
    });

    if (sameGroupToRight.length > 0) {
      return sameGroupToRight.reduce((best, c) => {
        const dist = getRect(c.element).centerX - currentRect.centerX;
        const bestDist = getRect(best.element).centerX - currentRect.centerX;
        return dist < bestDist ? c : best;
      });
    }
  }

  // =========================================================================
  // 5. MAIN CONTENT: DOWN NAVIGATION (SHELF-TO-SHELF HIERARCHY)
  // =========================================================================
  if (direction === 'down') {
    // --- HOME VIEW SHELVES ---
    if (activeView === 'home') {
      if (currentGroup === 'hero-actions') {
        const continueNodes = validCandidates.filter((c) => c.group === 'continue-shelf');
        if (continueNodes.length > 0) {
          const lastId = lastFocusedByGroup?.get('continue-shelf');
          if (lastId) {
            const remembered = continueNodes.find((c) => c.id === lastId);
            if (remembered) return remembered;
          }
          return findClosestByX(currentRect.centerX, continueNodes) || continueNodes[0];
        }
      }

      if (currentGroup === 'continue-shelf') {
        const recentNodes = validCandidates.filter((c) => c.group === 'recent-shelf');
        if (recentNodes.length > 0) {
          const lastId = lastFocusedByGroup?.get('recent-shelf');
          if (lastId) {
            const remembered = recentNodes.find((c) => c.id === lastId);
            if (remembered) return remembered;
          }
          return findClosestByX(currentRect.centerX, recentNodes) || recentNodes[0];
        }
      }

      if (currentGroup === 'recent-shelf') {
        // Lowest shelf of Home view -> navigate to Bottom Player Dock!
        const dockPlay = validCandidates.find((c) => c.id === 'dock-btn-play');
        if (dockPlay) return dockPlay;
        const dockNodes = validCandidates.filter((c) => c.group === 'bottom-dock');
        if (dockNodes.length > 0) {
          return findClosestByX(currentRect.centerX, dockNodes) || dockNodes[0];
        }
      }
    }

    // --- LIBRARY VIEW ---
    if (activeView === 'library' || activeView === 'albums') {
      if (currentGroup === 'library-tabs') {
        const gridNodes = validCandidates.filter((c) => c.group === 'library-grid');
        if (gridNodes.length > 0) {
          const rows = getVisualRows(gridNodes);
          const firstRow = rows[0] || gridNodes;
          return findClosestByX(currentRect.centerX, firstRow) || firstRow[0];
        }
      }

      if (currentGroup === 'library-grid') {
        const gridNodes = validCandidates.filter((c) => c.group === 'library-grid');
        const rows = getVisualRows([...gridNodes, current]);
        const rowIdx = rows.findIndex((r) => r.some((n) => n.id === current.id));
        if (rowIdx >= 0 && rowIdx < rows.length - 1) {
          const nextRow = rows[rowIdx + 1];
          return findClosestByX(currentRect.centerX, nextRow) || nextRow[0];
        }
        // At bottom row of grid -> transition to Bottom Dock!
        const dockPlay = validCandidates.find((c) => c.id === 'dock-btn-play');
        if (dockPlay) return dockPlay;
        const dockNodes = validCandidates.filter((c) => c.group === 'bottom-dock');
        if (dockNodes.length > 0) {
          return findClosestByX(currentRect.centerX, dockNodes) || dockNodes[0];
        }
      }
    }

    // --- ARTISTS VIEW ---
    if (activeView === 'artists') {
      if (currentGroup === 'artists-grid') {
        const gridNodes = validCandidates.filter((c) => c.group === 'artists-grid');
        const rows = getVisualRows([...gridNodes, current]);
        const rowIdx = rows.findIndex((r) => r.some((n) => n.id === current.id));
        if (rowIdx >= 0 && rowIdx < rows.length - 1) {
          const nextRow = rows[rowIdx + 1];
          return findClosestByX(currentRect.centerX, nextRow) || nextRow[0];
        }
        // Bottom row of artists grid -> transition to Bottom Dock
        const dockPlay = validCandidates.find((c) => c.id === 'dock-btn-play');
        if (dockPlay) return dockPlay;
        const dockNodes = validCandidates.filter((c) => c.group === 'bottom-dock');
        if (dockNodes.length > 0) return dockNodes[0];
      }
    }

    // --- ALBUM DETAIL VIEW ---
    if (activeView === 'album-detail') {
      if (currentGroup === 'album-actions') {
        // Actions column down -> Bottom Dock
        const dockPlay = validCandidates.find((c) => c.id === 'dock-btn-play');
        if (dockPlay) return dockPlay;
      }

      if (currentGroup === 'album-tracks') {
        const trackNodes = validCandidates.filter((c) => c.group === 'album-tracks');
        const below = trackNodes.filter((c) => getRect(c.element).centerY > currentRect.centerY + 4);
        if (below.length > 0) {
          return below.reduce((best, c) => {
            const dist = getRect(c.element).centerY - currentRect.centerY;
            const bestDist = getRect(best.element).centerY - currentRect.centerY;
            return dist < bestDist ? c : best;
          });
        }
        // Past last track -> transition to Bottom Dock
        const dockPlay = validCandidates.find((c) => c.id === 'dock-btn-play');
        if (dockPlay) return dockPlay;
      }
    }

    // --- NOW PLAYING VIEW ---
    if (activeView === 'now-playing') {
      if (currentGroup === 'now-playing-header') {
        const scrub = validCandidates.find((c) => c.id === 'np-scrub-bar');
        if (scrub) return scrub;
        const playBtn = validCandidates.find((c) => c.id === 'np-ctrl-play');
        if (playBtn) return playBtn;
      }
      if (current.id === 'np-scrub-bar') {
        const playBtn = validCandidates.find((c) => c.id === 'np-ctrl-play');
        if (playBtn) return playBtn;
      }
    }
  }

  // =========================================================================
  // 6. MAIN CONTENT: UP NAVIGATION (SHELF-TO-SHELF HIERARCHY)
  // =========================================================================
  if (direction === 'up') {
    // --- HOME VIEW SHELVES ---
    if (activeView === 'home') {
      if (currentGroup === 'recent-shelf') {
        const continueNodes = validCandidates.filter((c) => c.group === 'continue-shelf');
        if (continueNodes.length > 0) {
          const lastId = lastFocusedByGroup?.get('continue-shelf');
          if (lastId) {
            const remembered = continueNodes.find((c) => c.id === lastId);
            if (remembered) return remembered;
          }
          return findClosestByX(currentRect.centerX, continueNodes) || continueNodes[0];
        }
      }

      if (currentGroup === 'continue-shelf') {
        const heroNodes = validCandidates.filter((c) => c.group === 'hero-actions');
        if (heroNodes.length > 0) {
          const lastId = lastFocusedByGroup?.get('hero-actions');
          if (lastId) {
            const remembered = heroNodes.find((c) => c.id === lastId);
            if (remembered) return remembered;
          }
          const resumeBtn = heroNodes.find((c) => c.id === 'hero-resume');
          return resumeBtn || findClosestByX(currentRect.centerX, heroNodes) || heroNodes[0];
        }
      }

      if (currentGroup === 'hero-actions') {
        return null; // Top of home view
      }
    }

    // --- LIBRARY VIEW ---
    if (activeView === 'library' || activeView === 'albums') {
      if (currentGroup === 'library-grid') {
        const gridNodes = validCandidates.filter((c) => c.group === 'library-grid');
        const rows = getVisualRows([...gridNodes, current]);
        const rowIdx = rows.findIndex((r) => r.some((n) => n.id === current.id));
        if (rowIdx > 0) {
          const prevRow = rows[rowIdx - 1];
          return findClosestByX(currentRect.centerX, prevRow) || prevRow[0];
        }
        // At Row 0 of grid -> Up transitions to library tabs!
        const tabNodes = validCandidates.filter((c) => c.group === 'library-tabs');
        if (tabNodes.length > 0) {
          return findClosestByX(currentRect.centerX, tabNodes) || tabNodes[0];
        }
      }

      if (currentGroup === 'library-tabs') {
        return null; // Top of library view
      }
    }

    // --- ARTISTS VIEW ---
    if (activeView === 'artists') {
      if (currentGroup === 'artists-grid') {
        const gridNodes = validCandidates.filter((c) => c.group === 'artists-grid');
        const rows = getVisualRows([...gridNodes, current]);
        const rowIdx = rows.findIndex((r) => r.some((n) => n.id === current.id));
        if (rowIdx > 0) {
          const prevRow = rows[rowIdx - 1];
          return findClosestByX(currentRect.centerX, prevRow) || prevRow[0];
        }
        return null;
      }
    }

    // --- ALBUM DETAIL VIEW ---
    if (activeView === 'album-detail') {
      if (currentGroup === 'album-tracks') {
        const trackNodes = validCandidates.filter((c) => c.group === 'album-tracks');
        const above = trackNodes.filter((c) => getRect(c.element).centerY < currentRect.centerY - 4);
        if (above.length > 0) {
          return above.reduce((best, c) => {
            const dist = currentRect.centerY - getRect(c.element).centerY;
            const bestDist = currentRect.centerY - getRect(best.element).centerY;
            return dist < bestDist ? c : best;
          });
        }
        return null;
      }
    }

    // --- NOW PLAYING VIEW ---
    if (activeView === 'now-playing') {
      if (currentGroup === 'now-playing-controls') {
        if (current.id === 'np-scrub-bar') {
          const backBtn = validCandidates.find((c) => c.id === 'np-btn-back');
          if (backBtn) return backBtn;
        } else {
          const scrub = validCandidates.find((c) => c.id === 'np-scrub-bar');
          if (scrub) return scrub;
        }
      }
    }
  }

  // =========================================================================
  // 7. ROBUST SPATIAL MATH FALLBACK (EXCLUDING TRAP OVERLAYS)
  // =========================================================================
  // Filter out 'bottom-dock' unless direction is down and no content candidate exists
  // Filter out 'sidebar' unless direction is left
  const filteredCandidates = validCandidates.filter((c) => {
    if (c.group === 'sidebar') return false;
    if (c.group === 'bottom-dock' && direction !== 'down') return false;
    return true;
  });

  return findNearestNeighbor(current, filteredCandidates, direction);
}

/**
 * Classical 2D Euclidean spatial neighbor algorithm for arbitrary node geometries.
 */
export function findNearestNeighbor(
  current: FocusableNode,
  candidates: FocusableNode[],
  direction: Direction
): FocusableNode | null {
  const currentRect = getRect(current.element);
  let bestCandidate: FocusableNode | null = null;
  let minScore = Infinity;

  const SLOP = 4;

  for (const candidate of candidates) {
    if (candidate.id === current.id) continue;
    if (!candidate.element || !candidate.element.isConnected) continue;
    if (!isVisible(candidate.element)) continue;

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
      const score = primaryDist + secondaryDist * 2.5;
      if (score < minScore) {
        minScore = score;
        bestCandidate = candidate;
      }
    }
  }

  return bestCandidate;
}
