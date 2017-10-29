// const debug = require('debug')('graph-wrangle:sequence');
const d3 = require('d3');

/**
 * Construct a deltas array of: [
 *    { enter: [nodeId, nodeId, nodeId], update: [nodeId...], exit: [nodeId...], nodesById }
 * ]
 */
function sequenceGraphs(graphs) {
  const deltas = [];

  let prevNodesById = {};
  for (let graphIndex = 0; graphIndex < graphs.length; ++graphIndex) {
    const graph = graphs[graphIndex];

    const nodesById = d3
      .nest()
      .key(d => d.id)
      .rollup(d => d[0])
      .object(graph.nodes);

    const delta = {
      graph,
      nodesById,
      enter: [],
      update: [],
      exit: [],
    };

    // bucket each node in current graph as entering or updating
    for (const node of graph.nodes) {
      const nodeId = node.id;
      // check if entering:
      if (prevNodesById[nodeId] == null) {
        delta.enter.push(nodeId);
      } else {
        delta.update.push(nodeId);
      }
    }

    // see which nodes exited
    const prevNodeIds = Object.keys(prevNodesById);
    for (const prevNodeId of prevNodeIds) {
      if (nodesById[prevNodeId] == null) {
        // read directly from the object instead of using prevNodeId to ensure
        // that we keep the same type (e.g. number instead of string since keys
        // are all converted strings)
        delta.exit.push(prevNodesById[prevNodeId].id);
      }
    }

    deltas.push(delta);
    prevNodesById = nodesById;
  }

  // remove nodesById before returning and graph (for now... TODO revisit and see if
  // this should only be done in the CLI version)
  deltas.forEach(delta => {
    delete delta.nodesById;
    delete delta.graph;
  });

  return { graphs, deltas: deltas };
}

module.exports = sequenceGraphs;
