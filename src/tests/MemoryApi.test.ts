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

test(`Not complete request will throw exception`, () => {
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

test(`Filtering by parameters works`, () => {
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

test(`Filtering by parameters with array values works`, () => {
	request.conditions = {
		firstName: ['John', 'Jane'],
		lastName: 'Doe',
	};

	const result = memoryDb.getData(request);

	expect(result.length).toEqual(2);

	for(let row of result)
	{
		expect(['John', 'Jane'].some(v => v == row.firstName)).toBeTruthy();
		expect(row.lastName).toBe('Doe');
	}
});

test('Filtering by "or" operator works', () => {
	request.conditions = [
		'or', {lastName: 'Doe'}, {firstName: 'Peter'}
	];

	const result = memoryDb.getData(request);

	expect(result.length).toEqual(3);

	for(let row of result)
		expect(row.lastName === 'Doe' || row.firstName == 'Peter').toBeTruthy();
});

test('Filtering by "and" operator works', () => {
	request.conditions = [
		'and', {firstName: 'Jane'}, {lastName: 'Doe'}
	];

	const result = memoryDb.getData(request);

	expect(result.length).toEqual(1);
	expect(result[0].firstName === 'Jane' || result[0].lastName == 'Doe').toBeTruthy();
});

test('Filtering by "not" operator works', () => {
	request.conditions = [
		'not', {firstName: 'Jane'}, {lastName: 'Doe'}
	];

	const result = memoryDb.getData(request);

	expect(result.length).toBeGreaterThan(0);

	for(let row of result)
	{
		expect(row.firstName).not.toBe('Jane');
		expect(row.lastName).not.toBe('Doe');
	}
});

test('Filtering by "or not" operator works', () => {
	request.conditions = [
		'or not', {firstName: 'Jane'}, {lastName: 'Doe'}
	];

	const result = memoryDb.getData(request);

	expect(result.length).toBeGreaterThan(0);

	for(let row of result)
		expect(row.firstName != 'Jane' || row.lastName != 'Doe').toBeTruthy();
});

test('Filtering by "between" operator works', () => {
	request.conditions = [
		'between', 'age', 20, 30
	];

	const result = memoryDb.getData(request);

	expect(result.length).toBeGreaterThan(0);

	for(let row of result)
	{
		expect(row.age).toBeGreaterThanOrEqual(20);
		expect(row.age).toBeLessThanOrEqual(30);
	}
});

test('Filtering by "not between" operator works', () => {
	request.conditions = [
		'not between', 'age', 20, 30
	];

	const result = memoryDb.getData(request);

	expect(result.length).toBeGreaterThan(0);

	for(let row of result)
		expect(row.age < 20 || 30 < row.age).toBeTruthy();
});

test.todo('Filtering by "like" operator works');
test.todo('Filtering by "or like" operator works');
test.todo('Filtering by "not like" operator works');
test.todo('Filtering by "or not like" operator works');
test.todo('Filtering by ">" operator works');
test.todo('Filtering by ">=" operator works');
test.todo('Filtering by "<" operator works');
test.todo('Filtering by "<=" operator works');
test.todo('Filtering by "=" operator works');
test.todo('Filtering by "!=" operator works');
test.todo('Filtering not existing operator fails');
test.todo('Filtering not existing field fails');
