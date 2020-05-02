import DatabaseApi from "../DatabaseApi";
import QueryRequest, {ICondition} from "../QueryRequest";

export default class MemoryApi extends DatabaseApi
{
	private data: any;

	loadDatabase(data: any)
	{
		this.data = data;
	}


	getData(query: QueryRequest)
	{
		const data = JSON.parse(JSON .stringify(this.getTable(query.table)));

		if(!data)
			throw new Error(`Table ${query.table} does not exists!`);

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
				let isBetween = min <= record[field] && record[field] <= max;

				return (operator === 'between' && isBetween
					|| operator === 'not between' && !isBetween);
			}
			else if(['in', 'not in'].some((v) => v === operator))
			{
				let fields = (Array.isArray(condition[1]) ? condition[1] : [condition[1]]),
					values = (typeof condition[2] === "object" ? condition[2] : {[<string>condition[1]]: condition[2]});

				for (let field of fields)
				{
					if(field in values === false)
						throw new Error(`There are no values for field ${field}!`);

					if(values[field].some(record[field]))
						return (operator === 'in');
				}

				return (operator !== 'in');
			}
			else if(['like', 'or like', 'not like', 'or not like'].some((v) => v === operator))
			{
				let field = <string>condition[1],
					values = (Array.isArray(condition[2]) ? condition[2] : [condition[2]]);

				for (let value of values)
				{
					const valueRegex = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
						.replace(/%/g, '.*')
						.replace(/_/g, '.');

					const matchesCondition = new RegExp(`/^${valueRegex}$/`).test(record[field]);

					if(matchesCondition && ['or like', 'or not like'].some((v) => v == operator))
						return (operator == 'or like');
					else if(!matchesCondition && ['like', 'not like'].some((v) => v == operator))
						return (operator == 'not like');
				}

				return ['like', 'not like'].some((v) => v == operator);
			}
			else if(['>', '>=', '<', '<=', '=', '!='].some((v) => v === operator))
			{
				let field = <string>condition[1];

				return eval(`record[field] ${operator} condition[2]`);
			}
			else
				throw new Error(`Unknown operator: ${operator}`);
		}
		else
		{
			for (let field in condition)
			{
				const values = Array.isArray(condition[field]) ? condition[field] : [condition[field]];

				for(let value of values)
				{
					if(record[field] == value)
						return true;
				}

				return false;
			}
		}

		return true;
	}


	private doesRecordMeetsConditionsByParameters(record: any, conditions: ICondition): boolean
	{
		if(typeof conditions === "object" && Array.isArray(conditions))
			throw new Error(`Conditions should be an object!`);

		// Simple parameters check:
		for(let key in conditions)
		{
			if(key in record === false)
				throw new Error(`Field ${key} does not exists in record!`);

			const conditionValue = conditions[key];

			if(Array.isArray(conditionValue) && conditionValue.every((v) => record[key] == v) === false
				|| !Array.isArray(conditionValue) && record[key] != conditionValue)
				return false;
		}


		return true;
	}
}
