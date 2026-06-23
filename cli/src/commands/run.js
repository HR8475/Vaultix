import { spawn } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import apiClient from '../utils/apiClient.js';
import { getSession, getProjectConfig } from '../utils/configStore.js';

export default async function run(args, options = {}) {
  const token = getSession();
  if (!token) {
    console.error(chalk.yellow('⚠ You are not authenticated. Please run "vaultix login" or "vaultix auth <api-key>" first.'));
    process.exit(1);
  }

  const projectConfig = getProjectConfig();
  if (!projectConfig) {
    console.error(chalk.yellow('⚠ Project is not linked. Please run "vaultix init" first.'));
    process.exit(1);
  }

  if (!args || args.length === 0) {
    console.error(chalk.red('✖ Error: No command specified. Usage: vaultix run -- <command>'));
    process.exit(1);
  }

  let { workspaceId, projectId, environmentId, environmentName } = projectConfig;

  try {
    // 1. Dynamic Environment Switching
    if (options.env) {
      const envSpinner = ora(`Resolving environment "${options.env}"...`).start();
      const envsRes = await apiClient.get(`/workspaces/${workspaceId}/environments/${projectId}`);
      const environments = envsRes.data.data.environments || [];
      envSpinner.stop();

      const matchedEnv = environments.find(
        (e) =>
          e.slug.toLowerCase() === options.env.toLowerCase() ||
          e.name.toLowerCase() === options.env.toLowerCase()
      );

      if (!matchedEnv) {
        console.error(chalk.red(`\n✖ Environment "${options.env}" not found in this project.`));
        process.exit(1);
      }

      environmentId = matchedEnv._id;
      environmentName = matchedEnv.name;
    }

    // 2. Fetch Secrets
    const listSpinner = ora(`Fetching secrets for ${chalk.bold(environmentName)}...`).start();
    const secretsRes = await apiClient.get(
      `/workspaces/${workspaceId}/environments/${projectId}/${environmentId}/secrets`
    );
    const secrets = secretsRes.data.data.secrets || [];
    listSpinner.stop();

    const keys = secrets.map((s) => s.key);

    // 3. Handle Dry Run
    if (options.dryRun) {
      console.log(chalk.bold.yellow('\n--- RUN DRY RUN ---'));
      console.log(`Command to run:  ${chalk.cyan(args.join(' '))}`);
      console.log(`Secrets count:   ${secrets.length}`);
      console.log(`Keys to inject:  ${keys.length > 0 ? keys.join(', ') : 'None'}`);
      console.log(chalk.yellow('\n[Dry-Run] Executable process was not spawned. No reads audited.'));
      return;
    }

    // 4. Decrypt Secrets Concurrently
    const decryptSpinner = ora(`Decrypting ${secrets.length} secret(s) and preparing environment...`).start();
    const decryptedSecrets = {};

    if (secrets.length > 0) {
      const decryptPromises = secrets.map(async (secret) => {
        const revealRes = await apiClient.get(
          `/workspaces/${workspaceId}/environments/${projectId}/${environmentId}/secrets/${secret._id}/reveal`
        );
        decryptedSecrets[secret.key] = revealRes.data.data.plaintext;
      });
      await Promise.all(decryptPromises);
    }
    decryptSpinner.stop();

    // 5. Inject Secrets & Spawn Process
    const [command, ...cmdArgs] = args;

    console.log(chalk.green(`\n🚀 Injecting ${secrets.length} secret(s) and running: ${chalk.bold(args.join(' '))}\n`));

    const child = spawn(command, cmdArgs, {
      stdio: 'inherit',
      env: {
        ...process.env,
        ...decryptedSecrets,
      },
      shell: true, // required for npm and native execution on Windows
    });

    child.on('error', (err) => {
      console.error(chalk.red(`✖ Failed to start command: ${err.message}`));
      process.exit(1);
    });

    child.on('close', (code) => {
      process.exit(code);
    });
  } catch (err) {
    console.error(chalk.red('\n✖ Execution failed'));
    if (err.response) {
      console.error(chalk.red(err.response.data.message || 'Error communicating with server.'));
    } else {
      console.error(chalk.red(err.message || 'An unknown network or spawn error occurred.'));
    }
    process.exit(1);
  }
}
