import User from "./data-types/User";
import DatabaseDataObject from "../DatabaseDataObject";
import Database from "../Database";
import MemoryApi from "../api/MemoryApi";
import memoryApiDb from "./mock-databases/MemoryApiDb";

beforeAll(() => {
	const memoryApi = new MemoryApi();
	const db = new Database(memoryApi);

	memoryApi.loadDatabase(memoryApiDb);

	DatabaseDataObject.injectDatabase(db);
});

test('Setting attributes works', () => {
	const user = new User();

	user.setAttributes({
		firstName: 'John',
		lastName: 'Doe'
	});

	expect(user.firstName).toBe('John');
	expect(user.lastName).toBe('Doe');
});

test('Setting not existing attribute fails', () => {
	const user = new User();

	expect(() =>
	{
		user.setAttributes({
			notexistingcolumn: 'Some value'
		});
	}).toThrowError();
});

test('Setting not allowed value fails', () => {
	const user = new User();

	expect(() =>
	{
		user.setAttributes({
			firstName: () => {}
		});
	}).toThrowError();
});

describe('Finding user', () =>
{
	test('Finding by attributes works', () =>
	{
		const user = User.findOneByAttributes({
			age: 15
		});

		expect(user).not.toBeNull();
		expect(user).toBeInstanceOf(User);
		expect(user.age).toEqual(15);
	});

	test('Finding multiple by attributes works', () => {
		const users = User.findByAttributes({
			lastName: 'Doe'
		});

		expect(Array.isArray(users)).toBeTruthy();
		expect(users.length).toBeGreaterThan(1);

		for(let user of users)
		{
			expect(user).toBeInstanceOf(User);
			expect(user.lastName).toBe('Doe');
		}
	});
});
