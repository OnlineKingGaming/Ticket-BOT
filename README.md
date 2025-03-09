# Discord Ticket System

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Mariadb (or any other database)

### Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/OnlineKingGaming/Ticket-BOT.git
    cd Ticket-BOT
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

5. Initialize BOT and Commands:

    ```sh
    npm run init
    ```

5. Start the application:

    ```sh
    npm start
    ```

### Environment Variables

- `DB_HOST`: The hostname of your database server.
- `DB_PORT`: The port number your database server is listening on.
- `MYSQL_USER`: The username for your database.
- `MYSQL_PASSWORD`: The password for your database.
- `DB_NAME`: The name of your database.
- `TOKEN`: Your Discord bot token.

### Running Tests

To run tests, use the following command:

```sh
npm test
```

### License

This project is licensed under the MIT License.