import {DatabaseDataObject, ERelationType} from '../DatabaseDataObject';
import {User} from "./User";

export class City extends DatabaseDataObject<City>
{
	public id: number;
	public name: string;

	public users: User[];

	constructor()
	{
		super();

		this.id = 0;
		this.name = '';
		this.users = [];
	}

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
}
