import {QueryRequest, EOrderType} from "../src/QueryRequest";

function checkFilteringFailing(operators: string[], valueCases: any[], valueCaseIsArrayOfValues = false)
{
	checkFiltering(false, operators, valueCases, valueCaseIsArrayOfValues);
}

function checkFilteringWorking(operators: string[], valueCases: any[], valueCaseIsArrayOfValues = false)
{
	checkFiltering(true, operators, valueCases, valueCaseIsArrayOfValues);
}

function checkFiltering(shouldPass: boolean, operators: string[], valueCases: any[], valueCaseIsArrayOfValues = false)
{
	const request = new QueryRequest({
		table: 'any'
	});

	for (let operator of operators)
	{
		for(let valueCase of valueCases)
		{
			if(valueCaseIsArrayOfValues)
				request.conditions = [
					operator, 'field', ...valueCase
				];
			else
				request.conditions = [
					operator, 'field', valueCase
				];

			const validateValue = request.validate();

			if(shouldPass && validateValue !== true || !shouldPass && validateValue === true)
				throw new Error(
					`Failed checking for operator "${operator}" for value case "${JSON.stringify(valueCase)}"!\n`+
					`Expected ${shouldPass ? 'true' : 'message'}, returned ${JSON.stringify(validateValue)}`
				);

			expect(true).toBe(true);
		}
	}
}

describe('Query request table name checks', () =>
{
	test('Request without table name fails', () => {
		const request = new QueryRequest();

		expect(request.validate()).not.toStrictEqual(true);
	});

	test('Request with table name that is not a string fails', () => {
		const request = new QueryRequest({
			// @ts-ignore
			table: true
		});

		expect(request.validate()).not.toStrictEqual(true);
	});
});

describe('Query request filtering checks', () =>
{
	test('Filtering with no value fails', () =>
	{
		const operators: string[] = [
			'and', 'or', 'not', 'or not',
			'between', 'not between',
			'like', 'or like', 'not like', 'or not like',
			'>', '>=', '<', '<=', '=', '!='
		], request = new QueryRequest({
			table: 'any'
		});

		for (let operator of operators)
		{
			if(['and', 'or', 'not', 'or not'].some((v) => v == operator))
				request.conditions = [
					operator
				];
			else
				request.conditions = [
					operator, 'anyfield'
				];

			expect(request.validate()).not.toStrictEqual(true);
		}
	});

	test('Filtering with value works', () =>
	{
		const operators: string[] = [
			'and', 'or', 'not', 'or not',
			'between', 'not between',
			'like', 'or like', 'not like', 'or not like',
			'>', '>=', '<', '<=', '=', '!='
		], request = new QueryRequest({
			table: 'any'
		});

		for (let operator of operators)
		{
			if(['and', 'or', 'not', 'or not'].some((v) => v == operator))
				request.conditions = [
					operator, {}
				];
			else
				request.conditions = [
					operator, 'anyfield', '1', '2'
				];

			expect(request.validate()).toStrictEqual(true);
		}
	});

	test('Filtering with field that is not string, fails', () => {
		const operators: string[] = [
			'between', 'not between',
			'like', 'or like', 'not like', 'or not like',
			'>', '>=', '<', '<=', '=', '!='
		], valueCases = [
			true,
			1,
			[],
			{},
			undefined,
			null,
			() => {},
		], request = new QueryRequest({
			table: 'any'
		});

		for (let operator of operators)
		{
			for(let valueCase of valueCases)
			{
				request.conditions = [
					operator, valueCase, 'sort of accepted value'
				];

				expect(request.validate()).not.toStrictEqual(true);
			}
		}
	});

	test('Filtering by conditional operators with wrong values fails', () =>
	{
		checkFilteringFailing([
			'and', 'or', 'not', 'or not'
		], [
			'some',
			1,
			false,
			() => {},
		]);
	});

	describe('Logical operators checks', () =>
	{
		test('Filtering by "between" and "not between" operators with wrong values fails', () =>
		{
			checkFilteringFailing([
				'between', 'not between',
			], [
				// Checking min parameter:
				['a', 1],
				[true, 1],
				[[], 5],
				[{}, 10],
				[() => {}, 500],
				['1,15', 2],

				// Checking max parameter:
				[1, 'a'],
				[0, true],
				[0, []],
				[0, {}],
				[0, () => {}],
				[1, '2,25'],

				// Checking whether max have to be greater than min ("b" is greater than "a")
				['a', 'b'],
				[3, 2],
				['3', '2']
			], true);
		});

		test('Filtering by "between" and "not between" operators with correct values works', () =>
		{
			checkFilteringWorking([
				'between', 'not between',
			], [
				[1, 2],
				[1, 1],
				['1', 2],
				['1', '2']
			], true);
		});

		test('Filtering by "like" operators with non string nor number values fails', () => {
			checkFilteringFailing([
				'like', 'or like', 'not like', 'or not like',
			], [
				true,
				{},
				undefined,
				null,
				() => {},
				[true],
				[{}],
				[undefined],
				[null],
				[() => {}],
			]);
		});

		test('Filtering by "like" operators with correct values works', () =>
		{
			checkFilteringWorking([
				'like', 'or like', 'not like', 'or not like',
			], [
				'lorem',
				'ip%um',
				'dol..',
				'%',
				'am%.',
				55
			]);
		});

		test('Filtering by comparision operators with non accepted values fails', () => {
			checkFilteringFailing([
				'>', '>=', '<', '<=', '=', '!='
			], [
				{},
				[],
				undefined,
				null,
				() => {}
			]);
		});

		test('Filtering by "like" operators with correct values works', () =>
		{
			checkFilteringWorking([
				'>', '>=', '<', '<=', '=', '!='
			], [
				1,
				'test',
				true
			]);
		});
	});
});

describe('Query request limiting checks', () =>
{
	test('Query with limiting only by amount works', () => {
		const testCases: [string|number][] = [
			[0],
			['0']
		], request = new QueryRequest({
			table: 'any'
		});

		for(let testCase of testCases)
		{
			request.limit = testCase;

			expect(request.validate()).toStrictEqual(true);
		}
	});

	test('Query with limiting by offset and amount works', () => {
		const testCases: [string|number, string|number][] = [
			[0, 50],
			[20, 10],
			['0', 5],
			[15, '5'],
			['0', '10']
		], request = new QueryRequest({
			table: 'any'
		});

		for(let testCase of testCases)
		{
			request.limit = testCase;

			expect(request.validate()).toStrictEqual(true);
		}
	});

	test('Query with limiting by non numeric values fails', () => {
		const testCases: any = [
			['a'],
			['1.2343e15'],
			[true],
			[[]],
			[{}],
			[() => {}],
			['1,15', 0],

			[0, 'a'],
			[0, '1.2343e15'],
			[0, true],
			[0, []],
			[0, {}],
			[0, () => {}]
		], request = new QueryRequest({
			table: 'any'
		});

		for(let testCase of testCases)
		{
			request.limit = testCase;

			expect(request.validate()).not.toStrictEqual(true);
		}
	});

	test('Query with limiting by floating values fails', () => {
		const testCases: any = [
			[1.1],
			['1.1'],
			[1, 1.15],
			[1, '1.15']
		], request = new QueryRequest({
			table: 'any'
		});

		for(let testCase of testCases)
		{
			request.limit = testCase;

			expect(request.validate()).not.toStrictEqual(true);
		}
	});

	test('Query with limiting by negative values fails', () => {
		const testCases: any = [
			[-1],
			['-1'],
			['-1.15'],
			[1, -1],
			[1, '-1'],
			[1, '-1.15']
		], request = new QueryRequest({
			table: 'any'
		});

		for(let testCase of testCases)
		{
			request.limit = testCase;

			expect(request.validate()).not.toStrictEqual(true);
		}
	});
});

describe('Query request ordering checks', () =>
{
	test('Ordering works', () => {
		const testCases: any[] = [
			EOrderType.asc,
			EOrderType.desc,
			'asc',
			'desc'
		], request = new QueryRequest({
			table: 'any'
		});

		for(let testCase of testCases)
		{
			request.order = {
				column: testCase
			};

			expect(request.validate()).toBe(true);
		}
	});

	test('Ordering by non accepted value fails', () => {
		const testCases: any[] = [
			true,
			1,
			'wrong value',
			'ASC',
			() => {},
			[],
			{},
			null
		], request = new QueryRequest({
			table: 'any'
		});

		for(let testCase of testCases)
		{
			request.order = {
				column: testCase
			};

			expect(request.validate()).not.toBe(true);
		}
	});
});

describe('Query request data inserting checks', () =>
{
	test('Inserting data works', () => {
		const request = new QueryRequest({
			type: 'insert',
			table: 'any',
			data: [
				{
					id: 1,
					name: 'John',
					isAdmin: true,
					nameChars: [
						'J', 'o', 'h', 'n'
					],
					dates: {
						firstLogin: "2020-06-11 11:41:00"
					}
				}, {
					id: 1,
					name: 'Susan',
					isAdmin: true,
					nameChars: [
						'S', 'u', 's', 'a', 'n'
					],
					dates: {
						firstLogin: "2020-06-11 11:42:00"
					}
				}
			]
		});

		expect(request.validate()).toStrictEqual(true);
	});

	test('Inserting data with different structures works', () => {
		// Reason behind this test is that QueryRequest knows nothing about data structure.
		// There is no reason why QueryRequest should mark this structure as invalid because
		// data type for each field is correct and maybe there are also some default values for fields,
		// that will be provided by API and there is no need to specify them in the request.

		const request = new QueryRequest({
			type: 'insert',
			table: 'any',
			data: [
				{
					id: 1,
					name: 'John',
					isAdmin: true,
				}, {
					id: 1,
					categoryName: 'Shoes',
					parentCategory: 15,
					sort: 55
				}
			]
		});

		expect(request.validate()).toStrictEqual(true);
	});

	test('Inserting data with wrong data types will fail', () => {
		const request = new QueryRequest({
			type: 'insert',
			table: 'any',
			data: [
				{
					id: 1,
					name: () => {}
				}
			]
		});

		expect(request.validate()).not.toStrictEqual(true);

	});

	test('Inserting data that is not an array of objects will fail', () => {
		const request = new QueryRequest({
			type: 'insert',
			table: 'any',
			data: [
				// @ts-ignore
				false
			]
		});

		expect(request.validate()).not.toStrictEqual(true);

		request.data[0] = 'Hello';

		expect(request.validate()).not.toStrictEqual(true);

		request.data[0] = [1, 2, 3];

		expect(request.validate()).not.toStrictEqual(true);

		request.data[0] = () => {};

		expect(request.validate()).not.toStrictEqual(true);
	});
});
