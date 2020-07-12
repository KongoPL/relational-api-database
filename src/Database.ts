import {DatabaseApi} from "./DatabaseApi";
import {DatabaseCache} from "./DatabaseCache";
import {QueryRequest, TQueryRequestProperties} from "./QueryRequest";

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


	async getData(query: QueryRequest | TQueryRequestProperties): Promise<any[]>
	{
		let preparedQuery = this.prepareQuery(query);

		this.validateQuery('select', preparedQuery);

		if(this._cache)
		{
			if(this._cache.hasCachedDatabase())
				return await this._cache.getData(preparedQuery);
			else if(preparedQuery.cache && this._cache.hasCachedQuery('select', preparedQuery))
				return this._cache.getQueryOutput('select', preparedQuery);
		}

		const response = await this.api.getData(preparedQuery);

		if(this._cache && preparedQuery.cache)
			this._cache.cacheQuery('select', preparedQuery, response);

		return response;
	}


	insertData(query: QueryRequest | TQueryRequestProperties): Promise<(string | number)[] | any>
	{
		let preparedQuery = this.prepareQuery(query);

		this.validateQuery('insert', preparedQuery);

		return this.api.insertData(preparedQuery).then(async (response) => {
			if(this._cache)
			{
				const cacheRequest = new QueryRequest(preparedQuery.toObject());

				for(let i in cacheRequest.data)
					for(let key in response[i])
						cacheRequest.data[i][key] = response[i][key];

				await this._cache.insertData(cacheRequest);
			}
		});
	}


	updateData(query: QueryRequest | TQueryRequestProperties): Promise<any>
	{
		let preparedQuery = this.prepareQuery(query);

		return this.validateQuery('update', preparedQuery) && this.api.updateData(preparedQuery).then(async () => {
			if(this._cache)
				await this._cache.updateData(preparedQuery);
		});
	}


	deleteData(query: QueryRequest | TQueryRequestProperties): Promise<any>
	{
		let preparedQuery = this.prepareQuery(query);

		return this.validateQuery('delete', preparedQuery)
			&& this.api.deleteData(preparedQuery).then(async () => {
				if(this._cache)
					await this._cache.deleteData(preparedQuery);
			});
	}


	protected prepareQuery(query: QueryRequest | TQueryRequestProperties): QueryRequest
	{
		if(query instanceof QueryRequest)
			return query;
		else
			return new QueryRequest(query);
	}


	protected validateQuery(type: 'select' | 'update' | 'delete' | 'insert', query: QueryRequest): true
	{
		const isQueryValid = query.validate(type);

		if(isQueryValid !== true)
			throw new Error(`Query is not valid! Reason: ${isQueryValid}`);

		return true;
	}
}
