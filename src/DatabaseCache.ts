import {DatabaseApi} from "./DatabaseApi";
import {TMemoryApiDatabase} from "./api/MemoryApi";
import {QueryRequest} from "./QueryRequest";

export abstract class DatabaseCache extends DatabaseApi
{
	abstract cacheDatabase(database: TMemoryApiDatabase);
	abstract cacheQuery(type: string, query: QueryRequest, output: any);
	abstract hasCachedQuery(type: string, query: QueryRequest): boolean;
	abstract hasCachedDatabase(): boolean;
	abstract getQueryOutput(type: string, query: QueryRequest): any;
}
