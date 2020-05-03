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

	public isValid()
	{
		return typeof this.table === 'string';
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
	string | string[],
	...any[]
] | [
	'>' | '>=' | '<' | '<=' | '=' | '!=',
	string,
	string | number
] | IConditionParameters;

type IConditionParameters = {[key: string]: any | any[]};
