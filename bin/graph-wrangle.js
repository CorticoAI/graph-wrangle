#!/usr/bin/env node

/**
 * Module dependencies.
 */

// enable DEBUG messages when running as CLI
if (process.env['DEBUG'] == null) {
  process.env['DEBUG'] = 'graph-wrangle:*';
}

const cli = require('../lib/cli');

// show stack trace on unhandled promise rejection (makes debugging easier)
// see: https://github.com/nodejs/node/issues/9523#issuecomment-259303079
process.on('unhandledRejection', r => console.error(r));
cli(process.argv);
