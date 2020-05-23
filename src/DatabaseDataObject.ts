import Database from "./Database";
import QueryRequest, {ICondition, TLimit, TOrder} from "./QueryRequest";
import City from "./tests/data-types/City";

export default abstract class DatabaseDataObject<ModelClass>
{
	static db;

	private obtainedRelations: string[] = [];

	static injectDatabase(db: Database)
	{
		DatabaseDataObject.db = db;
	}

	static tableName(): string
	{
		throw new Error('Table name is not given!');
	}

	constructor()
	{
		this.init();
	}

	public init()
	{
		this.fetchEagerRelations();
	}

	private fetchEagerRelations(): Promise<any>
	{
		const relations = this.relations(),
			relationsPromises: Promise<any>[] = [];

		for(let name in relations)
		{
			const relation = relations[name];

			if(relation.loading === ERelationLoadingType.EAGER)
				relationsPromises.push(this.getRelation(name));
		}

		return Promise.all(relationsPromises);
	}

	protected relations(): TRelation
	{
		return {};
	}

	public getRelation(name: string, refresh: boolean = false): Promise<any>
	{
		const relations = this.relations();

		if(name in relations === false)
			throw new Error(`Relation "${name}" does not exists in model!`);

		const relation = relations[name];

		return new Promise((resolve, reject) => {
			try
			{
				let data;

				if(this.hasOwnProperty(name) && this.obtainedRelations.includes(name) && !refresh)
				{
					resolve(this[name]);

					return;
				}

				switch (relation.type)
				{
					case ERelationType.ONE_ONE:
					case ERelationType.ONE_MANY:
						const attributes = {};

						for (let key in relation.relation)
						{
							const destinationKey = relation.relation[key];

							attributes[destinationKey] = this[key];
						}

						if(relation.type === ERelationType.ONE_ONE)
							data = relation.model.findOneByAttributes(attributes);
						else
							data = relation.model.findByAttributes(attributes);
						break;

					case ERelationType.MANY_MANY:
						throw new Error('Not yet implemented!');
						break;
				}

				if(this.hasOwnProperty(name))
					this[name] = data;

				resolve(data);
			}
			catch(e)
			{
				reject(e);
			}
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


	static findById(id: string | number)
	{
		return this.findOneByAttributes({id});
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
	} = {}): ModelClass[]
	{
		const request = new QueryRequest({
			...params,
			table: this.tableName(),
		});

		return DatabaseDataObject.db.getData(request).map((v) =>
		{
			// @ts-ignore
			const model = <ModelClass>(new this());

			model.setAttributes(v);

			return model;
		});
	}
}

export type TRelation = {[key: string]: IRelation};

/**
 * @param junctionModel	Model class or table name
 * @param loading		Relation loading type (eager or lazy). default: lazy
 */
export interface IRelation {
	type: ERelationType | number,
	model: typeof DatabaseDataObject,
	relation: {[key: string]: string},
	junctionModel?: typeof DatabaseDataObject | 'string',
	loading?: ERelationLoadingType | 'lazy' | 'eager'
}

export enum ERelationType {
	ONE_ONE = 0,
	ONE_MANY = 1,
	MANY_MANY = 2,
}

export enum ERelationLoadingType
{
	LAZY = 'lazy',
	EAGER = 'eager'
}
