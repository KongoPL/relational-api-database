import {ERelationLoadingType, ERelationType, TRelation} from "../../src/DatabaseDataObject";
import {City} from "./City";
import {MyDatabaseDataObject} from "./MyDatabaseDataObject";
import {Currency} from "./Currency";

export class User extends MyDatabaseDataObject<User>
{
	public id: number = 0;
	public firstName: string = '';
	public lastName : string = '';
	public age: number = 0;
	public cityId: number | null = null;
	public tags: string[] = [];

	public city: City | null = null;
	public visitedCities: City[] = [];
	public currencies: Currency[] = [];

	public beforeSaveReturnValue: boolean = true;

	static tableName(): string
	{
		return 'users';
	}

	relations(): TRelation
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
			},
			currencies: {
				type: ERelationType.ONE_MANY,
				model: Currency,
				relation: {id: 'userId'},
				loading: ERelationLoadingType.EAGER
			}
		};
	}

	protected unwantedAttributes(): string[]
	{
		return [
			...super.unwantedAttributes(),
			'beforeSaveReturnValue',
			'city',
			'visitedCities',
			'currencies'
		];
	}

	protected beforeSave(isNewRecord: boolean): boolean
	{
		return this.beforeSaveReturnValue;
	}

	get fullName(): string
	{
		return `${this.firstName} ${this.lastName}`;
	}
}
