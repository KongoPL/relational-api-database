import MemoryApi from "../api/MemoryApi";
import QueryRequest from "../QueryRequest";
import memoryApiDb from "./mock-databases/MemoryApiDb";

const memoryDb = new MemoryApi();
let request;

beforeEach(() => {
	memoryDb.loadDatabase(memoryApiDb);
	request = new QueryRequest();

	request.table = 'users';
});

test(`Executing query with invalid request fails`, () => {
	delete request.table;

	expect(() => memoryDb.getData(request)).toThrowError();
});

test('Is able to get data', () => {
	const result = memoryDb.getData(request);

	expect(result.length).toBe(memoryApiDb.users.length);
});

test(`Returned value isn't reference to object`, () => {
	const result = memoryDb.getData(request);

	expect(result[0]).not.toBe(memoryApiDb.users[0]);
});

describe('Filtering data', () =>
{
	describe('Filtering by parameters', () => {
		test(`Filtering by parameters works`, () =>
		{
			request.conditions = {
				firstName: 'Jane',
				lastName: 'Doe',
				age: 18
			};

			const result = memoryDb.getData(request);

			expect(result.length).toEqual(1);
			expect(result[0].firstName).toBe('Jane');
			expect(result[0].lastName).toBe('Doe');
			expect(result[0].age).toBe(18);
		});

		test(`Filtering by parameters with array values works`, () =>
		{
			request.conditions = {
				firstName: ['John', 'Jane'],
				lastName: 'Doe',
			};

			const result = memoryDb.getData(request);

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
		test('Filtering by "or" operator works', () =>
		{
			request.conditions = [
				'or', {lastName: 'Doe'}, {firstName: 'Peter'}
			];

			const result = memoryDb.getData(request);

			expect(result.length).toEqual(3);

			for (let row of result)
				expect(row.lastName === 'Doe' || row.firstName == 'Peter').toBeTruthy();
		});

		test('Filtering by "and" operator works', () =>
		{
			request.conditions = [
				'and', {firstName: 'Jane'}, {lastName: 'Doe'}
			];

			const result = memoryDb.getData(request);

			expect(result.length).toEqual(1);
			expect(result[0].firstName === 'Jane' || result[0].lastName == 'Doe').toBeTruthy();
		});

		test('Filtering by "not" operator works', () =>
		{
			request.conditions = [
				'not', {firstName: 'Jane'}, {lastName: 'Doe'}
			];

			const result = memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
			{
				expect(row.firstName).not.toBe('Jane');
				expect(row.lastName).not.toBe('Doe');
			}
		});

		test('Filtering by "or not" operator works', () =>
		{
			request.conditions = [
				'or not', {firstName: 'Jane'}, {lastName: 'Doe'}
			];

			const result = memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(row.firstName != 'Jane' || row.lastName != 'Doe').toBeTruthy();
		});
	});

	describe('Filtering by logical operators', () =>
	{
		test('Filtering by "between" operator works', () =>
		{
			request.conditions = [
				'between', 'age', 20, 30
			];

			const result = memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
			{
				expect(row.age).toBeGreaterThanOrEqual(20);
				expect(row.age).toBeLessThanOrEqual(30);
			}
		});

		test('Filtering by "not between" operator works', () =>
		{
			request.conditions = [
				'not between', 'age', 20, 30
			];

			const result = memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(row.age < 20 || 30 < row.age).toBeTruthy();
		});

		describe('"Like" operator checks', () =>
		{
			test('Filtering by "like" operator works #1', () =>
			{
				request.conditions = [
					'like', 'firstName', 'Jo%',
				];

				const result = memoryDb.getData(request);

				expect(result.length).toBeGreaterThan(0);

				for (let row of result)
					expect(row.firstName.substr(0, 2)).toBe('Jo');
			});

			test('Filtering by "like" operator works #2', () =>
			{
				request.conditions = [
					'like', 'firstName', '%ter',
				];

				const result = memoryDb.getData(request);

				expect(result.length).toBeGreaterThan(0);

				for (let row of result)
					expect(row.firstName.substr(-3)).toBe('ter');
			});

			test('Filtering by "like" operator works #3', () =>
			{
				request.conditions = [
					'like', 'firstName', 'Pa%c',
				];

				const result = memoryDb.getData(request);

				expect(result.length).toBeGreaterThan(0);

				for (let row of result)
				{
					expect(row.firstName.substr(0, 2)).toBe('Pa');
					expect(row.firstName.substr(-1)).toBe('c');
				}
			});

			test('Filtering by "like" operator works #4', () =>
			{
				request.conditions = [
					'like', 'firstName', 'P.tr.c',
				];

				const result = memoryDb.getData(request);

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


		test('Filtering by "or like" operator works', () =>
		{
			request.conditions = [
				'or like', 'firstName', ['Pat%', 'Pet%'],
			];

			const result = memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
			{
				const namePart = row.firstName.substr(0, 3);

				expect(namePart === 'Pat' || namePart === 'Pet').toBeTruthy();
			}
		});

		test('Filtering by "not like" operator works', () =>
		{
			request.conditions = [
				'not like', 'firstName', ['Ja%', '%usa%'],
			];

			const result = memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
			{
				expect(row.firstName.substr(0, 2)).not.toBe('Ja');
				expect(row.firstName.includes('usa')).toBeFalsy();
			}
		});

		test('Filtering by "or not like" operator works', () =>
		{
			request.conditions = [
				'or not like', 'firstName', ['Ja%', '%usa%'],
			];

			const result = memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(
					row.firstName.substr(0, 2) != 'Ja'
					|| row.firstName.includes('usa') === false
				).toBeTruthy();
		});

		test('Filtering by ">" operator works', () =>
		{
			request.conditions = [
				'>', 'age', 23,
			];

			const result = memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(row.age).toBeGreaterThan(23);
		});

		test('Filtering by ">=" operator works', () =>
		{
			request.conditions = [
				'>=', 'age', 23,
			];

			const result = memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(row.age).toBeGreaterThanOrEqual(23);
		});

		test('Filtering by "<" operator works', () =>
		{
			request.conditions = [
				'<', 'age', 23,
			];

			const result = memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(row.age).toBeLessThan(23);
		});

		test('Filtering by "<=" operator works', () =>
		{
			request.conditions = [
				'<=', 'age', 23,
			];

			const result = memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(row.age).toBeLessThanOrEqual(23);
		});

		test('Filtering by "=" operator works', () =>
		{
			request.conditions = [
				'=', 'age', 23,
			];

			const result = memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(row.age).toEqual(23);
		});

		test('Filtering by "!=" operator works', () =>
		{
			request.conditions = [
				'!=', 'age', 23,
			];

			const result = memoryDb.getData(request);

			expect(result.length).toBeGreaterThan(0);

			for (let row of result)
				expect(row.age).not.toEqual(23);
		});

		test('Filtering by not existing operator fails', () =>
		{
			request.conditions = [
				'neverexistingoperator'
			];

			expect(() => memoryDb.getData(request)).toThrowError();
		});

		test('Filtering by not existing field fails', () =>
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

				expect(() => memoryDb.getData(request)).toThrowError();
			}
		});
	});
});
