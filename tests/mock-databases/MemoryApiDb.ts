export const memoryApiDb = {
	_meta: {
		idColumns: {
			users: 'id',
		}
	},
	users: [
		{
			id: 1,
			firstName: 'John',
			lastName: 'Doe',
			age: 23,
			cityId: 1
		}, {
			id: 2,
			firstName: 'Jane',
			lastName: 'Doe',
			age: 18,
			cityId: 1
		}, {
			id: 3,
			firstName: 'Patric',
			lastName: 'Smith',
			age: 23,
			cityId: null
		}, {
			id: 4,
			firstName: 'Susan',
			lastName: 'Black',
			age: 25,
			cityId: 2
		}, {
			id: 5,
			firstName: 'Peter',
			lastName: 'Hanks',
			age: 30,
			cityId: 2
		}, {
			id: 6,
			firstName: 'Brian',
			lastName: 'o Neil',
			age: 15,
			cityId: 3
		},
	],
	cities: [
		{
			id: 1,
			name: 'Oklahoma',
		}, {
			id: 2,
			name: 'Lublin',
		}, {
			id: 3,
			name: 'Paris',
		}
	],
	visitedCities: [
		{
			userId: 1,
			cityId: 1,
		}, {
			userId: 1,
			cityId: 2,
		}, {
			userId: 1,
			cityId: 3,
		}, {
			userId: 2,
			cityId: 1,
		}, {
			userId: 2,
			cityId: 1,
		}, {
			userId: 3,
			cityId: 1,
		}
	],
	currencies: [
		{
			userId: 1,
			name: 'PLN',
			value: 0.15
		}
	]
};
