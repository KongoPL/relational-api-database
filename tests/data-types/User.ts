import {ERelationType} from "../../src/DatabaseDataObject";
import {City} from "./City";
import {MyDatabaseDataObject} from "./MyDatabaseDataObject";

export class User extends MyDatabaseDataObject<User>
{
	public id: number = 0;
	public firstName: string = '';
	public lastName : string = '';
	public age: number = 0;
	public cityId: number | null = null;
	public tags: string[] = [];

	public city: City | null = null;

	static tableName(): string
	{
		return 'users';
	}

	relations()
	{
		return {
			city: {
				type: ERelationType.ONE_ONE,
				model: City,
				relation: {cityId: 'id'}
			},
			visitedCities: {
				type: ERelationType.MANY_MANY,
				model: City,
				relation: {id: 'userId', cityId: 'id'},
				junctionModel: 'visitedCities'
			}
		};
	}

	get fullName(): string
	{
		return `${this.firstName} ${this.lastName}`;
	}
}
