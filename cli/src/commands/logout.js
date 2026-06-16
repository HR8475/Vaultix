import chalk from 'chalk';
import { clearSession } from '../utils/configStore.js';

export default function logout() {
  clearSession();
  console.log(chalk.green('✔ Successfully logged out of Vaultix CLI.'));
}
