import {Database} from "./Database";
import {QueryRequest, TCondition, TLimit, TOrder, TQueryRequestProperties} from "./QueryRequest";

export abstract class DatabaseDataObject<ModelClass>
{
	private obtainedRelations: string[] = [];

	protected static db: Database;

	public _key: string = '';
	public isNewRecord: boolean = true;


	static injectDatabase(db: Database)
	{
		DatabaseDataObject.db = db;
	}


	static tableName(): string
	{
		throw new Error('Table name is not given!');
	}


	public async init(isNewRecord: boolean)
	{
		this.isNewRecord = isNewRecord;

		await this.fetchEagerRelations();
	}


	private async fetchEagerRelations(): Promise<any>
	{
		const relations = this.relations();

		for(let name in relations)
		{
			const relation = relations[name];

			if(relation.loading === ERelationLoadingType.EAGER)
				await this.getRelation(name);
		}

		return;
	}


	protected relations(): TRelations
	{
		return {};
	}


	protected unwantedAttributes(): string[]
	{
		return [
			'db',
			'obtainedRelations',
			'isNewRecord'
		];
	}


	getAttributes(includeUnwanted: boolean = false): {[key: string]: any}
	{
		const attributes = Object.getOwnPropertyDescriptors(this),
			modelAttributes = {},
			unwantedAttributes = this.unwantedAttributes();

		for(let attribute in attributes)
			if((includeUnwanted || !includeUnwanted && !unwantedAttributes.includes(attribute)) // Unwanted attributes check
				&& typeof attributes[attribute].value !== 'function') // Jest Mocking check
				modelAttributes[attribute] = attributes[attribute].value;

		return modelAttributes;
	}


	getAttribute(name: string)
	{
		if(!this.hasAttribute(name))
			throw new Error(`Attribute "${name}" does not exists in model!`);

		return Object.getOwnPropertyDescriptor(this, name)?.value;
	}


	hasAttribute(name: string): boolean
	{
		return this.hasOwnProperty(name) && !this.unwantedAttributes().includes(name);
	}


	setAttributes(attributes: {[key: string]: string | number | bigint | boolean | object}, safe: boolean = true)
	{
		for(let key in attributes)
			this.setAttribute(key, attributes[key], safe);
	}


	setAttribute(name: string, value: string | number | bigint | boolean | object, safe: boolean = true)
	{
		if(typeof value === 'function')
			throw new Error(`Attribute value can't be function!`);

		if(this.hasAttribute(name) || !safe)
			this[name] = value;
		else
			throw new Error(`Attribute "${name}" does not exists in model!`);
	}


	async getRelation(name: string, refresh: boolean = false): Promise<any>
	{
		const relations = this.relations();

		if(name in relations === false)
			throw new Error(`Relation "${name}" does not exists in model!`);

		const relation = relations[name];
		let data;

		if(this.hasRelation(name) && !refresh)
			return this[name];

		switch (relation.type)
		{
			case ERelationType.ONE_ONE:
			case ERelationType.ONE_MANY:
				data = await this.fetchOneToRelation(relation)
				break;

			case ERelationType.MANY_MANY:
				data = await this.fetchManyToManyRelation(relation);

				break;
		}

		if(this.hasRelation(name, false))
			this[name] = data;

		if(!this.obtainedRelations.includes(name))
			this.obtainedRelations.push(name);

		return data;
	}


	protected async fetchOneToRelation(relation: TRelation)
	{
		const attributes = {};

		for (let key in relation.relation)
		{
			const destinationKey = relation.relation[key];

			attributes[destinationKey] = this[key];
		}

		if(relation.type === ERelationType.ONE_ONE)
			return await relation.model.findOneByAttributes(attributes);
		else
			return await relation.model.findByAttributes(attributes);
	}


	protected async fetchManyToManyRelation(relation: TRelation)
	{
		if(typeof relation.junctionModel === 'undefined' || typeof relation.junctionModel != 'string' || <any>relation.junctionModel instanceof DatabaseDataObject)
			throw new Error('Many-to-Many relation requires "junctionModel" parameter to be string or DatabaseDataObject class!');

		let leftRelation: [string, string] = ['', ''],
			rightRelation: [string, string] = ['', ''],
			hasMoreRelations = false;

		// {my: their, their2: destination}
		for(let key in relation.relation)
		{
			const destinationKey = relation.relation[key];

			if(leftRelation[0] === '')
				leftRelation = [key, destinationKey];
			else if(rightRelation[0] === '')
				rightRelation = [key, destinationKey];
			else
				hasMoreRelations = true;
		}

		if(hasMoreRelations || leftRelation[0] === '' || rightRelation[0] === '')
			throw new Error(`Many-to-Many relation requires exactly 2 relations!`);

		// Get junction table records:
		const junctionTableName = typeof relation.junctionModel === 'string' ? relation.junctionModel : (<typeof DatabaseDataObject>relation.junctionModel).tableName(),
			leftTableColumn = leftRelation[0],
			middleTableLeftColumn = leftRelation[1],
			middleTableRightColumn = rightRelation[0],
			rightTableColumn = rightRelation[1];

		const junctionData = await DatabaseDataObject.db.getData(new QueryRequest({
			table: junctionTableName,
			conditions: {
				[middleTableLeftColumn]: this[leftTableColumn]
			}
		}));


		return await relation.model.findByAttributes({
			[rightTableColumn]: junctionData.map((row) => row[middleTableRightColumn])
		});
	}


	public hasRelation(name: string, obtained: boolean = true)
	{
		return this.hasOwnProperty(name) && (obtained && this.obtainedRelations.includes(name) || !obtained);
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
		conditions?: TCondition,
		order?: TOrder
		// @ts-ignore
	} = {}): Promise<ModelClass>
	{
		return this.find({
			...params,
			limit: [0, 1]
		}).then(data => data.length > 0 ? data[0] : null);
	}

	// @ts-ignore
	static async find(params: TQueryRequestProperties): Promise<ModelClass[]>
	{
		const request = new QueryRequest({
			...params,
			table: this.tableName(),
		});
		const models = (await DatabaseDataObject.db.getData(request))
			.map((v) => {
				// @ts-ignore
				const model = <ModelClass>(new this());

				model.setAttributes(v);

				return model;
			});
		const initPromises = models.map(v => v.init(false));

		await Promise.all(initPromises);


		return models;
	}


	public update(): Promise<any>
	{
		return DatabaseDataObject.db.updateData(new QueryRequest({
			// @ts-ignore
			table: this.constructor.tableName(),
			values: this.getAttributes(),
			conditions: {
				_key: this._key
			}
		}));
	}


	public insert()
	{
		return DatabaseDataObject.db.insertData(new QueryRequest({
			// @ts-ignore
			table: this.constructor.tableName(),
			data: [
				this.getAttributes()
			],
		})).then((response) => {
			if(response.length > 0)
			{
				const object = response[0];

				for(let key in object)
					this[key] = object[key];
			}
		});
	}


	public save(): Promise<(string | number)[] | any>
	{
		if(this.beforeSave(this.isNewRecord) === false)
			return new Promise((res, rej) => rej());

		let returnPromise;

		if(this.isNewRecord)
			returnPromise = this.insert();
		else
			returnPromise = this.update();

		this.afterSave(returnPromise);


		return returnPromise;
	}


	public delete(): Promise<any>
	{
		return DatabaseDataObject.db.deleteData(new QueryRequest({
			// @ts-ignore
			table: this.constructor.tableName(),
			conditions: {
				_key: this._key,
			},
			limit: [1]
		}));
	}


	public toObject(): {[key: string]: any}
	{
		return JSON.parse(JSON.stringify(this.getAttributes(true)));
	}


	protected beforeSave(isNewRecord: boolean): boolean
	{
		return true;
	}


	protected afterSave(promise: Promise<(string | number)[] | any>): void {}
}


export type TRelations = {[key: string]: TRelation};

/**
 * @param junctionModel	Model class or table name
 * @param loading		Relation loading type (eager or lazy). default: lazy
 */
export type TRelation = {
	type: ERelationType | number,
	model: typeof DatabaseDataObject,
	relation: {[key: string]: string},
	junctionModel?: typeof DatabaseDataObject | string,
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
