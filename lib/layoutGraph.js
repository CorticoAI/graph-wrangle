// @flow
const debug = require('debug')('graph-wrangle:layout');

/**
 * Copies a graph to prevent any destruction to the original
 * nodes and links in the graph.
 */
function copyNodeLinks(graph) {
  const newGraph = {
    ...graph,
    nodes: graph.nodes.map(d => ({ ...d })),
    links: graph.links.map(d => [...d]),
  };

  return newGraph;
}

function d3ForceLayout(graph, options) {
  debug('Starting d3-force layout...');
  return new Promise((resolve, reject) => {
    const layoutNodes = extractLayoutFromNodes(graph);
    setTimeout(() => {
      resolve({ algorithm: 'd3-force', nodes: layoutNodes });
    }, 500);
  });
}

/**
 * Helper to pull out layout attributes from nodes into their own separate objects
 */
function extractLayoutFromNodes(graph) {
  return {
    nodes: graph.nodes.map(d => ({
      x: d.x,
      y: d.y,
      id: d.id,
    })),
  };
}

/**
 * Layout a graph with a specified algorithm asynchronously.
 */
async function layoutGraph(graph, algorithmId) {
  debug(
    `Laying out graph with ${algorithmId}: ${graph.nodes.length} nodes, ${graph
      .links.length} links.`
  );

  // since graph layouts tend to be destructive to the nodes, let's use a copy of them.
  graph = copyNodeLinks(graph);

  let algorithm;
  switch (algorithmId) {
    case 'd3-force':
      algorithm = d3ForceLayout;
      break;
    default:
      throw new Error(`Unknown layout algorithm '${algorithmId}'`);
  }

  // run the layout
  const layout = await algorithm(graph);

  debug(`Finished laying out graph with ${algorithmId}.`);
  return layout;
}

module.exports = layoutGraph;
