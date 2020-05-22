import DatabaseApi from "./DatabaseApi";
import DatabaseCache from "./DatabaseCache";
import QueryRequest from "./QueryRequest";

export default class Database
{
	constructor(private api: DatabaseApi, private cache?: DatabaseCache)
	{}

	getData(request: QueryRequest): any[]
	{
		return this.api.getData(request);
	}
}
