import User from "./data-types/User";
import DatabaseDataObject from "../DatabaseDataObject";
import Database from "../Database";
import MemoryApi from "../api/MemoryApi";
import memoryApiDb from "./mock-databases/MemoryApiDb";
import City from "./data-types/City";

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
	test('Finding by attributes works', async () =>
	{
		User.findOneByAttributes({
			age: 15
		}).then((user) =>
		{
			expect(user).not.toBeNull();
			expect(user).toBeInstanceOf(User);
			expect(user.age).toEqual(15);
		})
			.catch(reason => expect(reason).not.toBeDefined());
	});

	test('Finding multiple by attributes works', async () => {
		const users = User.findByAttributes({
			lastName: 'Doe'
		}).then((users) =>
		{

			expect(Array.isArray(users)).toBeTruthy();
			expect(users.length).toBeGreaterThan(1);

			for (let user of users)
			{
				expect(user).toBeInstanceOf(User);
				expect(user.lastName).toBe('Doe');
			}
		})
			.catch(reason => expect(reason).not.toBeDefined());
	});
});

describe('Relations', () => {
	test.only('Obtaining One - One relation works', async  () => {
		const user = <User> await User.findById(1);

		expect(user).not.toBeNull();
		expect(user.city).toBeNull();
		expect(user.cityId).not.toBeNull();

		user.getRelation('city').then((data: City) => {
			expect(user.city).not.toBeNull();
			expect(data).toStrictEqual(user.city);
			expect((<City>user.city).name).toBe('Oklahoma');
		})
			.catch(reason => expect(reason).not.toBeDefined());
	});

	test('Obtaining One - Many relation works', async () => {
		City.findById(1).then((city) =>
		{

			expect(city).not.toBeNull();
			expect(city.users.length).toBe(0);
			expect(city.id).not.toBeNull();

			city.getRelation('users').then((data: User[]) =>
			{
				expect(city.users).not.toBeNull();
				expect(data).toStrictEqual(city.users);
				expect(data.length).toBeGreaterThan(0);

				for (let row of data)
					expect(row.cityId).toBe(1);
			})
				.catch(reason => expect(reason).not.toBeDefined());
		})
			.catch(reason => expect(reason).not.toBeDefined());
	});

	test.todo('Obtaining Many - Many relation works');
	test.todo(`Updating related record separately, won't update it on model except, relation is refreshed`);
});
