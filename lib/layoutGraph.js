const debug = require('debug')('graph-wrangle:layout');
const normalizeGraph = require('./normalizeGraph');
const { setupGraphLayout, runGraphLayout } = require('./layout');

/**
 * Layout a graph with a specified algorithm asynchronously.
 */
async function layoutGraph(graph, algorithmId, numTicks = 100) {
  debug(
    `Laying out graph with ${algorithmId}: ${graph.nodes.length} nodes, ${graph
      .links.length} links.`
  );

  // since graph layouts tend to be destructive to the nodes, let's use a copy of them.
  graph = normalizeGraph(graph);

  // initialize the layout
  const layoutConfiguration = {};
  const layoutInstance = setupGraphLayout(
    algorithmId,
    graph,
    layoutConfiguration
  );

  if (!layoutInstance) {
    throw new Error(`Unknown layout algorithm '${algorithmId}'`);
  }

  // run the layout
  debug(`Running graph layout for ${numTicks} ticks...`);
  await runGraphLayout(layoutInstance, numTicks);

  // extract the layout as its own set of data
  const layout = layoutInstance.extractLayout();

  debug(`Finished laying out graph with ${algorithmId}.`);
  return layout;
}

module.exports = layoutGraph;
