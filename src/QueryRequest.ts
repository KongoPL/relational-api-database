export class QueryRequest
{
	// public fields: string[] = ['*'];
	public table: string = '';
	public conditions: TCondition = [];
	public limit: TLimit = [];
	public order: TOrder = {};

	public data: TData = [];
	public values: TValues = {};

	protected validationChecks: TValidationChecks = {
		select: {
			table: true,
			conditions: 'optional',
			limit: 'optional',
			order: 'optional',
			data: false,
			values: false,
		},
		insert: {
			table: true,
			conditions: false,
			limit: false,
			order: false,
			data: true,
			values: false,
		},
		update: {
			table: true,
			conditions: 'optional',
			limit: 'optional',
			order: false,
			data: false,
			values: true,
		},
		delete: {
			table: true,
			conditions: 'optional',
			limit: 'optional',
			order: false,
			data: false,
			values: false,
		},
		any: {
			table: true,
			conditions: 'optional',
			limit: 'optional',
			order: 'optional',
			data: 'optional',
			values: 'optional',
		}
	};

	constructor(params?: {
		table?: string,
		conditions?: TCondition,
		limit?: TLimit,
		order?: TOrder,
		data?: TData,
		values?: TValues
	})
	{
		for(let key in params)
			if(this.hasOwnProperty(key))
				this[key] = params[key];
	}

	public validate(queryType?: TQueryType): true | string
	{
		// @ts-ignore type "any" exists, but it cant't see it, even when defined properly.
		const checkedValues = queryType ? this.validationChecks[queryType] : this.validationChecks.any;

		if(checkedValues.table)
		{
			if(typeof this.table != 'string')
				return 'Table parameter is not string!';

			if(checkedValues.table === true && this.table === '')
				return 'Table name is empty!';
		}

		if(checkedValues.conditions)
		{
			if(typeof this.conditions !== 'object')
				return 'Conditions parameter is not an object!';

			if(this.hasConditions())
			{
				const isValidCondition = this.checkCondition(this.conditions);

				if(isValidCondition !== true)
					return isValidCondition;
			}
			else if(checkedValues.conditions === true)
				return 'Conditions parameter is required!';
		}

		if(checkedValues.limit)
		{
			if(this.hasLimit())
			{
				const isValidLimit = this.checkLimit();

				if(isValidLimit !== true)
					return isValidLimit;
			}
			else if(checkedValues.conditions === true)
				return 'Limit parameter is required!';
		}

		if(checkedValues.order)
		{
			if(this.hasOrder())
			{
				const isValidOrder = this.checkOrder();

				if(isValidOrder !== true)
					return isValidOrder;
			}
			else if(checkedValues.order === true)
				return 'Order parameter is required!';
		}

		if(checkedValues.data)
		{
			if(this.hasData())
			{
				const isValidData = this.checkData();

				if(isValidData !== true)
					return isValidData;
			} else if(checkedValues.data === true)
				return 'Data parameter is required!';
		}

		if(checkedValues.values)
		{
			if(this.hasValues())
			{
				const isValidData = this.checkValues();

				if(isValidData !== true)
					return isValidData;
			}
			else if(checkedValues.values === true)
				return 'Values parameter is required!';
		}

		return true;
	}

	public hasConditions()
	{
		return (typeof this.conditions === 'object' && Array.isArray(this.conditions) && this.conditions.length > 0
			|| typeof this.conditions === 'object' && !Array.isArray(this.conditions));
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
			const validation = this.checkObjectOfValues(condition);

			if(validation !== true)
				return validation;
		}

		return true;
	}

	protected checkObjectOfValues(object: any): true | string
	{
		for(let field in object)
		{
			const value = object[field];

			if(typeof value === 'object' && !Array.isArray(value) && value !== null)
				return `Value can't be an object!`;

			if(['undefined', 'symbol', 'function'].some((v) => v == typeof value))
				return `Value can't be ${typeof value}!`;

			if(Array.isArray(value))
				for(let subvalue of value)
					   if(['undefined', 'symbol', 'function'].some((v) => v == typeof subvalue))
						return `Subvalue can't be ${typeof value}!`;
		}

		return true;
	}

	 public hasLimit()
	 {
	 	return Array.isArray(this.limit) && this.limit.length > 0;
	 }


	 public checkLimit(): true | string
	 {
	 	if(this.limit.length > 2)
	 		return 'Limit accepts maximally 2 values!';

	 	for(let key in this.limit)
		{
			const value = <string | number>this.limit[key];

			if(!isNumeric(value, false))
				return `${key == '0' && this.limit.length == 2 ? 'Offset' : 'Amount'} value should be rounded number!`;

			if(Math.sign(parseInt(value+'')) === -1)
				return `${key == '0' && this.limit.length == 2 ? 'Offset' : 'Amount'} value should be positive number!`;
		}

	 	return true;
	 }


	 public hasOrder()
	 {
	 	return Object.keys(this.order).length > 0;
	 }


	 public checkOrder(): true | string
	 {
	 	for(let column in this.order)
		{
			const direction = this.order[column];

			if([EOrderType.asc, EOrderType.desc, 'asc', 'desc'].some((v) => v === direction) === false)
				return 'Order column value have to be one of these: "asc", "desc" or EOrderType value!';
		}

	 	return true;
	 }


	 public hasData(): boolean
	 {
	 	return (Array.isArray(this.data) && this.data.length > 0);
	 }


	 public checkData(): true | string
	 {
		for(let row of this.data)
		{
			if(typeof row !== "object" || Array.isArray(row) || row === null)
				return 'Row can be only strict object!';

			for(let key in row)
			{
				if(typeof row[key] === 'function')
					return `Value in row can't be a function!`;
			}
		}

		return true;
	 }


	 public hasValues(): boolean
	 {
	 	return (typeof this.values === "object" && Object.getOwnPropertyNames(this.values).length > 0);
	 }


	 public checkValues(): true | string
	 {
		 for(let field in this.values)
		 {
			 const value = this.values[field];

			 if(['undefined', 'symbol', 'function'].some((v) => v == typeof value))
				 return `Value can't be ${typeof value}!`
		 }

		 return true;
	 }
}

export enum EOrderType
{
	asc = 'asc',
	desc = 'desc',
}

export type TCondition = [
	'and' | 'or' | 'not' | 'or not',
	...(TConditionParameters | TCondition)[]
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
] | TConditionParameters;

type TQueryType = 'select' | 'update' | 'delete' | 'insert';
type TConditionParameters = {[key: string]: string | number | boolean | bigint | string[] | number[] | boolean[] | bigint[]} | {};
type TValues = {[key: string]: string | number | boolean | bigint} | {};
type TValidationChecks = {
	[key in (TQueryType & 'any')]: {
		table: boolean | 'optional',
		conditions: boolean | 'optional',
		limit: boolean | 'optional',
		order: boolean | 'optional',
		data: boolean | 'optional',
		values: boolean | 'optional',
	}
};

export type TLimit = [(number|string)?, (number|string)?];
export type TOrder = {[key:string]: EOrderType | 'asc' | 'desc'};
export type TData = {[key: string]: any}[];

function isNumeric(v, allowFloatValue = true)
{
	return ['string', 'number'].some((v2) => v2 === typeof v)
		&& (
			allowFloatValue && /^[0-9]+(\.[0-9]+|)$/.test(v+'')
			|| !allowFloatValue && /^[0-9]+$/.test(v+'')
		);
}
