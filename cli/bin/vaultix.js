#!/usr/bin/env node

import { Command } from 'commander';
import login from '../src/commands/login.js';
import logout from '../src/commands/logout.js';
import init from '../src/commands/init.js';
import status from '../src/commands/status.js';
import pull from '../src/commands/pull.js';
import run from '../src/commands/run.js';

const program = new Command();

program
  .name('vaultix')
  .description('Vaultix Developer CLI — secure secret sync & runtime injection')
  .version('1.0.0');

// Login command
program
  .command('login')
  .description('Authenticate with the Vaultix secrets platform')
  .action(login);

// Logout command
program
  .command('logout')
  .description('Log out and clear active session tokens')
  .action(logout);

// Init command
program
  .command('init')
  .description('Link this directory to a workspace/project/environment')
  .action(init);

// Status command
program
  .command('status')
  .description('Display active authentication session and linked project details')
  .action(status);

// Pull command
program
  .command('pull')
  .description('Pull secrets and write them to a local configuration file')
  .option('-e, --env <environment>', 'specify the environment to pull from (overrides linked config)')
  .option('-f, --format <format>', 'output format (env or json)', 'env')
  .option('-o, --output <file>', 'output file name', '.env')
  .option('-d, --dry-run', 'perform a dry-run showing keys and masked values')
  .option('--stdout', 'print output to standard out instead of writing to disk')
  .action(pull);

// Run command
program
  .command('run')
  .description('Run a command with secrets injected directly into its environment')
  .option('-e, --env <environment>', 'specify the environment to pull from (overrides linked config)')
  .option('-d, --dry-run', 'perform a dry-run showing keys that would be injected')
  .action(async (options, command) => {
    await run(command.args, options);
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(`Invalid command: ${program.args.join(' ')}\nUse "vaultix --help" to see available commands.`);
  process.exit(1);
});

program.parse(process.argv);
