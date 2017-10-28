const debug = require('debug')('graph-wrangle:cli');
const d3 = require('d3');
const GraphWrangle = require('../index');
const { ioCommand } = require('./util');

function parseFilterStat(filterStatStr) {
  if (!filterStatStr) {
    return filterStatStr;
  }

  let [stat, operator, value] = filterStatStr.split(':');
  value = +value;

  return { stat, operator, value };
}

function addCommand(program) {
  program
    .command('filter')
    .description('Filter nodes from a graph')
    .option(
      '-s, --filter-stat <name:operator:value>',
      'Specify graph stat filter nodes by (e.g. total-degree',
      parseFilterStat
    )
    .option('-i, --input <file>', 'Specify input graph JSON file')
    .option('-o, --output <file>', 'Specify output graph JSON file')
    .option('-f, --format', 'Format JSON output')
    .action(options => {
      debug(
        `Running filter command: ${options.input}, ${JSON.stringify(
          options.filterStat
        )}`
      );
      ioCommand(filterCommand, options);
    });
}

/**
 * Filter nodes from a graph
 */
async function filterCommand(graph, normalizedGraph, options) {
  let { filterStat } = options;

  // filter the nodes in the graph (modifies normalizedGraph)
  await GraphWrangle.filterGraph(normalizedGraph, {
    filterStat,
  });

  const nodesById = d3
    .nest()
    .key(d => d.id)
    .rollup(d => d[0])
    .object(normalizedGraph.nodes);

  const idField = graph.meta.fields.find(d => d.type === 'node-id') || {
    name: 'id',
  };

  // make normal graph match normalized graph nodes
  graph.nodes = graph.nodes.filter(node => {
    const nodeId = node[idField.name];
    return nodesById[nodeId] != null;
  });
  graph.links = graph.links.filter(([sourceId, targetId]) => {
    return nodesById[sourceId] != null && nodesById[targetId] != null;
  });
}

module.exports = {
  run: filterCommand,
  add: addCommand,
};
