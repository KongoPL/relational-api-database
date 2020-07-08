import {DatabaseApi} from "./DatabaseApi";
import {DatabaseCache} from "./DatabaseCache";
import {QueryRequest} from "./QueryRequest";

export class Database
{
	public enableCache: boolean;

	constructor(public api: DatabaseApi, private _cache?: DatabaseCache)
	{
		this.enableCache = (typeof this._cache !== 'undefined');
	}

	set cache(cache: DatabaseCache | false)
	{
		this.enableCache = !!cache;

		if(this.enableCache)
			this.cache = cache;
		else
			delete this.cache;
	}

	get cache(): DatabaseCache | false
	{
		return this._cache ? this._cache : false;
	}

	async getData(query: QueryRequest): Promise<any[]>
	{
		this.validateQuery('select', query);

		if(this._cache)
		{
			if(this._cache.hasCachedDatabase())
				return await this._cache.getData(query);
			else if(query.cache && this._cache.hasCachedQuery('select', query))
				return this._cache.getQueryOutput('select', query);
		}

		const response = await this.api.getData(query);

		if(this._cache && query.cache)
			this._cache.cacheQuery('select', query, response);

		return response;
	}

	insertData(query: QueryRequest): Promise<(string | number)[] | any>
	{
		this.validateQuery('insert', query);

		return this.api.insertData(query).then(async (response) => {
			if(this._cache)
			{
				const cacheRequest = new QueryRequest(query.toObject());

				for(let i in cacheRequest.data)
					for(let key in response[i])
						cacheRequest.data[i][key] = response[i][key];

				await this._cache.insertData(cacheRequest);
			}
		});
	}

	updateData(query: QueryRequest): Promise<any>
	{
		return this.validateQuery('update', query) && this.api.updateData(query).then(async () => {
			if(this._cache)
				await this._cache.updateData(query);
		});
	}

	deleteData(query: QueryRequest): Promise<any>
	{
		return this.validateQuery('delete', query) && this.api.deleteData(query).then(async () => {
			if(this._cache)
				await this._cache.deleteData(query);
		});
	}

	private validateQuery(type: 'select' | 'update' | 'delete' | 'insert', query: QueryRequest): true
	{
		const isQueryValid = query.validate(type);

		if(isQueryValid !== true)
			throw new Error(`Query is not valid! Reason: ${isQueryValid}`);

		return true;
	}
}
