import {ERelationType} from '../../src/DatabaseDataObject';
import {User} from "./User";
import {MyDatabaseDataObject} from "./MyDatabaseDataObject";

export class Currency extends MyDatabaseDataObject<Currency>
{
	public userId: number | null = null;
	public name: string = '';
	public value: number = 0;

	static tableName(): string
	{
		return 'currencies';
	}
}
