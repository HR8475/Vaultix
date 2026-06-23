import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import apiClient from '../utils/apiClient.js';
import { saveSession } from '../utils/configStore.js';

export default async function auth(providedToken, options = {}) {
  let token = providedToken || options.token || process.env.VAULTIX_TOKEN;

  if (!token) {
    console.log(chalk.bold.indigo ? chalk.bold.indigo('\n🔒 Vaultix Machine Authentication') : chalk.bold.blue('\n🔒 Vaultix Machine Authentication'));
    console.log('Authenticate using an API key (e.g. for CI/CD environments).\n');
    
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter API Key:',
        mask: '*',
        validate: (input) => (input.trim() ? true : 'API key is required'),
      },
    ]);
    token = answers.apiKey.trim();
  }

  if (!token.startsWith('vx_live_')) {
    console.error(chalk.red('\n✖ Invalid API Key format. API keys must start with "vx_live_"'));
    process.exit(1);
  }

  const spinner = ora('Validating API key...').start();

  try {
    const response = await apiClient.post('/auth/api-key', { apiKey: token });
    const { user, workspace, keyName, permissions } = response.data.data;

    saveSession(token, 'apikey');

    spinner.succeed(chalk.green('Authentication successful!'));
    console.log(`\nWorkspace:   ${chalk.bold(workspace.name)}`);
    console.log(`Key Name:    ${chalk.cyan(keyName)}`);
    console.log(`Creator:     ${user.name} (${user.email})`);
    console.log(`Permissions: ${permissions.join(', ')}\n`);
    
  } catch (err) {
    spinner.fail(chalk.red('Authentication failed'));
    if (err.response) {
      console.error(chalk.red(`✖ ${err.response.data.message || 'Invalid or revoked API key'}`));
    } else {
      console.error(chalk.red(`✖ ${err.message || 'Could not connect to the Vaultix server'}`));
    }
    process.exit(1);
  }
}
