import {MemoryApi} from "../src/api/MemoryApi";
import {QueryRequest, EOrderType} from "../src/QueryRequest";
import {memoryApiDb} from "./mock-databases/MemoryApiDb";

const memoryDb = new MemoryApi();
let request;

beforeEach(() => {
	memoryDb.loadDatabase(memoryApiDb);
	request = new QueryRequest();

	request.table = 'users';
});

test(`Check whether validation method for request is called`, () =>
{
	const validateSpy = jest.spyOn(request, 'validate');

	memoryDb.getData(request);

	expect(validateSpy).toHaveBeenCalled();
});

test('Is able to get data', async () =>
{
	const result = await memoryDb.getData(request);

	expect(result.length).toBe(memoryApiDb.users.length);
});

test(`Returned value isn't reference to object`, async () =>
{
	const result = await memoryDb.getData(request);

	expect(result[0]).not.toBe(memoryApiDb.users[0]);
});

describe('Filtering data', () =>
{
	describe('Filtering by parameters', () => {
		test(`Filtering by parameters works`, async () =>
		{
			request.conditions = {
				firstName: 'Jane',
				lastName: 'Doe',
				age: 18
			};

			const result = await memoryDb.getData(request);

			expect(result.length).toEqual(1);
			expect(result[0].firstName).toBe('Jane');
			expect(result[0].lastName).toBe('Doe');
			expect(result[0].age).toBe(18);
		});

		test(`Filtering by parameters with array values works`, async () =>
		{
			request.conditions = {
				firstName: ['John', 'Jane'],
				lastName: 'Doe',
			};

			const result = await memoryDb.getData(request);

			expect(result.length).toEqual(2);

			for (let row of result)
			{
				expect(['John', 'Jane'].some(v => v == row.firstName)).toBeTruthy();
				expect(row.lastName).toBe('Doe');
			}
		});
	});

	describe('Filtering by conditional operators', () =>
	{
		test('Filtering by "or" operator works', async () =>
		{
			request.conditions = [
				'or', {lastName: 'Doe'}, {firstName: 'Peter'}
			];

			const result = await memoryDb.getData(request);

			expect(result.length).toEqual(3);

			for (let row of result)
				expect(row.lastName === 'Doe' || row.firstName == 'Peter').toBeTruthy();
		});

		test('Filtering by "and" operator works', async () =>
		{
			request.conditions = [
				'and', {firstName: 'Jane'}, {lastName: 'Doe'}
			];

			const result = await memoryDb.getData(request);

			expect(result.length).toEqual(1);
			expect(result[0].firstName === 'Jane' || result[0].lastName == 'Doe').toBeTruthy();
		});

		test('Filtering by "not" operator works', async () =>
		{
			request.conditions = [
				'not', {firstName: 'Jane'}, {lastName: 'Doe'}
			];

			const result = await memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
			{
				expect(row.firstName).not.toBe('Jane');
				expect(row.lastName).not.toBe('Doe');
			}
		});

		test('Filtering by "or not" operator works', async () =>
		{
			request.conditions = [
				'or not', {firstName: 'Jane'}, {lastName: 'Doe'}
			];

			const result = await memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(row.firstName != 'Jane' || row.lastName != 'Doe').toBeTruthy();
		});
	});

	describe('Filtering by logical operators', () =>
	{
		test('Filtering by "between" operator works', async () =>
		{
			request.conditions = [
				'between', 'age', 20, 30
			];

			const result = await memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
			{
				expect(row.age).toBeGreaterThanOrEqual(20);
				expect(row.age).toBeLessThanOrEqual(30);
			}
		});

		test('Filtering by "not between" operator works', async () =>
		{
			request.conditions = [
				'not between', 'age', 20, 30
			];

			const result = await memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(row.age < 20 || 30 < row.age).toBeTruthy();
		});

		describe('"Like" operator checks', () =>
		{
			test('Filtering by "like" operator works #1', async () =>
			{
				request.conditions = [
					'like', 'firstName', 'Jo%',
				];

				const result = await memoryDb.getData(request);

				expect(result.length).toBeGreaterThan(0);

				for (let row of result)
					expect(row.firstName.substr(0, 2)).toBe('Jo');
			});

			test('Filtering by "like" operator works #2', async () =>
			{
				request.conditions = [
					'like', 'firstName', '%ter',
				];

				const result = await memoryDb.getData(request);

				expect(result.length).toBeGreaterThan(0);

				for (let row of result)
					expect(row.firstName.substr(-3)).toBe('ter');
			});

			test('Filtering by "like" operator works #3', async () =>
			{
				request.conditions = [
					'like', 'firstName', 'Pa%c',
				];

				const result = await memoryDb.getData(request);

				expect(result.length).toBeGreaterThan(0);

				for (let row of result)
				{
					expect(row.firstName.substr(0, 2)).toBe('Pa');
					expect(row.firstName.substr(-1)).toBe('c');
				}
			});

			test('Filtering by "like" operator works #4', async () =>
			{
				request.conditions = [
					'like', 'firstName', 'P.tr.c',
				];

				const result = await memoryDb.getData(request);

				expect(result.length).toBeGreaterThan(0);

				for (let row of result)
				{
					expect(row.firstName.length).toEqual(6);
					expect(row.firstName.substr(0, 1)).toBe('P');
					expect(row.firstName.substr(2, 2)).toBe('tr');
					expect(row.firstName.substr(-1)).toBe('c');
				}
			});
		});


		test('Filtering by "or like" operator works', async () =>
		{
			request.conditions = [
				'or like', 'firstName', ['Pat%', 'Pet%'],
			];

			const result = await memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
			{
				const namePart = row.firstName.substr(0, 3);

				expect(namePart === 'Pat' || namePart === 'Pet').toBeTruthy();
			}
		});

		test('Filtering by "not like" operator works', async () =>
		{
			request.conditions = [
				'not like', 'firstName', ['Ja%', '%usa%'],
			];

			const result = await memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
			{
				expect(row.firstName.substr(0, 2)).not.toBe('Ja');
				expect(row.firstName.includes('usa')).toBeFalsy();
			}
		});

		test('Filtering by "or not like" operator works', async () =>
		{
			request.conditions = [
				'or not like', 'firstName', ['Ja%', '%usa%'],
			];

			const result = await memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(
					row.firstName.substr(0, 2) != 'Ja'
					|| row.firstName.includes('usa') === false
				).toBeTruthy();
		});

		test('Filtering by ">" operator works', async () =>
		{
			request.conditions = [
				'>', 'age', 23,
			];

			const result = await memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(row.age).toBeGreaterThan(23);
		});

		test('Filtering by ">=" operator works', async () =>
		{
			request.conditions = [
				'>=', 'age', 23,
			];

			const result = await memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(row.age).toBeGreaterThanOrEqual(23);
		});

		test('Filtering by "<" operator works', async () =>
		{
			request.conditions = [
				'<', 'age', 23,
			];

			const result = await memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(row.age).toBeLessThan(23);
		});

		test('Filtering by "<=" operator works', async () =>
		{
			request.conditions = [
				'<=', 'age', 23,
			];

			const result = await memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(row.age).toBeLessThanOrEqual(23);
		});

		test('Filtering by "=" operator works', async () =>
		{
			request.conditions = [
				'=', 'age', 23,
			];

			const result = await memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(row.age).toEqual(23);
		});

		test('Filtering by "!=" operator works', async () =>
		{
			request.conditions = [
				'!=', 'age', 23,
			];

			const result = await memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(row.age).not.toEqual(23);
		});

		test('Filtering by not existing operator fails', async () =>
		{
			request.conditions = [
				'neverexistingoperator'
			];

			expect(memoryDb.getData(request)).rejects.toBeDefined();
		});

		test('Filtering by not existing field fails', async () =>
		{
			const operators = [
				'and', 'or', 'not', 'or not',
				'between', 'not between',
				'like', 'or like', 'not like', 'or not like',
				'>', '>=', '<', '<=', '=', '!='
			];

			for (let operator of operators)
			{
				if(['and', 'or', 'not', 'or not'].some(v => v == operator))
					request.conditions = [
						operator, {notexistingfield: 'notexistingvalue'}
					];
				else
					request.conditions = [
						operator, 'notexistingfield', 'neverexistingvalue'
					];

				expect(memoryDb.getData(request)).rejects.toBeDefined();
			}
		});
	});
});

describe('Limiting data', () =>
{
	test('Limiting data by amount works', async () =>
	{
		const testCases = [
			5,
			'5',
		];

		for (let testCase of testCases)
		{
			request.limit = [testCase];

			const result = await memoryDb.getData(request);

			expect(result.length).toBe(parseInt(testCase+''));
		}
	});

	test('Limiting data by offset and amount works', async () =>
	{
		request.limit = [0, 4];
		let result = await memoryDb.getData(request);
		expect(result.length).toBe(4);
	});

	test('Limiting data by changed offset and amount works', async () =>
	{
		request.limit = [1, 4];
		let result = await memoryDb.getData(request);
		expect(result.length).toBe(4);
	});

	test('Limiting data by offset and amount works (checked by data)', async () =>
	{
		request.limit = [0, 5];
		let dataA = await memoryDb.getData(request);

		request.limit = [1, 4];
		let dataB = await memoryDb.getData(request);

		expect(dataA.length).toBe(5);
		expect(dataB.length).toBe(4);
		expect(JSON.stringify(dataA[0])).not.toBe(JSON.stringify(dataB[0]));
		expect(JSON.stringify(dataA[4])).toBe(JSON.stringify(dataB[3]));
	});

	test('Limiting data with offset and amount greater than records count works', async () =>
	{
		request.limit = [5, 4];
		let result = await memoryDb.getData(request);
		expect(result.length).not.toBe(4);
	});

	test('Limiting data by offset greater than records count works', async () =>
	{
		request.limit = [10000, 4];
		let result = await memoryDb.getData(request);
		expect(result.length).not.toBe(4);
	});
});

describe('Sorting data', () =>
{
	function isSortCorrect(values, sortDirection: EOrderType)
	{
		if(values.length === 0)
			return false;

		let currentValue = values[0];

		for (let i = 1; i < values.length; i++)
		{
			const value = values[i];

			if(sortDirection == EOrderType.asc && value >= currentValue
			|| sortDirection == EOrderType.desc && value <= currentValue)
				currentValue = value;
			else
				return false;
		}

		return true;
	}

	test('Ordering numerical data ascending works', async () =>
	{
		request.order = {
			age: EOrderType.asc
		};

		const data = (await memoryDb.getData(request)).map((v) => v.age);

		if(!isSortCorrect(data, EOrderType.asc))
			throw new Error(`Sorting by number ascending does not work. Returned values: ${JSON.stringify(data)}`);
	});

	test('Ordering numerical data descending works', async () =>
	{
		request.order = {
			age: EOrderType.desc
		};

		const data = (await memoryDb.getData(request)).map((v) => v.age);

		if(!isSortCorrect(data, EOrderType.desc))
			throw new Error(`Sorting by number descending does not work. Returned values: ${JSON.stringify(data)}`);
	});

	test('Ordering text data ascending works', async () =>
	{
		request.order = {
			firstName: EOrderType.asc
		};

		const data = (await memoryDb.getData(request)).map((v) => v.firstName);

		if(!isSortCorrect(data, EOrderType.asc))
			throw new Error(`Sorting by text ascending does not work. Returned values: ${JSON.stringify(data)}`);
	});

	test('Ordering text data descending works', async () =>
	{
		request.order = {
			firstName: EOrderType.desc
		};

		const data = (await memoryDb.getData(request)).map((v) => v.firstName);

		if(!isSortCorrect(data, EOrderType.desc))
			throw new Error(`Sorting by text descending does not work. Returned values: ${JSON.stringify(data)}`);
	});

	test('Ordering by not existing column fails', async () =>
	{
		request.order = {
			notexistingcolumn: EOrderType.asc
		};

		expect(memoryDb.getData(request)).rejects.toBeDefined();
	});
});

describe('Data inserting', () =>
{
	test('Data inserting with Auto Increment works', async () => {
		request.type = 'insert';
		request.data = [
			{
				id: 555,
				firstName: 'Jakub',
				lastName: 'Poliszuk',
				age: 23
			}
		];

		try
		{
			const recordIds = await memoryDb.insertData(request);

			expect(recordIds).toBeInstanceOf(Array);
			expect(recordIds.length).toBe(1);
			expect(recordIds[0]).not.toBe(555); // Because of AI

			const userId = recordIds[0];

			const users = await memoryDb.getData(new QueryRequest({
				table: 'users',
				conditions: {
					firstName: 'Jakub',
					lastName: 'Poliszuk'
				}
			}));

			expect(users).toBeInstanceOf(Array);
			expect(users.length).toBe(1);
			expect(users[0].id).not.toBe(555);
			expect(users[0].id).toBe(userId);
			expect(users[0].age).toBe(23);
		}
		catch(e)
		{
			fail(e);
		}
	});

	test('Data inserting without Auto Increment works', async () =>
	{
		request.type = 'insert';
		request.table = 'cities';
		request.data = [
			{
				id: 555,
				name: 'JustAMockCity',
			}
		];

		try
		{
			const recordIds = await memoryDb.insertData(request);

			expect(recordIds).not.toBeInstanceOf(Array);
			expect(recordIds).not.toBeDefined();

			const cities = await memoryDb.getData(new QueryRequest({
				table: 'cities',
				conditions: {
					name: 'JustAMockCity'
				}
			}));

			expect(cities).toBeInstanceOf(Array);
			expect(cities.length).toBe(1);
			expect(cities[0].id).toBe(555);
		}
		catch(e)
		{
			fail(e);
		}
	});
});

describe('Data updating', () =>
{
	test('Updating works', async () => {
		request.type = 'update';
		request.conditions = {
			id: 1
		};

		const queryResult = await memoryDb.getData(request);

		expect(queryResult).toBeInstanceOf(Array);
		expect(queryResult.length).toEqual(1);

		const user = queryResult[0];

		expect(user.age).toBeDefined();
		expect(typeof user.age).toBe('number');

		const newAge = user.age + 1;

		await memoryDb.updateData(new QueryRequest({
			type: 'update',
			table: 'users',
			values: {
				age: newAge
			},
			conditions: {
				id: 1
			}
		}));

		const newUser = await memoryDb.getData(request);

		expect(newUser[0].age).toBe(newAge);
	});

	test('Updating non existing field will fail', () => {
		request.values = {
			notexistingfield: 15
		};

		memoryDb.updateData(request)
			.then(() => fail('Updating promise should be rejected!'))
			.catch(() => expect(true).toBe(true));
	});
});
