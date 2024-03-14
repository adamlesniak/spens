#!/usr/bin/env node
import { Command } from 'commander';

import { Spens } from './lib/spens';

const program = new Command();

program
  .name('spens')
  .requiredOption('-f, --file <filePath>', 'The CSV file containing statement.')
  .requiredOption('-o, --output <filePath>', 'The CSV file containing output.')
  .requiredOption(
    '-t, --token <tokenPath>',
    'The token YML file containing mapping of merchants to categories.',
  )
  .option('-c, --currency', 'Currency symbol to use default €.')
  .option('-d, --debug', 'Display debugging.')
  .version('0.1.0')
  .parse();

const options = program.opts();

(async () => {
  await new Spens().create(options.file, options.token, options.output);
})();
