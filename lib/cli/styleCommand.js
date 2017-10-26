const debug = require('debug')('graph-wrangle:cli');
const GraphWrangle = require('../index');
const { ioCommand } = require('./util');

function addCommand(program) {
  program
    .command('style')
    .description('Add styling information to the graph')
    .option('-k, --color-key <name>', 'Specify field name to color nodes by')
    .option(
      '-c, --color-scheme <name or array>',
      'Specify the color scheme to use on the data'
    )
    .option('-i, --input <file>', 'Specify input graph JSON file')
    .option('-o, --output <file>', 'Specify output graph JSON file')
    .option('-f, --format', 'Format JSON output')
    .action(options => {
      debug(
        `Running style command: ${options.colorKey}, ${options.colorScheme}`
      );
      ioCommand(styleCommand, options);
    });
}

/**
 * Add style information to a graph in the meta area
 */
async function styleCommand(graph, normalizedGraph, options) {
  const { colorKey } = options;

  const colorField = colorKey;

  // run the style on each node
  const style = await GraphWrangle.styleGraph(normalizedGraph, colorField);

  // create a new graph object with layout in it
  if (!graph.meta) {
    graph.meta = {};
  }
  graph.meta.style = style;

  // merge into normalized graph too
  normalizedGraph.meta.style = style;
}

module.exports = {
  run: styleCommand,
  add: addCommand,
};
