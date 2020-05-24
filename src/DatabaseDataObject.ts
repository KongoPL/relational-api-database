import {Database} from "./Database";
import {QueryRequest, ICondition, TLimit, TOrder} from "./QueryRequest";

export abstract class DatabaseDataObject<ModelClass>
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

	public async getRelation(name: string, refresh: boolean = false): Promise<any>
	{
		const relations = this.relations();

		if(name in relations === false)
			throw new Error(`Relation "${name}" does not exists in model!`);

		const relation = relations[name];
		let data;

		if(this.hasOwnProperty(name) && this.obtainedRelations.includes(name) && !refresh)
			return this[name];

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
					data = await relation.model.findOneByAttributes(attributes);
				else
					data = await relation.model.findByAttributes(attributes);
				break;

			case ERelationType.MANY_MANY:
				throw new Error('Not yet implemented!');
				break;
		}

		if(this.hasOwnProperty(name))
			this[name] = data;

		return data;
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


	static async findById(id: string | number)
	{
		return this.findOneByAttributes({id});
	}


	static async findOneByAttributes(attributes: {[key: string]: any})
	{
		if(typeof attributes != "object" || Array.isArray(attributes))
			throw new Error('Attributes have to be strict object!');

		return this.findOne({
			conditions: attributes
		});
	}


	static async findByAttributes(attributes: {[key: string]: any})
	{
		if(typeof attributes != "object" || Array.isArray(attributes))
			throw new Error('Attributes have to be strict object!');

		return this.find({
			conditions: attributes
		});
	}


	static async findOne(params: {
		conditions?: ICondition,
		order?: TOrder
		// @ts-ignore
	} = {}): Promise<ModelClass>
	{
		return this.find({
			...params,
			limit: [0, 1]
		}).then(data => data.length > 0 ? data[0] : null);
	}


	static async find(params: {
		conditions?: ICondition,
		limit?: TLimit,
		order?: TOrder
		// @ts-ignore
	} = {}): Promise<ModelClass[]>
	{
		const request = new QueryRequest({
			...params,
			table: this.tableName(),
		});

		return DatabaseDataObject.db.getData(request)
			.then((data) => data.map((v) =>
			{
				// @ts-ignore
				const model = <ModelClass>(new this());

				model.setAttributes(v);

				return model;
			}));
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
