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
@todo

### No dependencies
There are no dependencies required to use library which makes it lightweight - 19.4kB!

## Installation
`npm i relational-api-database`

## How to use
First, you need to setup whole database for usage. 
To do that, in main component of your application (i.e. `src/App.tsx` for React or `src/app/app.module.ts` for Angular) you need to:
* Declare API (and setup it if needed)
* Create database object with API of your choice
* Inject this database into base object of all Data Objects

Example:
```typescript
import {Database, DatabaseDataObject, MemoryApi} from "relational-api-database";

// Declare API:
const memoryAPI = new MemoryApi();

// Setup this API:
memoryAPI.loadDatabase({
	MyModels: [
		{
			id: 1,
			name: 'John Doe'
		}
	]
});

// Create database object with chosen API:
const db = new Database(memoryAPI);

// Inject this database object to all models:
DatabaseDataObject.injectDatabase(db);
```
To make it work, we need to have Data Object, which we will refer to records in declared table:
```typescript
class MyModel extends DatabaseDataObject<MyModel>
{
	public id: number = 0;
	public name: string = '';

	static tableName()
	{
		return 'MyModels';
	}
}
```
Now to get data we simply use this simple code:
```typescript
let model = await MyModel.findOneByAttributes({id: 1});

console.log(model.name); // "John Doe"
```

## Testing
`npm run test`

## License
[MIT](LICENSE)
