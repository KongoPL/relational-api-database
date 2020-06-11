import {User} from "./data-types/User";
import {Database} from "../src/Database";
import {MemoryApi} from "../src/api/MemoryApi";
import {memoryApiDb} from "./mock-databases/MemoryApiDb";
import {City} from "./data-types/City";
import {QueryRequest} from "../src/QueryRequest";
import {DatabaseDataObject} from "../src/DatabaseDataObject";

let db: Database;

beforeAll(() => {
	const memoryApi = new MemoryApi();
	db = new Database(memoryApi);

	memoryApi.loadDatabase(memoryApiDb);

	DatabaseDataObject.injectDatabase(db);
});

describe('Attributes management', () => {
	test('Getting attributes works', async () => {
		const user = await User.findById(1);
		const attributes = user.getAttributes();

		expect('id' in attributes).toBeTruthy();
		expect(attributes.id).toBe(user.id);
		expect(user.getAttribute('id')).toBe(attributes.id);
	});

	test('Getting unwanted attributes fails', async () => {
		const user = await User.findById(1);
		const attributes = user.getAttributes();

		// Unwanted methods:
		expect('relations' in attributes).toBeFalsy();
		expect('getAttributes' in attributes).toBeFalsy();

		// Unwanted properties:
		expect('db' in attributes).toBeFalsy();
		expect('onInit' in attributes).toBeFalsy();
		expect('obtainedRelations' in attributes).toBeFalsy();
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

	test.todo('Checking attributes existence works');
});

describe('Finding data', () =>
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
			.catch(fail);
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
			.catch(fail);
	});
});

describe('Relations', () => {
	test('Obtaining One - One relation works', async  () => {
		const user = await User.findById(1);

		expect(user).not.toBeNull();
		expect(user.city).toBeNull();
		expect(user.cityId).not.toBeNull();

		user.getRelation('city').then((data: City) => {
			expect(user.city).not.toBeNull();
			expect(user.city).toBeInstanceOf(City);
			expect(data).toStrictEqual(user.city);
			expect(user.city.name).toBe('Oklahoma');
		})
			.catch(fail);
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
				{
					expect(row).toBeInstanceOf(User);
					expect(row.cityId).toBe(1);
				}
			})
				.catch(fail);
		})
			.catch(fail);
	});

	test('Obtaining Many - Many relation works', () => {
		User.findById(1).then(async (user) => {
			expect(user).not.toBeNull();
			const request = new QueryRequest({
				table: 'visitedCities',
				conditions: {userId: 1}
			});

			const dbVisitedCities = await db.getData(request);

			user.getRelation('visitedCities').then((visitedCities) => {
				expect(Array.isArray(visitedCities)).toBeTruthy();
				expect(visitedCities.length).toBeGreaterThan(0);
				expect(visitedCities.length).toEqual(dbVisitedCities.length);

				for(let city of visitedCities)
					expect(city).toBeInstanceOf(City);
			})
				.catch(fail);
		})
			.catch(fail);
	});

	test.todo('Fetching relations with eager loading works');
	test.todo(`Reobtaining relation won't request for data except it has been asked to refresh`);
	test.todo(`Updating related record separately, won't update it on model except, relation is refreshed`);
});

describe('Serialization', () =>
{
	test('Converting to objects works', () =>
	{
		const tags = ['Lets', 'Check', 'References'],
			city = new City(),
			user = new User();

		city.setAttributes({
			id: 55,
			name: 'Kansas'
		});
		user.setAttributes({
			id: 1,
			firstName: 'Susan',
			tags: tags,
			city: city
		});

		const serialized = user.toObject();

		expect(serialized.id).toBe(1);
		expect(serialized.firstName).toBe('Susan');
		expect(serialized.tags).not.toBe(tags);
		expect(Array.isArray(serialized.tags)).toBeTruthy();
		expect(serialized.tags.length).toBe(tags.length);

		for (let key in tags)
			expect(serialized.tags[key]).toBe(tags[key]);

		expect(serialized.city).not.toBe(city);
		expect(serialized.city).not.toBeInstanceOf(City);
		expect(serialized.city).toBeInstanceOf(Object);
		expect(serialized.city.id).toBe(55);
		expect(serialized.city.name).toBe('Kansas');
	});
});
