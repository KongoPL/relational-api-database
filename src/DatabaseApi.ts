import QueryRequest from "./QueryRequest";

export default abstract class DatabaseApi
{
	abstract async getData(query: QueryRequest): Promise<any[]>;
}
