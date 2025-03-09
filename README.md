# Discord Ticket System

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (or any other supported database)

### Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/yourusername/discord-ticket-system.git
    cd discord-ticket-system
    ```

2. Install dependencies:

    ```sh
    npm install
    ```

3. Create a `.env` file by copying the `.env.example` file and filling in the required values:

    ```sh
    cp .env.example .env
    ```

    Edit the `.env` file and set the values for your database and Discord bot token.

4. Set up the database:

    - Make sure your PostgreSQL server is running.
    - Create a new database:

        ```sh
        createdb your_database_name
        ```

    - Run the database migrations:

        ```sh
        npm run migrate
        ```

5. Start the application:

    ```sh
    npm start
    ```

### Environment Variables

- `DB_HOST`: The hostname of your database server.
- `DB_PORT`: The port number your database server is listening on.
- `DB_USER`: The username for your database.
- `DB_PASSWORD`: The password for your database.
- `DB_NAME`: The name of your database.
- `DISCORD_TOKEN`: Your Discord bot token.

### Running Tests

To run tests, use the following command:

```sh
npm test
```

### License

This project is licensed under the MIT License.