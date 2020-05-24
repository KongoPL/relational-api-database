import {DatabaseApi} from "./DatabaseApi";
import {DatabaseCache} from "./DatabaseCache";
import {QueryRequest} from "./QueryRequest";

export class Database
{
	constructor(private api: DatabaseApi, private cache?: DatabaseCache)
	{}

	getData(request: QueryRequest): Promise<any[]>
	{
		return this.api.getData(request);
	}
}
