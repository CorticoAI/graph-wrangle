const debug = require('debug')('graph-wrangle:cli');
const GraphWrangle = require('../index');
const { ioCommand } = require('./util');

function addCommand(program) {
  program
    .command('flatten')
    .description('Flatten nodes from a graph')
    .option('-i, --input <file>', 'Specify input graph JSON file')
    .option('-o, --output <file>', 'Specify output graph JSON file')
    .option('-f, --format', 'Format JSON output')
    .action(options => {
      debug(`Running flatten command: ${options.input}`);
      ioCommand(flattenCommand, options);
    });
}

/**
 * Flatten nodes from a graph
 */
async function flattenCommand(graph, normalizedGraph, options) {
  // flatten the nodes in the graph (modifies normalizedGraph)
  const flattenedGraph = await GraphWrangle.flattenGraph(normalizedGraph);

  // copy over new nodes
  graph.nodes = flattenedGraph.nodes;
  graph.meta.layout = flattenedGraph.meta.layout;
  graph.meta.style = flattenedGraph.meta.style;
  // console.log(flattenedGraph.meta);
}

module.exports = {
  run: flattenCommand,
  add: addCommand,
};
