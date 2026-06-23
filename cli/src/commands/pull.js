import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import apiClient from '../utils/apiClient.js';
import { getSession, getProjectConfig } from '../utils/configStore.js';

export default async function pull(options = {}) {
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

    // 2. Fetch Secrets (Masked list)
    const listSpinner = ora(`Fetching secrets for ${chalk.bold(environmentName)}...`).start();
    const secretsRes = await apiClient.get(
      `/workspaces/${workspaceId}/environments/${projectId}/${environmentId}/secrets`
    );
    const secrets = secretsRes.data.data.secrets || [];
    listSpinner.stop();

    if (secrets.length === 0) {
      console.log(chalk.yellow(`⚠ No secrets found in environment "${environmentName}".`));
      return;
    }

    // 3. Handle Dry-Run Mode
    if (options.dryRun) {
      console.log(chalk.bold.yellow('\n--- DRY RUN (Exposing Masked Values) ---'));
      secrets.forEach((secret) => {
        console.log(`${chalk.cyan(secret.key)}=********`);
      });
      console.log(chalk.yellow(`\n[Dry-Run] ${secrets.length} secret(s) found. No files written, no reads audited.`));
      return;
    }

    // 4. Decrypt Secrets Concurrently
    const decryptSpinner = ora(`Decrypting ${secrets.length} secret(s)...`).start();
    const decryptedSecrets = {};

    const decryptPromises = secrets.map(async (secret) => {
      const revealRes = await apiClient.get(
        `/workspaces/${workspaceId}/environments/${projectId}/${environmentId}/secrets/${secret._id}/reveal`
      );
      decryptedSecrets[secret.key] = revealRes.data.data.plaintext;
    });

    await Promise.all(decryptPromises);
    decryptSpinner.stop();

    // 5. Format Output
    let outputContent = '';
    const format = (options.format || 'env').toLowerCase();

    if (format === 'json') {
      outputContent = JSON.stringify(decryptedSecrets, null, 2);
    } else {
      // dotenv format
      outputContent = Object.entries(decryptedSecrets)
        .map(([key, val]) => {
          // Quote if contains spaces or special characters
          const cleanVal = /[\s#='"$&*?|()<>~`]/.test(val) ? `"${val.replace(/"/g, '\\"')}"` : val;
          return `${key}=${cleanVal}`;
        })
        .join('\n') + '\n';
    }

    // 6. Output Target (stdout or file)
    if (options.stdout) {
      process.stdout.write(outputContent);
    } else {
      const outputFilename = options.output || '.env';
      const outputPath = path.resolve(process.cwd(), outputFilename);

      fs.writeFileSync(outputPath, outputContent, 'utf8');
      console.log(chalk.green(`✔ Successfully pulled ${secrets.length} secret(s) to ${chalk.bold(outputFilename)}.`));
    }
  } catch (err) {
    console.error(chalk.red('\n✖ Pull failed'));
    if (err.response) {
      console.error(chalk.red(err.response.data.message || 'Error communicating with server.'));
    } else {
      console.error(chalk.red(err.message || 'An unknown network error occurred.'));
    }
    process.exit(1);
  }
}
export { pull };
