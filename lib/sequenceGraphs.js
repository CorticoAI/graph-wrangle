const debug = require('debug')('graph-wrangle:sequence');
const d3 = require('d3');

/**
 * Construct a deltas array of: [
 *    { enter: [nodeId, nodeId, nodeId], update: [nodeId...], exit: [nodeId...], nodesById }
 * ]
 */
function sequenceGraphs(graphs) {
  const deltas = [];

  // function isNodeEntering(nodeId, nodesById, prevNodesById) {
  //   return nodesById[nodeId] != null && prevNodesById[nodeId] == null;
  // }

  function isNodeUpdating(nodeId, nodesById, prevNodesById) {
    return nodesById[nodeId] != null && prevNodesById[nodeId] != null;
  }

  // function isNodeExiting(nodeId, nodesById, prevNodesById) {
  //   return nodesById[nodeId] == null && prevNodesById[nodeId] != null;
  // }

  function linkId(sourceNodeId, targetNodeId) {
    return `${sourceNodeId}--LINK_ID--${targetNodeId}`;
  }

  function graphHasLink(sourceNodeId, targetNodeId, linksById) {
    return linksById[linkId(sourceNodeId, targetNodeId)] != null;
  }

  let prevGraph = null;
  let prevNodesById = {};
  let prevLinksById = {};
  for (let graphIndex = 0; graphIndex < graphs.length; ++graphIndex) {
    debug(`Sequencing graph ${graphIndex + 1} of ${graphs.length}`);
    const graph = graphs[graphIndex];

    const nodesById = d3
      .nest()
      .key(d => d.id)
      .rollup(d => d[0])
      .object(graph.nodes);

    const linksById = d3
      .nest()
      .key(d => linkId(d.source.id, d.target.id))
      .rollup(d => d[0])
      .object(graph.links);

    const delta = {
      graph,
      nodesById,
      nodes: {
        enter: [],
        update: [],
        exit: [],
      },
      // links need to be captured only when both source and target nodes are update nodes
      // otherwise all links associated with entering nodes need to be added
      // and all links associated with exiting nodes need to be removed
      links: {
        enter: [],
        exit: [],
      },
    };

    // bucket each node in current graph as entering or updating
    for (const node of graph.nodes) {
      const nodeId = node.id;
      // check if entering:
      if (prevNodesById[nodeId] == null) {
        delta.nodes.enter.push(nodeId);
      } else {
        delta.nodes.update.push(nodeId);
      }
    }

    // see which nodes exited
    const prevNodeIds = Object.keys(prevNodesById);
    for (const prevNodeId of prevNodeIds) {
      if (nodesById[prevNodeId] == null) {
        // read directly from the object instead of using prevNodeId to ensure
        // that we keep the same type (e.g. number instead of string since keys
        // are all converted strings)
        delta.nodes.exit.push(prevNodesById[prevNodeId].id);
      }
    }

    if (delta.nodes.update.length) {
      // check which update-node links are entering
      for (const link of graph.links) {
        if (
          isNodeUpdating(link.source.id, nodesById, prevNodesById) &&
          isNodeUpdating(link.target.id, nodesById, prevNodesById) &&
          !graphHasLink(link.source.id, link.target.id, prevLinksById)
        ) {
          // if this link wasn't in the previous graph, then add it
          delta.links.enter.push([link.source.id, link.target.id]);
        }
      }

      // check which update-node links are exiting
      for (const link of prevGraph.links) {
        if (
          isNodeUpdating(link.source.id, nodesById, prevNodesById) &&
          isNodeUpdating(link.target.id, nodesById, prevNodesById) &&
          !graphHasLink(link.source.id, link.target.id, linksById)
        ) {
          // if this link wasn't in the previous graph, then add it
          delta.links.exit.push([link.source.id, link.target.id]);
        }
      }
    }

    deltas.push(delta);
    prevNodesById = nodesById;
    prevLinksById = linksById;
    prevGraph = graph;
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
