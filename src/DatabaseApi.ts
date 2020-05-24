import {QueryRequest} from "./QueryRequest";

export abstract class DatabaseApi
{
	abstract async getData(query: QueryRequest): Promise<any[]>;
}
