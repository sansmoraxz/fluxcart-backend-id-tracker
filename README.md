# Task
Identity Reconciliation for customers across multiple purchases.

## Application stack
- Typescript
- NodeJS
- Express
- Prisma
- Postgres

## How to run the project?

Use with docker compose
```bash
docker compose up
```

Make sure that *docker compose v2* plugin is installed.

The application by default will run on port `8000` and use postgres database that has been configured in the docker-compose file.

You may then hit the endpoints as per the task description.
For example, with curl:
```bash
curl --location 'localhost:8000/identify' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email":"mcfly@hillvalley.edu",
  "phoneNumber":"123456"
}'
```

