// The widgets' measures, in one place: every module that places, drags,
// resizes, snaps or tiles a widget reads them from here.

// ---- a widget
export const POPOUT_WIDTH = 420; // the width a map pops out at
export const POPOUT_MIN_WIDTH = 260;
export const POPOUT_MAX_WIDTH = 875; // the maps list's max-width; the page's cap (the board has none)
export const POPOUT_MIN_HEIGHT = 120; // free (iframe) widgets only; the others follow their aspect
export const POPOUT_MARGIN = 16; // the gutter a widget is cascaded into, and the gap that still counts as none
export const POPOUT_TITLE_HEIGHT = 23; // .radartitle height; keeps the drag handle reachable
export const TITLE_GAP = 6; // kept between a widget's title and a button cluster
export const CASCADE_STEP = 32; // between widgets popped out one after another with no place of their own

// ---- between widgets
export const MAGNET = 12; // a dragged widget's edge this close to another floating widget's is pulled onto it
export const GROUP_TOUCH = 1; // widgets whose edges lie this close on each other touch, and can be grouped
export const SEAM_ALIGN = GROUP_TOUCH; // two edges this close are one seam

// ---- the board
export const GRID_CELL = 16; // the grid's cell: its lines are the multiples
export const ARRANGE_ASPECT = 4 / 3; // a map's shape, near enough, when there are none to measure
export const ARRANGE_HOLE = 0.01; // the share of a map's size an empty cell costs: a tie-breaker, no more

// ---- the snap columns
export const SNAP_EDGE = 5; // a widget edge this close to a viewport edge targets its column
export const SNAP_SHUT = 24; // a column edge this close to the far side shuts the page
export const SNAP_DETACH = 40; // sideways drag distance before a snapped pane floats again
export const SNAP_ARM = 4; // drag distance before a floating widget can snap (a click on a parked widget must not)
export const SNAP_MIN_WIDTH = POPOUT_MIN_WIDTH;
