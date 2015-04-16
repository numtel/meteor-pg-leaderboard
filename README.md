# PostgreSQL Leaderboard Example

The familiar Meteor Leaderboard example modified to use a PostgreSQL backend, reactively!

This example uses the following new package for PostgreSQL integration:

* [numtel:pg](https://github.com/numtel/meteor-pg)

## Quick start

This example requires a PostgresSQL server of version at least 9.3.

```bash
$ git clone https://github.com/numtel/meteor-pg-leaderboard.git
$ cd meteor-pg-leaderboard

# Create new database
$ psql postgres -c "create database leaderboard"

# Import sample tables and data
$ psql leaderboard < leaderboard.sql

# Update database connection settings in your favorite editor
$ ed leaderboard.js

$ meteor
```
