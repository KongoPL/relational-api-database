import QueryRequest from "../QueryRequest";

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
					operator, 'age'
				];

			expect(request.validate()).not.toStrictEqual(true);
		}
	});

	test('Filtering by conditional operators with wrong values fails', () =>
	{
		const operators: string[] = [
			'and', 'or', 'not', 'or not'
		], request = new QueryRequest({
			table: 'any'
		});

		for (let operator of operators)
		{
			request.conditions = [
				operator, 'some', 'nonssense', 'that is', false, 'accepted', 1, 'parameter'
			];

			expect(request.validate()).not.toStrictEqual(true);
		}
	});

	describe('Logical operators checks', () =>
	{
		test('Filtering by "between" and "not between" operators with wrong values fails', () =>
		{
			const operators: string[] = [
					'between', 'not between',
				], valueCases: [any, any][] = [
					['a', 'b'],
					[1, 'a'],
					['a', 1],
					[true, false],
					[[], []],
					[{}, []],
					['5', 'a'],
					['a', 5]
				],
				request = new QueryRequest({
					table: 'any'
				});

			for (let operator of operators)
			{
				for (let valueCase of valueCases)
				{
					request.conditions = [
						operator, valueCase[0], valueCase[1]
					];

					expect(request.validate()).not.toStrictEqual(true);
				}
			}
		});

		test.todo('Filtering by "like" operators with non string values fails');
		test.todo('Filtering by comparision operators with non accepted values fails');
	});
});
