import DatabaseApi from "../DatabaseApi";
import QueryRequest, {EOrderType, ICondition, TLimit, TOrder} from "../QueryRequest";

export default class MemoryApi extends DatabaseApi
{
	private data: any;

	loadDatabase(data: any)
	{
		this.data = data;
	}


	getData(query: QueryRequest)
	{
		const isQueryValid = query.validate();

		if(isQueryValid !== true)
			throw new Error(`Query is not valid! Reason: ${isQueryValid}`);

		let data = JSON.parse(JSON.stringify(this.getTable(query.table)));

		if(!data)
			throw new Error(`Table ${query.table} does not exists!`);

		if(query.hasConditions())
			data = data.filter((r) => this.doesRecordMeetsConditions(r, query.conditions));

		if(query.hasOrder())
			data = this.orderData(data, query.order);

		if(query.hasLimit())
			data = this.limitData(data, query.limit);


		return data;
	}


	private getTable(tableName: string)
	{
		if(tableName in this.data)
			return this.data[tableName];
	}

	/**
	 * @see https://www.yiiframework.com/doc/api/2.0/yii-db-queryinterface#where()-detail
	 */
	private doesRecordMeetsConditions( record: any, condition: ICondition ): boolean
	{
		if(Array.isArray(condition))
		{
			const operator = condition[0].toLowerCase();

			if(['and', 'or', 'not', 'or not'].some((v) => v === operator))
			{
				for (let i = 1; i < condition.length; i++)
				{
					let meetConditions = this.doesRecordMeetsConditions(record, <ICondition>condition[i]);

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
