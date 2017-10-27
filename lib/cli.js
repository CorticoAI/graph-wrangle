#!/usr/bin/env node

const program = require('commander');

const layoutCommand = require('./cli/layoutCommand');
const styleCommand = require('./cli/styleCommand');
const drawCommand = require('./cli/drawCommand');
const pipelineCommand = require('./cli/pipelineCommand');

module.exports = function cli(args) {
  layoutCommand.add(program);
  styleCommand.add(program);
  drawCommand.add(program);
  pipelineCommand.add(program);
  program.parse(args);
};
