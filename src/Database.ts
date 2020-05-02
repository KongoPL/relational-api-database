import DatabaseApi from "./DatabaseApi";
import DatabaseCache from "./DatabaseCache";

export default class Database
{
	constructor(private api: DatabaseApi, private cache?: DatabaseCache)
	{}


}
