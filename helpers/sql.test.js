const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql"); // Replace with the correct path to your module

describe("sqlForPartialUpdate Function", () => {
	it("should generate SQL syntax for a partial update with valid input", () => {
		// Test data
		const dataToUpdate = { firstName: "Aliya", age: 32 };
		const jsToSql = { firstName: "first_name" };
		// Expected result
		const expectedSQL = {
			setCols: '"first_name"=$1, "age"=$2',
			values: ["Aliya", 32],
		};
		// Call the function and assert the result
		const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
		expect(result).toEqual(expectedSQL);
	});

	it("should throw a BadRequestError if no data is provided for update", () => {
		// Test data with no data to update
		const dataToUpdate = {};
		const jsToSql = {};
		// Call the function and expect it to throw a BadRequestError
		expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql)).toThrow(
			BadRequestError
		);
	});

	it("should handle mapping of JavaScript property names to SQL columns", () => {
		// Test data
		const dataToUpdate = { firstName: "Aliya", age: 32 };
		const jsToSql = { firstName: "db_first_name", age: "db_age" };
		// Expected result with mapped column names
		const expectedSQL = {
			setCols: '"db_first_name"=$1, "db_age"=$2',
			values: ["Aliya", 32],
		};
		// Call the function and assert the result
		const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
		expect(result).toEqual(expectedSQL);
	});
});
