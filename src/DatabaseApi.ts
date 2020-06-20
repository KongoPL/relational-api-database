import {QueryRequest} from "./QueryRequest";

export abstract class DatabaseApi
{
	abstract async getData(query: QueryRequest): Promise<any[]>;
	abstract async insertData(query: QueryRequest): Promise<(string | number)[] | any>;
	abstract async updateData(query: QueryRequest): Promise<any>;
}
