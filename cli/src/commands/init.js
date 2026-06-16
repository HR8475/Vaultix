import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import apiClient from '../utils/apiClient.js';
import { getSession, saveProjectConfig } from '../utils/configStore.js';

export default async function init() {
  const token = getSession();
  if (!token) {
    console.error(chalk.yellow('⚠ You are not authenticated. Please run "vaultix login" first.'));
    process.exit(1);
  }

  try {
    // 1. Fetch Workspaces
    const wsSpinner = ora('Loading workspaces...').start();
    const wsRes = await apiClient.get('/workspaces');
    const workspaces = wsRes.data.data.workspaces || [];
    wsSpinner.stop();

    if (workspaces.length === 0) {
      console.log(chalk.red('✖ No workspaces found. Please create one on the dashboard first.'));
      process.exit(1);
    }

    const wsChoices = workspaces.map((w) => ({
      name: `${w.name} (${w.slug})`,
      value: { id: w._id, name: w.name },
    }));

    const { selectedWorkspace } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedWorkspace',
        message: 'Select a Workspace:',
        choices: wsChoices,
      },
    ]);

    // 2. Fetch Projects
    const projSpinner = ora('Loading projects...').start();
    const projRes = await apiClient.get(`/workspaces/${selectedWorkspace.id}/projects`);
    const projects = projRes.data.data.projects || [];
    projSpinner.stop();

    if (projects.length === 0) {
      console.log(chalk.red('✖ No projects found in this workspace. Create a project first.'));
      process.exit(1);
    }

    const projChoices = projects.map((p) => ({
      name: p.name,
      value: { id: p._id, name: p.name },
    }));

    const { selectedProject } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedProject',
        message: 'Select a Project:',
        choices: projChoices,
      },
    ]);

    // 3. Fetch Environments
    const envSpinner = ora('Loading environments...').start();
    const envRes = await apiClient.get(`/workspaces/${selectedWorkspace.id}/environments/${selectedProject.id}`);
    const environments = envRes.data.data.environments || [];
    envSpinner.stop();

    if (environments.length === 0) {
      console.log(chalk.red('✖ No environments found in this project. Create an environment first.'));
      process.exit(1);
    }

    const envChoices = environments.map((e) => ({
      name: `${e.name} (${e.slug})`,
      value: { id: e._id, name: e.name },
    }));

    const { selectedEnv } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedEnv',
        message: 'Select an Environment:',
        choices: envChoices,
      },
    ]);

    // Save project configuration locally
    const projectConfig = {
      workspaceId: selectedWorkspace.id,
      workspaceName: selectedWorkspace.name,
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      environmentId: selectedEnv.id,
      environmentName: selectedEnv.name,
    };

    saveProjectConfig(projectConfig);

    console.log(chalk.green('\n✔ Vaultix project linked successfully!'));
    console.log(`Saved link configuration to local ${chalk.bold('.vaultix.json')}:`);
    console.log(`  Workspace:   ${chalk.bold(selectedWorkspace.name)}`);
    console.log(`  Project:     ${chalk.bold(selectedProject.name)}`);
    console.log(`  Environment: ${chalk.bold(selectedEnv.name)}`);
  } catch (err) {
    console.error(chalk.red('\n✖ Link initialization failed'));
    if (err.response) {
      console.error(chalk.red(err.response.data.message || 'Error communicating with server.'));
    } else {
      console.error(chalk.red(err.message || 'An unknown network error occurred.'));
    }
    process.exit(1);
  }
}
