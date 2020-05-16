import QueryRequest from "../QueryRequest";

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

describe('Query request table name checks', function ()
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
				['a', 'b'],
				[1, 'a'],
				['a', 1],
				[true, false],
				[[], []],
				[{}, []],
				['5', 'a'],
				['a', 5],
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
