#!/usr/bin/env node

/**
 * Module dependencies.
 */

// enable DEBUG messages when running as CLI
if (process.env['DEBUG'] == null) {
  process.env['DEBUG'] = 'graph-wrangle:*';
}

const cli = require('../lib/cli');

cli(process.argv);
