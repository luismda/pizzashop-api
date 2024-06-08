# Pizza Shop API 🍕

This project is an back-end app for managing a restaurant, including metrics visualization and order control
built with TypeScript, Drizzle and ElysiaJS. 🔥

## Running

This project depends on Docker to setup database. With Docker installed, clone the project, install dependencies, setup Docker containers, create `.env` file and run the application.

> You must also run migrations to create database tables and run the seed to populate the database with fake data.

```sh
# Clone this repository
git clone https://github.com/luismda/pizzashop-api.git

# Install the dependencies
bun i

# Start docker container
docker compose up -d

# Create database tables
bun migrate

# Populate the database with fake data
bun seed

# Start project
bun dev
```

## Features

> The **summary** of the features are listed below.

- it should be able to register a new restaurant
- it should be able to sign in as a restaurant manager
- it should be able to manage the restaurant orders
- it should be able to list metrics from the restaurant