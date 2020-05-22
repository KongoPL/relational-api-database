import QueryRequest from "./QueryRequest";

export default abstract class DatabaseApi
{
	abstract getData(query: QueryRequest): any[];
}
