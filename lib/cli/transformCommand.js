const debug = require('debug')('graph-wrangle:cli');
const GraphWrangle = require('../index');
const { ioCommand } = require('./util');

function parseMatrix(value) {
  if (value) {
    value = JSON.parse(value);
  }
  return value;
}

function addCommand(program) {
  program
    .command('transform')
    .description('Apply a transformation matrix to a graph layout')
    .option(
      '-m, --matrix <matrix>',
      'The transformation matrix (4x4)',
      parseMatrix
    )
    .option('-i, --input <file>', 'Specify input graph JSON file')
    .option('-o, --output <file>', 'Specify output graph JSON file')
    .option('-f, --format', 'Format JSON output')
    .action(options => {
      debug(`Running transform command: ${options.input}, ${options.matrix}`);
      ioCommand(transformCommand, options);
    });
}

/**
 * Flatten nodes from a graph
 */
async function transformCommand(graph, normalizedGraph, options) {
  const { matrix } = options;

  // transform the nodes in the graph (modifies normalizedGraph)
  const transformedLayout = await GraphWrangle.transformGraph(normalizedGraph, {
    matrix,
  });

  // copy over new layout
  graph.meta.layout = transformedLayout;
}

module.exports = {
  run: transformCommand,
  add: addCommand,
};
