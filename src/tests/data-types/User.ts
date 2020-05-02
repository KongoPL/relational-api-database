import DatabaseDataObject from "../../DatabaseDataObject";

export default class User extends DatabaseDataObject
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

	get fullName(): string
	{
		return `${this.firstName} ${this.lastName}`;
	}
}
