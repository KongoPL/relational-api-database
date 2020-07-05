import {ERelationType} from '../../src/DatabaseDataObject';
import {User} from "./User";
import {MyDatabaseDataObject} from "./MyDatabaseDataObject";

export class City extends MyDatabaseDataObject<City>
{
	public id: number = 0;
	public name: string = '';

	public users: User[] = [];

	static tableName(): string
	{
		return 'cities';
	}

	relations()
	{
		return {
			users: {
				type: ERelationType.ONE_MANY,
				model: User,
				relation: {id: 'cityId'}
			}
		};
	}

	protected unwantedAttributes(): string[]
	{
		return [
			...super.unwantedAttributes(),
			'users'
		];
	}
}
