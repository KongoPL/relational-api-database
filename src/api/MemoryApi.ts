import {DatabaseApi} from "../DatabaseApi";
import {QueryRequest, EOrderType, TCondition, TLimit, TOrder} from "../QueryRequest";

export class MemoryApi extends DatabaseApi
{
	private data: any;
	private idColumns: {[key: string]: string} = {};
	private tablesAutoIncrements: {[key: string]: number | false} = {};

	constructor(data?: TMemoryApiDatabase)
	{
		super();

		if(typeof data === "object")
			this.loadDatabase(data);
	}


	public loadDatabase(data: TMemoryApiDatabase)
	{
		const dataCopy = JSON.parse(JSON.stringify(data));
		let meta = {};

		if('_meta' in dataCopy)
		{
			meta = JSON.parse(JSON.stringify(dataCopy._meta));

			delete dataCopy._meta;
		}

		this.data = dataCopy;

		this.loadMeta(meta);
		this.obtainAutoIncrementsForTables();
	}


	public getDatabase(): {_meta: TMetaData} & {[key: string]: any[]}
	{
		return {
			_meta: {
				idColumns: JSON.parse(JSON.stringify(this.idColumns))
			},
			...JSON.parse(JSON.stringify(this.data))
		};
	}


	private loadMeta(metaData: TMetaData)
	{
		if(typeof metaData.idColumns !== 'undefined')
			this.setIdColumn(metaData.idColumns);
	}


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

	private getTableIdColumn(tableName: string): string | false
	{
		if(tableName in this.idColumns)
			return this.idColumns[tableName];
		else
			return false;
	}


	async getData(query: QueryRequest): Promise<any[]>
	{
		const isQueryValid = query.validate();

		if(isQueryValid !== true)
			throw new Error(`Query is not valid! Reason: ${isQueryValid}`);

		let data = this.getTable(query.table);

		if(query.hasConditions())
			data = data.filter((r) => this.doesRecordMeetsConditions(r, query.conditions));

		if(query.hasOrder())
			data = this.orderData(data, query.order);

		if(query.hasLimit())
			data = this.limitData(data, query.limit);


		return JSON.parse(JSON.stringify(data));
	}


	async insertData(query: QueryRequest): Promise<(string | number)[] | any>
	{
		const isQueryValid = query.validate();

		if(isQueryValid !== true)
			throw new Error(`Query is not valid! Reason: ${isQueryValid}`);

		const table = this.getTable(query.table),
			data: any[] = JSON.parse(JSON.stringify(query.data));
		let returnedData;

		// Auto increment assignment:
		const idColumn = this.getTableIdColumn(query.table);

		if(idColumn)
		{
			const autoIncrements = this.getAutoIncrementForTable(query.table, data.length);

			if(autoIncrements)
			{
				for(let i = 0; i < data.length; i++)
					data[i][idColumn] = autoIncrements[i];

				returnedData = autoIncrements;
			}
		}

		table.push(...data);

		return returnedData;
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


	private getTable(tableName: string)
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
	 * @see https://www.yiiframework.com/doc/api/2.0/yii-db-queryinterface#where()-detail
	 */
	private doesRecordMeetsConditions( record: any, condition: TCondition ): boolean
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
			for (let field in condition)
			{
				if(field in record === false)
					throw new Error(`Field "${field}" does not exists in record!`);

				const values = Array.isArray(condition[field]) ? condition[field] : [condition[field]];

				return values.some((v) => v == record[field]);
			}
		}


		return false;
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
	_meta?: TMetaData,
	[key: string]: any[] | TMetaData | undefined
}

type TIdColumns = string | false | {[key: string]: string};
export type TMetaData = {
	idColumns?: TIdColumns
}
