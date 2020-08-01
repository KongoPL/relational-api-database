# Relational API Database
Relational API Database allows you to manage records in database via API.

## Features

### Safe for frontend
Relational API Database works on any given API that matches specification. 
It means that you can use records stored in memory, external REST API and direct connection to database as well! 

### Simple API
API provides currently 4 operations on data: get, insert, update, delete. 
Those are required basic operations for each API (however it might be extended by new functionalities).

### Database Data Objects AKA Models
The hearth of this project. Database Data Objects allows you to find records and manage them.
Their functionality is very similar to Models in MVC pattern.

### Most important - relations between Data Objects
Each Data Object might have defined relations. Currently supported relations are:
* One to one
* One to many
* Many to many (via junction table)

Each relation have defined type of loading - lazy (default) or eager.

### Data caching
Cache allows you to keep query responses in memory as well as whole database. 
There are 3 places that might be used as cache:
* Memory
* Session Storage (planned in future)
* Web Storage (planned in future)

### Cross browser
LOREM IPSUM DOLOR SIT AMET (@todo)

### No dependencies
There are no dependencies required to use library which makes it lightweight - 19.4kB!

## Installation
`npm i relational-api-database`

## How to use
(Here put simple example @todo)

## Testing
`npm run test`

## License
