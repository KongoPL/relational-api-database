import DatabaseDataObject, {ERelationType, IRelation} from "../../DatabaseDataObject";
import City from "./City";

export default class User extends DatabaseDataObject<User>
{
	public id: number;
	public firstName: string;
	public lastName : string;
	public age: number;
	public cityId: number | null;

	public city: City | null;

	constructor()
	{
		super();

		this.id = 0;
		this.firstName = '';
		this.lastName = '';
		this.age = 0;
		this.cityId = null;

		this.city = null;
	}

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
			}
		};
	}

	get fullName(): string
	{
		return `${this.firstName} ${this.lastName}`;
	}
}
