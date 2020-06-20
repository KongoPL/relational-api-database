import {DatabaseApi} from "./DatabaseApi";
import {DatabaseCache} from "./DatabaseCache";
import {QueryRequest} from "./QueryRequest";

export class Database
{
	constructor(private api: DatabaseApi, private cache?: DatabaseCache)
	{}

	getData(query: QueryRequest): Promise<any[]>
	{
		const isQueryValid = query.validate('select');

		if(isQueryValid !== true)
			throw new Error(`Query is not valid! Reason: ${isQueryValid}`);

		return this.api.getData(query);
	}

	insertData(query: QueryRequest): Promise<(string | number)[] | any>
	{
		const isQueryValid = query.validate('insert');

		if(isQueryValid !== true)
			throw new Error(`Query is not valid! Reason: ${isQueryValid}`);

		return this.api.insertData(query);
	}

	updateData(query: QueryRequest): Promise<any>
	{
		const isQueryValid = query.validate('update');

		if(isQueryValid !== true)
			throw new Error(`Query is not valid! Reason: ${isQueryValid}`);

		return this.api.updateData(query);
	}
}
