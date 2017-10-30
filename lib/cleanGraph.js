const debug = require('debug')('graph-wrangle:clean');
const d3 = require('d3');

function createNumericIds(graph) {
  let nextId = 0;

  const nodeIdMap = {};
  function getNodeId(oldNodeId) {
    if (nodeIdMap[oldNodeId] == null) {
      nodeIdMap[oldNodeId] = nextId;
      nextId += 1;
    }

    return nodeIdMap[oldNodeId];
  }

  // convert each node:
  graph.nodes.forEach(node => {
    node.id = getNodeId(node.id);
  });

  // convert in the meta
  if (graph.meta.layout && graph.meta.layout.nodes) {
    graph.meta.layout.nodes = Object.keys(
      graph.meta.layout.nodes
    ).reduce((accum, oldNodeId) => {
      accum[getNodeId(oldNodeId)] = graph.meta.layout.nodes[oldNodeId];
      accum[getNodeId(oldNodeId)].id = getNodeId(oldNodeId);
      return accum;
    }, {});
  }
  if (graph.meta.style && graph.meta.style.nodes) {
    graph.meta.style.nodes = Object.keys(
      graph.meta.style.nodes
    ).reduce((accum, oldNodeId) => {
      accum[getNodeId(oldNodeId)] = graph.meta.style.nodes[oldNodeId];
      return accum;
    }, {});
  }
}

/**
 * Filter the nodes and links in a graph.
 */
function cleanGraph(graph, options) {
  const { numberifyIds } = options;
  if (numberifyIds) {
    debug('Creating numeric IDs for nodes');
    createNumericIds(graph);
  }

  return graph;
}

module.exports = cleanGraph;
