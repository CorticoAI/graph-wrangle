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
      '-o, --image-output <file>',
      'Specify output graph PNG file',
      'output.png'
    )
    .action(options => {
      debug(
        `Running draw command: ${options.colorKey}, ${options.colorScheme}`
      );
      inputCommand(drawCommand, options);
    });
}

/**
 * Create a PNG of the graph
 */
async function drawCommand(graph, normalizedGraph, options) {
  const {
    width = 800,
    height = 800,
    imageOutput,
    backgroundColor,
    curvedLinks,
    linkAlpha,
    linkStrokeWidth,
    gradientLinks,
    nodeAlpha,
  } = options;

  const imageOutputPath = path.resolve(imageOutput.replace(/\.json$/, '.png'));
  await GraphWrangle.drawGraph(normalizedGraph, {
    width,
    height,
    outputPath: imageOutputPath,
    backgroundColor,
    curvedLinks,
    linkAlpha,
    linkStrokeWidth,
    gradientLinks,
    nodeAlpha,
  });
}

module.exports = {
  run: drawCommand,
  add: addCommand,
};
