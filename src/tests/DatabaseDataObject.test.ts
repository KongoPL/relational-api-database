import Database from "../Database";
import User from "./data-types/User";

test('User full name is John Doe', () => {
	const user = new User();

	user.firstName = 'John';
	user.lastName = 'Doe';

	expect(user.fullName).toBe('John Doe');
});
