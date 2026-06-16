import chalk from 'chalk';
import ora from 'ora';
import apiClient from '../utils/apiClient.js';
import { getSession, getProjectConfig } from '../utils/configStore.js';

export default async function status() {
  const token = getSession();
  const projectConfig = getProjectConfig();

  console.log(chalk.bold('\nVaultix CLI Status:'));

  // 1. Session check
  if (!token) {
    console.log(`  Auth Session: ${chalk.red('Not Logged In')}`);
  } else {
    const spinner = ora('Verifying authentication token...').start();
    try {
      const meRes = await apiClient.get('/auth/me');
      const user = meRes.data.data.user;
      spinner.stop();
      console.log(`  Auth Session: ${chalk.green('Logged In')}`);
      console.log(`  Account:      ${chalk.bold(user.name)} (${user.email})`);
    } catch (err) {
      spinner.stop();
      console.log(`  Auth Session: ${chalk.red('Expired or Invalid Session')}`);
      console.log(chalk.yellow('  Please run "vaultix login" to authenticate again.'));
    }
  }

  // 2. Project config check
  console.log('\nProject Link:');
  if (!projectConfig) {
    console.log(`  Link Status: ${chalk.yellow('Not Linked')}`);
    console.log(chalk.yellow('  Run "vaultix init" in this directory to link a project.'));
  } else {
    console.log(`  Link Status: ${chalk.green('Linked')}`);
    console.log(`  Workspace:   ${chalk.bold(projectConfig.workspaceName)} (${projectConfig.workspaceId})`);
    console.log(`  Project:     ${chalk.bold(projectConfig.projectName)} (${projectConfig.projectId})`);
    console.log(`  Environment: ${chalk.bold(projectConfig.environmentName)} (${projectConfig.environmentId})`);
  }
  console.log();
}
