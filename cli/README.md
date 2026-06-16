# Vaultix Developer CLI

A Node.js command-line interface for the **Vaultix Secrets Platform**. Authenticate securely, link project workspaces, and inject environment variables dynamically into your local execution environment at runtime.

---

## Installation

You can link and install the CLI globally on your system for local testing:

```bash
cd cli
npm install
npm link
```

This will register the `vaultix` command in your global shell path.

---

## Commands and Usage

### 1. Authenticate with the Vaultix Backend
Sign in to your account. You will be prompted to enter your Email and Password:

```bash
vaultix login
```

### 2. Check Authentication & Link Status
Show whether you are currently authenticated and if the current project directory is linked to any Vaultix workspace:

```bash
vaultix status
```

### 3. Link Local Directory
Initialize the connection. The CLI will load your active workspaces, projects, and environments from the server, prompting you to select one. It writes a `.vaultix.json` configuration file locally:

```bash
vaultix init
```

### 4. Pull Environment Variables
Download secrets for the linked project/environment. By default, it writes to a local `.env` file in the current working directory:

```bash
# Pull into default .env file
vaultix pull

# Pull secrets from a specific environment (e.g. staging)
vaultix pull --env staging

# Pull and write to a custom file (e.g., .env.local)
vaultix pull --output .env.local

# Pull in JSON format
vaultix pull --format json --output config.json

# Dry-run mode: prints only keys and masked values without making audits
vaultix pull --dry-run
```

### 5. Inject Secrets into Runtime Processes (Recommended)
This is the recommended developer flow. Instead of writing plaintext secrets to disk, it decrypts secrets in-memory and injects them directly into the environment variables of your spawned application process:

```bash
# Inject dev secrets and start the dev server
vaultix run -- npm run dev

# Run staging secrets with node start
vaultix run --env staging -- node app.js

# Dry-run: shows what keys would be injected without executing the process
vaultix run --dry-run
```

### 6. Sign Out / Clear Sessions
Log out and clear active session keys from your system:

```bash
vaultix logout
```

---

## Testing

To run the local unit tests, run:

```bash
npm test
```
