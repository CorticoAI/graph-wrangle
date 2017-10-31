const debug = require('debug')('graph-wrangle:layout');
const d3 = require('d3');
const { setupGraphLayout, runGraphLayout } = require('./layout');

/**
 * Layout a graph with a specified algorithm asynchronously.
 */
async function layoutGraph(graph, options) {
  const {
    algorithmId = 'd3-force',
    numTicks = 100,
    algorithmOptions = {},
  } = options;

  debug(
    `Laying out graph with ${algorithmId}: ${graph.nodes.length} nodes, ${graph
      .links.length} links.`
  );

  // initialize the layout
  const layoutInstance = setupGraphLayout(algorithmId, graph, algorithmOptions);

  if (!layoutInstance) {
    throw new Error(`Unknown layout algorithm '${algorithmId}'`);
  }

  // run the layout
  debug(`Running graph layout for ${numTicks} ticks...`);
  await runGraphLayout(layoutInstance, numTicks);

  // extract the layout as its own set of data
  const layout = layoutInstance.extractLayout();

  // add in meta information about the layout
  layout.xExtent = d3.extent(d3.values(layout.nodes), d => d.x);
  layout.yExtent = d3.extent(d3.values(layout.nodes), d => d.y);
  if (algorithmOptions.numDimensions === 3) {
    layout.zExtent = d3.extent(d3.values(layout.nodes), d => d.z);
  }

  debug(`Finished laying out graph with ${algorithmId}.`);
  return layout;
}

module.exports = layoutGraph;
