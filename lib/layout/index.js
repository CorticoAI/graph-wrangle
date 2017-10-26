const ProgressBar = require('progress');
const D3ForceLayout = require('./D3ForceLayout');
const RandomLayout = require('./RandomLayout');
const ForceAtlas2Layout = require('./ForceAtlas2Layout');

const layouts = [
  { id: 'd3-force', label: 'D3 Force', Layout: D3ForceLayout },
  { id: 'random', label: 'Random', Layout: RandomLayout },
  { id: 'force-atlas2', label: 'Force Atlas 2', Layout: ForceAtlas2Layout },
];

function setupGraphLayout(layoutId, graph, layoutConfiguration) {
  const layout = layouts.find(d => d.id === layoutId);
  if (!layout) {
    return undefined;
  }

  const layoutInstance = new layout.Layout(graph, layoutConfiguration);
  layoutInstance.setup();

  return layoutInstance;
}

function runGraphLayout(layoutInstance, numTicks) {
  return new Promise(resolve => {
    // check if we have a stable layout already (no need to run more ticks);
    if (layoutInstance.complete) {
      resolve();
      return;
    }

    const bar = new ProgressBar(
      '  Running layout [:bar] :percent • :current/:total ticks • :etas remaining',
      {
        total: numTicks,
        width: 30,
        complete: '=',
        incomplete: ' ',
      }
    );

    // we do this asynchronously to get the progressbar to draw
    let currTick = 0;
    function tick() {
      layoutInstance.tick();
      bar.tick();
      currTick += 1;

      if (currTick < numTicks) {
        setTimeout(tick, 0);
      } else {
        resolve();
      }
    }

    tick();
  });
}

module.exports = {
  layouts,
  setupGraphLayout,
  runGraphLayout,
};
