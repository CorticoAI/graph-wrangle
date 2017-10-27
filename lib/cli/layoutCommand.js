const debug = require('debug')('graph-wrangle:cli');
const GraphWrangle = require('../index');
const { ioCommand } = require('./util');

function addCommand(program) {
  program
    .command('layout')
    .description('Compute the layout for a given graph')
    .option('-a, --algorithm <name>', 'Specify graph layout algorithm')
    .option(
      '-k, --layout-key <name>',
      'Specify key to save the graph layout as in the meta object'
    )
    .option(
      '-t, --num-ticks <number>',
      'Specify number of ticks to run the algorithm',
      parseInt
    )
    .option('-i, --input <file>', 'Specify input graph JSON file')
    .option('-o, --output <file>', 'Specify output graph JSON file')
    .option('-f, --format', 'Format JSON output')
    .action(options => {
      debug(
        `Running layout command: ${options.algorithm}, ${options.layoutKey} key, ${options.numTicks} ticks`
      );
      ioCommand(layoutCommand, options);
    });
}

/**
 * Run a layout on a graph and store the results in the meta area
 */
async function layoutCommand(graph, normalizedGraph, options) {
  const { algorithm, layoutKey = 'layout', numTicks = 100 } = options;

  // run the layout and get the layout data
  const layout = await GraphWrangle.layoutGraph(
    normalizedGraph,
    algorithm,
    numTicks
  );

  // create a new graph object with layout in it
  if (!graph.meta) {
    graph.meta = {};
  }
  graph.meta[layoutKey] = layout;

  // merge into normalized graph too
  normalizedGraph.meta[layoutKey] = layout;
}

module.exports = {
  run: layoutCommand,
  add: addCommand,
};
