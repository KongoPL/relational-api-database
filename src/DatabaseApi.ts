import {QueryRequest} from "./QueryRequest";

export abstract class DatabaseApi
{
	abstract async getData(query: QueryRequest): Promise<any[]>;
	abstract async insertData(query: QueryRequest): Promise<({_key: string | number, [key: string]: any})[]>;
	abstract async updateData(query: QueryRequest): Promise<any>;
	abstract async deleteData(query: QueryRequest): Promise<any>;
}
