#!/usr/bin/env node

const program = require('commander');

const layoutCommand = require('./cli/layoutCommand');
const styleCommand = require('./cli/styleCommand');
const drawCommand = require('./cli/drawCommand');
const filterCommand = require('./cli/filterCommand');
const pipelineCommand = require('./cli/pipelineCommand');
const sequenceCommand = require('./cli/sequenceCommand');

module.exports = function cli(args) {
  layoutCommand.add(program);
  styleCommand.add(program);
  drawCommand.add(program);
  filterCommand.add(program);
  pipelineCommand.add(program);
  sequenceCommand.add(program);
  program.parse(args);
};
