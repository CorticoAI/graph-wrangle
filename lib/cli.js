#!/usr/bin/env node

const program = require('commander');

const layoutCommand = require('./cli/layoutCommand');
const styleCommand = require('./cli/styleCommand');
const drawCommand = require('./cli/drawCommand');
const filterCommand = require('./cli/filterCommand');
const pipelineCommand = require('./cli/pipelineCommand');
const sequenceCommand = require('./cli/sequenceCommand');
const flattenCommand = require('./cli/flattenCommand');
const cleanCommand = require('./cli/cleanCommand');
const transformCommand = require('./cli/transformCommand');

module.exports = function cli(args) {
  layoutCommand.add(program);
  styleCommand.add(program);
  drawCommand.add(program);
  filterCommand.add(program);
  pipelineCommand.add(program);
  sequenceCommand.add(program);
  flattenCommand.add(program);
  cleanCommand.add(program);
  transformCommand.add(program);
  program.parse(args);
};
