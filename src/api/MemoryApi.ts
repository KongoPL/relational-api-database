import {DatabaseApi} from "../DatabaseApi";
import {QueryRequest, EOrderType, TCondition, TLimit, TOrder} from "../QueryRequest";

/**
 * Basic API, where data is stored in memory (RAM)
 * @class
 */
export class MemoryApi extends DatabaseApi
{
	/**
	 * @private
	 * @property {TMemoryApiDatabaseInternal}	Main database object
	 */
	private data: TMemoryApiDatabaseInternal = {};

	/**
	 * @private
	 * @property {object}	List of columns to which Auto Increment is assigned. Key is table name, value is column name
	 */
	private idColumns: {[key: string]: string} = {};

	/**
	 * @private
	 * @property {object}	Stores current auto increment values for tables. Key is table name, value is number or false if there is no AI
	 */
	private tablesAutoIncrements: {[key: string]: number | false} = {};


	/**
	 * @constructor
	 * @param {TMemoryApiDatabase} data	Database in external format
	 */
	constructor(data?: TMemoryApiDatabase)
	{
		super();

		if(typeof data === "object")
			this.loadDatabase(data);
	}


	/**
	 * @param {TMemoryApiDatabase} data	Database in external format
	 */
	public loadDatabase(data: TMemoryApiDatabase)
	{
		const dataCopy = JSON.parse(JSON.stringify(data));
		let meta = {};

		if('_meta' in dataCopy)
		{
			meta = JSON.parse(JSON.stringify(dataCopy._meta));

			delete dataCopy._meta;
		}

		this.loadData(dataCopy);
		this.loadMeta(meta);
		this.obtainAutoIncrementsForTables();
	}


	/**
	 * @private
	 * @param {object} data Database data, where key is table name, value is array of rows
	 */
	private loadData(data: any)
	{
		if(typeof data === 'object' && Array.isArray(data))
			throw new Error('Database have to be strict object!');

		for(let tableName in data)
		{
			if(data[tableName] instanceof Array === false)
				throw new Error('Value for table have to be an array!');

			for(let key in data[tableName])
			{
				const row = data[tableName][key];

				if(typeof row === 'object' && Array.isArray(row))
					throw new Error('Row have to be strict object!');

				if('_key' in row)
					throw new Error('"_key" field is reserved for MemoryAPI!');

				data[tableName][key] = this.prepareRecord(tableName, row);
			}
		}

		this.data = data;
	}


	/**
	 * @private
	 * @param {string} tableName
	 * @param {TRow} record
	 * @return {TRow}
	 */
	private prepareRecord(tableName: string, record: TRow): TRow
	{
		if(!('_key' in record) || typeof record._key != 'string' || record._key == '')
			record._key = `${tableName}.${this.generateRandomHash(12)}`;

		return record;
	}


	/**
	 * @private
	 * @param {number} length
	 * @param {string[]} chars
	 * @return {string}
	 */
	private generateRandomHash(length: number, chars = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890'): string
	{
		let hash = '';

		for(let i = 0; i < length; i++)
		{
			const key = Math.round(Math.random() * (chars.length - 1));

			hash += chars[key];
		}

		return hash;
	}


	/**
	 * @param {TMetaData} metaData
	 */
	private loadMeta(metaData: TMetaData)
	{
		if(typeof metaData.idColumns !== 'undefined')
			this.setIdColumn(metaData.idColumns);
	}


	/**
	 * @return {boolean}
	 */
	public hasLoadedDatabase(): boolean
	{
		return Object.keys(this.data).length > 0;
	}


	/**
	 * @return {TMemoryApiDatabase}
	 */
	public getDatabase(): TMemoryApiDatabase
	{
		const dataCopy = JSON.parse(JSON.stringify(this.data));

		for(let tableName in dataCopy)
		{
			for(let row of dataCopy[tableName])
				delete row._key;
		}

		return {
			_meta: {
				idColumns: JSON.parse(JSON.stringify(this.idColumns))
			},
			...dataCopy
		};
	}


	/**
	 * @param {TIdColumns} idColumn
	 */
	public setIdColumn(idColumn: TIdColumns)
	{
		if(idColumn === false)
			return;

		if(typeof idColumn == 'string')
			for(let tableName in this.data)
				this.idColumns[tableName] = idColumn;
		else if(typeof idColumn === 'object')
			this.idColumns = JSON.parse(JSON.stringify(idColumn));
		else
			throw new Error('Invalid format for ID column!');
	}


	/**
	 * @private
	 */
	private obtainAutoIncrementsForTables()
	{
		this.tablesAutoIncrements = {};

		for(let tableName in this.data)
		{
			const idColumn = this.getTableIdColumn(tableName);

			if(!idColumn)
				continue;

			const ids = this.data[tableName].map((row) => row[idColumn]);
			const maxId = Math.max(...ids);

			if(Number.isFinite(maxId))
				this.tablesAutoIncrements[tableName] = maxId + 1;
			else if(ids.some((v) => typeof v === 'number'))
				throw new Error(`At least one record in table "${tableName}" doesn't have ID Column "${idColumn}" or it's value isn't number!`);
			else
				this.tablesAutoIncrements[tableName] = false;
		}
	}


	/**
	 * @private
	 * @param {string} tableName
	 * @return {string|boolean} ID column if exists, false otherwise
	 */
	private getTableIdColumn(tableName: string): string | false
	{
		if(tableName in this.idColumns)
			return this.idColumns[tableName];
		else
			return false;
	}


	/**
	 * @async
	 * @param {QueryRequest} query
	 * @return {Promise<TRow[]>}
	 */
	async getData(query: QueryRequest): Promise<TRow[]>
	{
		return JSON.parse(JSON.stringify(await this.getDataInternal(query)));
	}


	/**
	 * @protected
	 * @async
	 * @param {QueryRequest} query
	 * @return {Promise<TRow[]>}
	 */
	protected async getDataInternal(query: QueryRequest): Promise<TRow[]>
	{
		let data = this.getTable(query.table);

		if(query.hasConditions())
			data = data.filter((r) => this.doesRecordMeetsConditions(r, query.conditions));

		if(query.hasOrder())
			data = this.orderData(data, query.order);

		if(query.hasLimit())
			data = this.limitData(data, query.limit);

		return data;
	}


	/**
	 * @param {QueryRequest} query
	 * @return {Promise<object[]>} Array of objects with properties to set for those objects.
	 */
	async insertData(query: QueryRequest): Promise<({_key: string | number, [key: string]: any})[]>
	{
		const table = this.getTable(query.table);
		let data: any[] = JSON.parse(JSON.stringify(query.data));
		let autoIncrements = this.assignAutoIncrementValuesForRecords(query.table, data),
			aiColumn = this.getTableIdColumn(query.table)+'';

		data = <any[]>data.map(this.prepareRecord.bind(this, query.table));
		table.push(...data);

		return data.map((row: TRow, i: number) => {
			const responseRow = {
				_key: row._key
			};

			if(autoIncrements)
				responseRow[aiColumn] = autoIncrements[i];

			return responseRow;
		});
	}


	private assignAutoIncrementValuesForRecords(tableName: string, data: TRow[]): number[] | any
	{
		const idColumn = this.getTableIdColumn(tableName),
			autoIncrements = this.getAutoIncrementForTable(tableName, data.length);

		if(!idColumn || !autoIncrements)
			return;

		for(let i = 0; i < data.length; i++)
			data[i][idColumn] = autoIncrements[i];

		return autoIncrements;
	}


	private getAutoIncrementForTable(tableName: string, amount: number = 1): number[] | false
	{
		if(tableName in this.tablesAutoIncrements === false
			|| this.tablesAutoIncrements[tableName] === false)
			return false;

		const autoIncrements: number[] = [];

		for(let i = 0; i < amount; i++)
			autoIncrements.push((<number>this.tablesAutoIncrements[tableName])++);

		return autoIncrements;
	}


	public async updateData(query: QueryRequest): Promise<any>
	{
		const data = await this.getDataInternal(query),
			values = JSON.parse(JSON.stringify(query.values));

		for(let row of data)
		{
			for(let key in values)
			{
				if(key in row === false)
					throw new Error(`Field "${key}" does not exists in record!`);

				row[key] = values[key];
			}
		}
	}


	public async deleteData(query: QueryRequest): Promise<any>
	{
		const data = await this.getDataInternal(query);
		const recordsKey = data.map((v) => v._key);

		this.data[query.table] = this.data[query.table].filter((r) => recordsKey.indexOf(r._key) === -1);
	}


	private getTable(tableName: string): TRow[]
	{
		if(this.hasTable(tableName))
			return this.data[tableName];
		else
			throw new Error(`Table ${tableName} does not exists!`);
	}


	private hasTable(tableName: string): boolean
	{
		return tableName in this.data;
	}


	/**
	 * @see https://www.yiiframework.com/doc/api/2.0/yii-db-queryinterface#where()-detail To know more about "condition" property
	 */
	protected doesRecordMeetsConditions(record: any, condition: TCondition): boolean
	{
		if(Array.isArray(condition))
		{
			const operator = condition[0].toLowerCase();

			if(['and', 'or', 'not', 'or not'].some((v) => v === operator))
			{
				for (let i = 1; i < condition.length; i++)
				{
					let meetConditions = this.doesRecordMeetsConditions(record, <TCondition>condition[i]);

					if(meetConditions && ['or', 'or not', 'not'].some((v) => v === operator))
						return operator === 'or';
					else if(!meetConditions && operator === 'and')
						return false;
				}

				return (operator != 'or');
			}
			else if(['between', 'not between'].some((v) => v === operator))
			{
				let field = <string>condition[1],
					min = condition[2],
					max = condition[3];

				if(field in record === false)
					throw new Error(`Field "${field}" does not exists in record!`);

				let isBetween = min <= record[field] && record[field] <= max;

				return (operator === 'between' && isBetween
					|| operator === 'not between' && !isBetween);
			}
			else if(['like', 'or like', 'not like', 'or not like'].some((v) => v === operator))
			{
				let field = <string>condition[1],
					values = (Array.isArray(condition[2]) ? condition[2] : [condition[2]]);

				if(field in record === false)
					throw new Error(`Field "${field}" does not exists in record!`);

				for (let value of values)
				{
					const valueRegex = value.replace(/[*+?^${}()|[\]\\]/g, '\\$&')
						.replace(/%/g, '.*')
						.replace(/_/g, '.');

					const matchesCondition = new RegExp(`^${valueRegex}$`).test(record[field]);

					if(matchesCondition && ['or like', 'or not like', 'not like'].some((v) => v == operator))
						return (operator == 'or like');
					else if(!matchesCondition && ['like'].some((v) => v == operator))
						return false;
				}

				return operator != 'or like';
			}
			else if(['>', '>=', '<', '<=', '=', '!='].some((v) => v === operator))
			{
				let field = <string>condition[1];

				if(field in record === false)
					throw new Error(`Field "${field}" does not exists in record!`);

				return eval(`record[field] ${operator} condition[2]`);
			}
			else
				throw new Error(`Unknown operator: ${operator}`);
		}
		else
		{
			let meetsConditions = true;

			for(let field in condition)
			{
				if(field in record === false)
					throw new Error(`Field "${field}" does not exists in record!`);

				const values = Array.isArray(condition[field]) ? condition[field] : [condition[field]];

				meetsConditions = values.some((v) => v == record[field]);
				
				if(!meetsConditions)
					break;
			}

			return meetsConditions;
		}
	}


	private limitData(data: any[], limit: TLimit): any[]
	{
		let startKey = 0,
			endKey = 0;

		if(limit.length == 1)
			endKey = parseInt(limit[0]+'');
		else if(limit.length == 2)
		{
			startKey = parseInt(limit[0] + '');
			endKey = startKey + parseInt(limit[1] + '');
		}

		return data.slice(startKey, endKey);
	}


	private orderData(data: any[], order: TOrder): any[]
	{
		return data.sort( ( a: any, b: any ) =>
		{
			for( let field in order )
			{
				if(field in a === false || field in b === false)
					throw new Error(`Field "${field}" does not exists in record!`);

				let direction = order[field];

				if ( a[field] > b[field] )
					return ( direction == EOrderType.asc ? 1 : -1 );

				if ( a[field] < b[field] )
					return ( direction == EOrderType.asc ? -1 : 1 );
			}

			return 0;
		});
	}
}


export type TMemoryApiDatabase = {
	[key: string]: {
		[key: string]: any,
	} | TMetaData
}

export type TMemoryApiDatabaseInternal = {
	[key: string]: TRow[]
}

export type TRow = {
	_key: string | number,
	[key: string]: any,
}

export type TIdColumns = string | false | {[key: string]: string};

export type TMetaData = {
	idColumns?: TIdColumns
}
