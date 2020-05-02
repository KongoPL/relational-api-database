export default class QueryRequest
{
	// public fields: string[] = ['*'];
	public table: string = '';
	public conditions: ICondition = [];
	// public order: IOrder
}

export type ICondition = [
	string,
	...(IConditionParameters | ICondition)[]
] | [
	'between' | 'not between' | 'in' | 'not in' | 'like' | 'or like' | 'not like' | 'or not like',
	string | string[],
	...any[]
] | [
	'>' | '>=' | '<' | '<=' | '=' | '!=',
	string,
	string | number
] | IConditionParameters;

type IConditionParameters = {[key: string]: any | any[]};
