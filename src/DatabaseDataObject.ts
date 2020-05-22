import Database from "./Database";
import QueryRequest, {ICondition, TLimit, TOrder} from "./QueryRequest";

export default abstract class DatabaseDataObject<T>
{
	static db;

	static injectDatabase(db: Database)
	{
		DatabaseDataObject.db = db;
	}

	static tableName(): string
	{
		throw new Error('Table name is not given!');
	}

	static findOneByAttributes(attributes: {[key: string]: any})
	{
		if(typeof attributes != "object" || Array.isArray(attributes))
			throw new Error('Attributes have to be strict object!');

		return this.findOne({
			conditions: attributes
		});
	}

	static findByAttributes(attributes: {[key: string]: any})
	{
		if(typeof attributes != "object" || Array.isArray(attributes))
			throw new Error('Attributes have to be strict object!');

		return this.find({
			conditions: attributes
		});
	}

	static findOne(params: {
		conditions?: ICondition,
		order?: TOrder
	} = {})
	{
		const data = this.find({
			...params,
			limit: [0, 1]
		});

		if(data.length > 0)
			return data[0];
		else
			return null;
	}

	static find(params: {
		conditions?: ICondition,
		limit?: TLimit,
		order?: TOrder
		// @ts-ignore
	} = {}): T[]
	{
		const request = new QueryRequest({
			...params,
			table: this.tableName(),
		});

		return DatabaseDataObject.db.getData(request).map((v) =>
		{
			// @ts-ignore
			const model = <T>(new this());

			model.setAttributes(v);

			return model;
		});
	}

	setAttributes(attributes: {[key: string]: string | number | bigint | boolean | object})
	{
		for(let key in attributes)
		{
			const value = attributes[key];

			if(typeof value === 'function')
				throw new Error(`Attribute value can't be function!`);

			if(this.hasOwnProperty(key))
				this[key] = value;
			else
				throw new Error(`Property "${key}" does not exists!`);
		}
	}
}
