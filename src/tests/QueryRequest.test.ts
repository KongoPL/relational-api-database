import QueryRequest from "../QueryRequest";

test.only('Filtering with no value fails', () => {
	const operators: string[] = [
		'and', 'or', 'not', 'or not',
		'between', 'not between',
		'like', 'or like', 'not like', 'or not like',
		'>', '>=', '<', '<=', '=', '!='
	], request = new QueryRequest({
		table: 'any'
	});

	for(let operator of operators)
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
