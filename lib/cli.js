#!/usr/bin/env node

const program = require('commander');

const layoutCommand = require('./cli/layoutCommand');
const styleCommand = require('./cli/styleCommand');
const drawCommand = require('./cli/drawCommand');

module.exports = async function cli(args) {
  layoutCommand.add(program);
  styleCommand.add(program);
  drawCommand.add(program);
  program.parse(args);
};
