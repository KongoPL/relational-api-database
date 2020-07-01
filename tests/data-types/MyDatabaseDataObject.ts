import {DatabaseDataObject} from "../../src/DatabaseDataObject";

export abstract class MyDatabaseDataObject<T> extends DatabaseDataObject<T>
{
	static async findById(id: string | number)
	{
		return this.findOneByAttributes({id});
	}
}
