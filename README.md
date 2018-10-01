# Ghost upload theme

Using [TryGhost/Ghost](https://github.com/TryGhost/Ghost) and customizing some themes for your website?

If you'd like to automate the upload of the new or updated theme as part of a CI task for example, this package is what you're looking for.

# How to use the CLI

```
yarn global add ghost-upload-theme

ghost-upload-theme
    --environment-path ./path/to/your/env/.env
    --theme-path ./path/to/your/theme.zip --activate-theme
    --routes-path ./path/to/your/routes.yaml
    --content-path ./path/to/your/exported/content*.json
    --init # use this if the ghost install is completely fresh, no users created
```

# Environment

Environment variables will be read from actual env vars, `.env`, or a dotenv
file passed in as `--environment-path ./path/to/your/env/.env`

Configurable environment variables are:

| Var                        | e.g.                  | Description                                                                                                                  |
| -------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| GHOST_URL                  | http://localhost:3001 | The url of the ghost instance that you're targeting (could be production or localhost)                                       |
| GHOST_ADMIN_EMAIL          | j.bloggs@example.com  | Email of the admin user                                                                                                      |
| GHOST_ADMIN_PASSWORD       | hunter123456789       | Their password - if you're running `--init`, note this has to be >10 chars                                                   |
| GHOST_API_FETCH_TIMEOUT_MS | 10000                 | Max time the api calls will wait for ghost to respond. Note in CI systems this can be quite a long time - 60000 is suggested |

# Dev

Watch mode and display dev outputs:

```
yarn run start
DEBUG=* node dist/ghost-upload-theme.umd.js --theme-path /your/theme.zip
```
