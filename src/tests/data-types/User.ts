import DatabaseDataObject from "../../DatabaseDataObject";

export default class User extends DatabaseDataObject<User>
{
	public id: number;
	public firstName: string;
	public lastName : string;
	public age: number;

	constructor()
	{
		super();

		this.id = 0;
		this.firstName = '';
		this.lastName = '';
		this.age = 0;
	}

	static tableName(): string
	{
		return 'users';
	}

	get fullName(): string
	{
		return `${this.firstName} ${this.lastName}`;
	}
}
