const { BadRequestError } = require("../expressError");

/**
 * Generates SQL syntax for performing a partial update in a PostgreSQL database.
 *
 * @param {Object} dataToUpdate - An object containing the data to be updated.
 * @param {Object} jsToSql - An optional mapping of JavaScript property names to their corresponding database column names.
 *
 * @throws {BadRequestError} If no data is provided for update.
 *
 * @returns {Object} An object containing the SQL set clause and corresponding values.
 *
 * @example
 *   const dataToUpdate = { firstName: 'Aliya', age: 32 };
 *   const jsToSql = { firstName: 'first_name' };
 *   const sql = sqlForPartialUpdate(dataToUpdate, jsToSql);
//  *   // Returns:
//  *   // {
//  *   //   setCols: '"first_name"=$1, "age"=$2',
//  *   //   values: ['Aliya', 32]
//  *   // }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
      (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}



module.exports = { sqlForPartialUpdate };
