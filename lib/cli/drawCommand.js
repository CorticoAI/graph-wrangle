const debug = require('debug')('graph-wrangle:cli');
const path = require('path');
const GraphWrangle = require('../index');
const { inputCommand } = require('./util');

function addCommand(program) {
  program
    .command('draw')
    .description('Create a PNG of the graph')
    .option(
      '-w, --width <number>',
      'Specify the width of the PNG in pixels',
      parseInt
    )
    .option(
      '-h, --height <number>',
      'Specify the height of the PNG in pixels',
      parseInt
    )
    .option('-i, --input <file>', 'Specify input graph JSON file')
    .option(
      '-o, --output <file>',
      'Specify output graph PNG file',
      'output.png'
    )
    .action(options => {
      debug(
        `Running style command: ${options.colorKey}, ${options.colorScheme}`
      );
      inputCommand(drawCommand, options);
    });
}

/**
 * Create a PNG of the graph
 */
async function drawCommand(graph, normalizedGraph, options) {
  const { width = 800, height = 800, output } = options;

  const imageOutputPath = path.resolve(output.replace(/\.json$/, '.png'));
  await GraphWrangle.drawGraph(normalizedGraph, {
    width,
    height,
    outputPath: imageOutputPath,
  });
}

module.exports = {
  run: drawCommand,
  add: addCommand,
};
