# Concepts

> Shared domain vocabulary for this project — entities, named processes, and status concepts with project-specific meaning. Seeded with core domain vocabulary, then accretes as ce-compound and ce-compound-refresh process learnings; direct edits are fine. Glossary only, not a spec or catch-all.

## Spatial Navigation

### 10-Foot Spatial Navigation
A directional D-pad interaction model where focus transitions deterministically between registered on-screen elements based on directional adjacency and hierarchical shelves rather than 2D cursor coordinates or touch events.
*Avoid:* Mouse hover, pointer focus

### Radiant Focus Halo
The canonical high-contrast glowing cyan border and outer shadow projected by the single active element on screen, ensuring unambiguous visual feedback from a couch viewing distance of 8 to 12 feet.

### Semantic Group
A logical boundary enclosing related interactive TV elements (such as a navigation rail, a shelf row, or a media dock) that governs hierarchical vertical transitions and isolates local navigation flows.

### Group Memory
The spatial navigation retention mechanism where exiting a semantic group and subsequently returning restores focus to the previously active element within that group rather than resetting to an arbitrary or top-left child.

### Overscan Safe Boundary
The display safe area inset from the television panel edges (typically 40px to 80px) ensuring navigation targets, text, and radiant focus halos remain visible and uncropped across consumer TV displays.
