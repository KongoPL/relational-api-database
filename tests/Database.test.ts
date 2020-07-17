import {User} from "./data-types/User";
import {Database} from "../src/Database";
import {MemoryApi} from "../src/api/MemoryApi";
import {memoryApiDb} from "./mock-databases/MemoryApiDb";
import {City} from "./data-types/City";
import {QueryRequest} from "../src/QueryRequest";
import {DatabaseDataObject} from "../src/DatabaseDataObject";
import {Currency} from "./data-types/Currency";
import {MemoryCache} from "../src/cache/MemoryCache";
import {DatabaseCache} from "../src/DatabaseCache";

let db: Database,
	memoryApi: MemoryApi,
	memoryCache: MemoryCache;

beforeEach(() => {
	memoryApi = new MemoryApi();
	memoryCache = new MemoryCache();

	memoryApi.loadDatabase(memoryApiDb);

	db = new Database(memoryApi, memoryCache);
});

test(`Check whether validation method for request is called`, async () =>
{
	const query = new QueryRequest({
		table: 'users'
	});

	const validateSpy = jest.spyOn(query, 'validate');

	await db.getData(query);

	expect(validateSpy).toHaveBeenCalled();
});

describe('Cache', () =>
{
	test('Database caching for selecting works', async () =>
	{
		memoryCache.cacheDatabase(memoryApiDb);

		const dataSpy = jest.spyOn(memoryCache, 'getData'),
			query = new QueryRequest({
				table: 'users'
			});

		await db.getData(query);

		expect(dataSpy).toHaveBeenCalledWith(query);
	});

	test('Database cache updates after data has been inserted works', async () =>
	{
		memoryCache.cacheDatabase(memoryApiDb);

		await db.insertData(new QueryRequest({
			table: 'users',
			data: [
				{
					firstName: 'Testing',
					lastName: 'User',
					age: 95
				}
			]
		}));

		const cacheUser = await (<DatabaseCache>db.cache).getData(new QueryRequest({
			table: 'users',
			conditions: {
				firstName: 'Testing',
				lastName: 'User',
			}
		}));

		expect(cacheUser).toBeInstanceOf(Array);
		expect(cacheUser.length).toBe(1);
	});

	test('Database cache updates after data has been updated works', async () =>
	{
		memoryCache.cacheDatabase(memoryApiDb);

		await db.updateData(new QueryRequest({
			table: 'users',
			values: {
				lastName: 'UserUpdated'
			},
			conditions: {
				id: 1
			}
		}));

		const cacheUser = await (<DatabaseCache>db.cache).getData(new QueryRequest({
			table: 'users',
			conditions: {
				id: 1
			}
		}));

		expect(cacheUser).toBeInstanceOf(Array);
		expect(cacheUser.length).toBe(1);
		expect(cacheUser[0].lastName).toBe('UserUpdated');
	});

	test('Database cache updates after data has been deleted works', async () =>
	{
		memoryCache.cacheDatabase(memoryApiDb);

		await db.deleteData(new QueryRequest({
			table: 'users',
			conditions: {
				id: 1
			}
		}));

		const cacheUser = await (<DatabaseCache>db.cache).getData(new QueryRequest({
			table: 'users',
			conditions: {
				id: 1
			}
		}));

		expect(cacheUser).toBeInstanceOf(Array);
		expect(cacheUser.length).toBe(0);
	});

	test('Query caching works', async () =>
	{
		const queryData = {
			table: 'users',
		};

		const getQueryOutputSpy = jest.spyOn(<DatabaseCache>db.cache, 'getQueryOutput');

		const returnedData = await db.getData(new QueryRequest(queryData));

		expect(getQueryOutputSpy).not.toHaveBeenCalled();

		const returnedCache = await db.getData(new QueryRequest(queryData));

		expect(getQueryOutputSpy).toHaveBeenCalled();
		expect(JSON.stringify(returnedData)).toBe(JSON.stringify(returnedCache));

		// Cache omitting:
		await db.getData(new QueryRequest({
			...queryData,
			cache: false
		}));

		expect(getQueryOutputSpy).toHaveBeenCalledTimes(1);
	});
});
