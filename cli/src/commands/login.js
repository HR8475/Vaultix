import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import apiClient from '../utils/apiClient.js';
import { saveSession } from '../utils/configStore.js';

export default async function login() {
  console.log(chalk.bold.indigo ? chalk.bold.indigo('\n🔒 Welcome to Vaultix CLI') : chalk.bold.blue('\n🔒 Welcome to Vaultix CLI'));
  console.log('Please enter your credentials to authenticate with the server.\n');

  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Email address:',
        validate: (input) => (input.trim() ? true : 'Email is required'),
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*',
        validate: (input) => (input ? true : 'Password is required'),
      },
    ]);

    const spinner = ora('Authenticating with Vaultix...').start();

    const response = await apiClient.post('/auth/login', {
      email: answers.email.trim(),
      password: answers.password,
    });

    const { token, user } = response.data.data;
    saveSession(token);

    spinner.succeed(chalk.green('Authentication successful!'));
    console.log(`Logged in as ${chalk.bold(user.name)} (${user.email}).`);
  } catch (err) {
    console.error(chalk.red('\n✖ Login failed'));
    if (err.response) {
      console.error(chalk.red(err.response.data.message || 'Invalid email or password.'));
    } else {
      console.error(chalk.red(err.message || 'Could not connect to the Vaultix server.'));
    }
    process.exit(1);
  }
}
