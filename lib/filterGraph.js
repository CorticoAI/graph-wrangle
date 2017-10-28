const debug = require('debug')('graph-wrangle:filter');
const d3 = require('d3');

/**
 * Filters nodes in graph to meet the operator and value
 * based on degree of node
 */
function filterDegree(graph, operator, value) {
  // create a map between node ID and degree
  const degreeByNodeId = {};

  // compute degree
  graph.links.forEach(({ source, target }) => {
    if (degreeByNodeId[source.id] == null) {
      degreeByNodeId[source.id] = 1;
    } else {
      degreeByNodeId[source.id] += 1;
    }

    if (degreeByNodeId[target.id] == null) {
      degreeByNodeId[target.id] = 1;
    } else {
      degreeByNodeId[target.id] += 1;
    }
  });

  // filter
  if (operator === 'gt') {
    graph.nodes = graph.nodes.filter(node => degreeByNodeId[node.id] > value);
  } else if (operator === 'lt') {
    graph.nodes = graph.nodes.filter(node => degreeByNodeId[node.id] < value);
  } else if (operator === 'eq') {
    graph.nodes = graph.nodes.filter(node => degreeByNodeId[node.id] === value);
  } else {
    console.warn('Unsupported degree filter operator ' + operator);
    return;
  }

  filterLinksToNodes(graph);
}

/**
 * Filter so that only links that have both nodes in the graph are there
 */
function filterLinksToNodes(graph) {
  const nodesById = d3
    .nest()
    .key(d => d.id)
    .rollup(d => d[0])
    .object(graph.nodes);

  // console.warn('graph.links', graph.links.filter, graph);
  graph.links = graph.links.filter(({ source, target }) => {
    return nodesById[source.id] != null && nodesById[target.id] != null;
  });
}

/**
 * Filter the nodes and links in a graph.
 */
function filterGraph(graph, options) {
  const { filterStat } = options;

  if (filterStat) {
    if (filterStat.stat === 'degree') {
      debug('Filtering graph based on degree');

      filterDegree(graph, filterStat.operator, filterStat.value);
    }
  }

  return graph;
}

module.exports = filterGraph;
