# Acquisitions API – Dockerized Setup

This repository now includes a Docker-based workflow tailored for running the app with Neon in both development and production.

## Prerequisites
- Docker Engine and Docker Compose v2
- A Neon account and API key (for managing cloud branches)
- Optional: the `neon` CLI if you want to inspect Neon Local state directly

## Environment Configuration

Two dedicated environment files are provided:

| Environment | File                           | Description |
|-------------|--------------------------------|-------------|
| Development | `.env.development` / `.env.development.example` | Uses Neon Local running inside Docker (`neon-local` service). Copy the example file and update credentials. |
| Production  | `.env.production` / `.env.production.example`   | Points to your managed Neon Cloud database. Copy the example file and update secrets. |

`src/index.js` will load `.env.${NODE_ENV}` if it exists, or fall back to the default `.env`. Docker Compose automatically passes the right file to the application containers. Copy the example files (`cp .env.development.example .env.development`, `cp .env.production.example .env.production`) and replace the placeholders with real values—preferably supplied by a secrets manager in production.

### Switching `DATABASE_URL`
- **Development**: `postgres://neonlocal:neonlocal@neon-local:5432/acquisitions?sslmode=disable&branch=dev`
  - The host `neon-local` resolves to the Neon Local proxy container.
  - The `branch=dev` query parameter instructs Neon Local to create an ephemeral branch named `dev` on first use; add other branch names (e.g. `test`) to spin up additional branches automatically.
- **Production**: `postgres://...neon.tech...`
  - Provide the Neon Cloud connection string. Neon’s dashboard exposes the managed database URL.

## Local Development with Neon Local

Run the full stack (app + Neon Local) with:

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Or use the helper script: `npm run dev:docker`. It spins up Neon Local, retries migrations until the proxy is ready, and then tails the stack in the foreground (hit `Ctrl+C` to stop).

- `neon-local` runs the official `ghcr.io/neondatabase/neon-local:latest` image and exposes Postgres on port `5432`.
- The application container is built from the `development` target in the Dockerfile, mounts your working tree, and runs `npm run dev` (which uses `node --watch`).
- On first connection, Neon Local creates the `dev` branch declared in the connection string. Add additional branch-specific URLs (e.g. `?branch=test`) in your environment file to seed extra ephemeral branches.
- Logs stream to the terminal; stop the stack with `Ctrl+C`.
- Neon Local can take a few seconds to finish bootstrapping; wait until it prints a ready message before running migrations or tests.

### Executing Database Commands
You can connect to Neon Local directly from your host, for example:

```bash
psql postgres://neonlocal:neonlocal@localhost:5432/acquisitions?sslmode=disable&branch=dev
```

Replace credentials with the ones you configured in `.env.development`.

## Production Build and Deployment

To build a production-ready image and run it (pointing at Neon Cloud):

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

- The compose file uses the `production` target in the Dockerfile, which installs only runtime dependencies and runs `node src/index.js`.
- Secrets such as `DATABASE_URL` and `ARCJET_KEY` are provided through `.env.production` (or overridden with your deployment platform’s secret manager). The container does **not** start a Neon Local proxy; it connects directly to the managed Neon Cloud endpoint.

### Deploying Elsewhere
- Build the production image: `docker build --target production -t acquisitions-api .`
- Push it to your registry of choice.
- Supply the production environment variables (especially `DATABASE_URL`) via your hosting platform’s secret management.

## Repository Notes
- `docker-compose.dev.yml` and `docker-compose.prod.yml` capture the different Postgres strategies—Neon Local during development vs. Neon Cloud in production.
- The Dockerfile provides two targets (`development`, `production`) so you can reuse the same build definition everywhere.
- Remember to keep `.env.development` and `.env.production` out of version control if they contain real secrets. The committed versions include only placeholders.

## Troubleshooting
- **Neon Local not healthy**: ensure the Docker image has been pulled successfully. Use `docker compose -f docker-compose.dev.yml logs neon-local` for diagnostics.
- **Branch missing**: append `?branch=branch_name` to the Postgres URL; Neon Local will create the branch if it does not exist.
- **Connection refused**: confirm port `5432` is free on your host or change the published port in the compose file.
- **Pull denied for `ghcr.io/neondatabase/neon-local`**: authenticate with GitHub Container Registry (`docker login ghcr.io`) or mirror the image to a registry accessible from your network.
