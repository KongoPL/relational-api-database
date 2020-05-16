export default class QueryRequest
{
	// public fields: string[] = ['*'];
	public table: string = '';
	public conditions: ICondition = [];
	// public order: IOrder

	constructor(params?: {table?: string, conditions?: ICondition})
	{
		for(let key in params)
			if(this.hasOwnProperty(key))
				this[key] = params[key];
	}

	public validate(): true | string
	{
		if(typeof this.table != 'string')
			return 'Table parameter is not string!';

		if(typeof this.conditions !== 'object')
			return 'Conditions parameter is not an object!';

		if(this.table === '')
			return 'Table name is empty!';

		if(this.hasConditions())
		{
			const isValidCondition = this.checkCondition(this.conditions);

			if(isValidCondition !== true)
				return isValidCondition;
		}

		return true;
	}

	private checkCondition(condition): true | string
	{
		if(typeof condition != 'object')
			return 'Condition is not an object!';

		if(Array.isArray(condition))
		{
			const operator = condition[0];

			if(typeof operator !== 'string')
				return 'Operator is not string!';

			if(['and', 'or', 'not', 'or not'].some(v => v == operator))
			{
				if(condition.length == 1)
					return `"${operator}" operator should have conditions!`;

				for (let i = 1; i < condition.length; i++)
				{
					const isValidCondition = this.checkCondition(condition[i]);

					if(isValidCondition !== true)
						return isValidCondition;
				}
			}
			else
			{
				if(typeof condition[1] !== 'string')
					return 'Field should be string!';

				if(['between', 'not between'].some(v => v == operator))
				{
					const isNumeric = (v) => ['string', 'number'].some((v2) => v2 === typeof v) && /^[0-9]+(\.[0-9]+|)$/.test(v+'');

					if(isNumeric(condition[2]) === false)
						return 'Min value should be numeric!';

					if(isNumeric(condition[3]) === false)
						return 'Max value should be numeric!';

					if(parseFloat(condition[2]) > parseFloat(condition[3]))
						return 'Max value should be greater than min value!';
				}
				else if(['like', 'or like', 'not like', 'or not like'].some(v => v == operator))
				{
					const value = condition[2];

					if(Array.isArray(value))
					{
						for(let subvalue of value)
							if(['string', 'number'].some((v) => v === typeof subvalue) === false)
								return 'Subvalue should be string or number!';
					}
					else if(['string', 'number'].some((v) => v === typeof value) === false)
						return 'Value should be string or number!';
				}
				else if(['>', '>=', '<', '<=', '=', '!='].some(v => v == operator))
				{
					if(['number', 'bigint', 'string', 'boolean'].some((v) => v == typeof condition[2]) == false)
					{
						return 'Value is invalid!';
					}
				}
				else
				{
					return `Unknown operator: "${operator}"!`;
				}
			}
		}
		else
		{
			for(let field in condition)
			{
				const value = condition[field];

				if(typeof value === 'object' && !Array.isArray(value))
					return `Value can't be an object!`;

				if(['undefined', 'symbol', 'function'].some((v) => v == typeof value))
					return `Value can't be ${typeof value}!`;

				if(Array.isArray(value))
					for(let subvalue of value)
						if(['undefined', 'symbol', 'function'].some((v) => v == typeof subvalue))
							return `Subvalue can't be ${typeof value}!`;
			}
		}

		return true;
	}

	 public hasConditions()
	 {
	 	return (typeof this.conditions === 'object' && Array.isArray(this.conditions) && this.conditions.length > 0
		|| typeof this.conditions === 'object' && !Array.isArray(this.conditions));
	 }
}

export type ICondition = [
	'and' | 'or' | 'not' | 'or not',
	...(IConditionParameters | ICondition)[]
] | [
	'between' | 'not between' | 'like' | 'or like' | 'not like' | 'or not like',
	string,
	...any[]
] | [
	'>' | '>=' | '<' | '<=' | '=' | '!=',
	string,
	string | number | boolean | bigint
] | [ // Operators defined by other API's
	string,
	string,
	...any[]
] | IConditionParameters;

// Officially type any is (string | number | boolean | bigint) or array of those types.
// Reason behind this is that type below matches to value "[]" but does not matches to type (string | number | boolean | bigint).
type IConditionParameters = {[key: string]: any};
