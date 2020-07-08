import {MemoryApi, TMemoryApiDatabase} from "../api/MemoryApi";
import {DatabaseCache} from "../DatabaseCache";
import {QueryRequest} from "../QueryRequest";

export class MemoryCache extends DatabaseCache
{
	protected queries: TCachedQuery[] = [];
	private api: MemoryApi;

	constructor()
	{
		super();

		this.api = new MemoryApi();
	}


	cacheDatabase(database: TMemoryApiDatabase)
	{
		this.api.loadDatabase(database);
	}


	hasCachedDatabase(): boolean
	{
		return this.api.hasLoadedDatabase();
	}


	cacheQuery(type: string, query: QueryRequest, output: any)
	{
		this.queries.push({
			type,
			queryString: query.toString(),
			output
		});
	}


	hasCachedQuery(type: string, query: QueryRequest)
	{
		const queryString = query.toString();

		return this.queries.some((q) => q.type == type && q.queryString == queryString);
	}


	getQueryOutput(type: string, query: QueryRequest): any
	{
		const queryString = query.toString();
		const cachedQuery = this.queries.find((q) => q.type == type && q.queryString == queryString);

		if(cachedQuery)
			return cachedQuery.output;
	}


	async deleteData(query: QueryRequest): Promise<any>
	{
		return await this.api.deleteData(query);
	}


	async getData(query: QueryRequest): Promise<any[]>
	{
		return await this.api.getData(query);
	}


	async insertData(query: QueryRequest): Promise<(string | number)[] | any>
	{
		return await this.api.insertData(query);
	}


	async updateData(query: QueryRequest): Promise<any>
	{
		return await this.api.updateData(query);
	}
}

type TCachedQuery = {
	type: string,
	queryString: string,
	output: any
};
