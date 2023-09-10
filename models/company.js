"use strict";

const { parse } = require("path");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
	/** Create a company (from data), update db, return new company data.
	 *
	 * data should be { handle, name, description, numEmployees, logoUrl }
	 *
	 * Returns { handle, name, description, numEmployees, logoUrl }
	 *
	 * Throws BadRequestError if company already in database.
	 * */

	static async create({ handle, name, description, numEmployees, logoUrl }) {
		const duplicateCheck = await db.query(
			`SELECT handle
           FROM companies
           WHERE handle = $1`,
			[handle]
		);

		if (duplicateCheck.rows[0])
			throw new BadRequestError(`Duplicate company: ${handle}`);

		const result = await db.query(
			`INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
			[handle, name, description, numEmployees, logoUrl]
		);
		const company = result.rows[0];

		return company;
	}

	/** Find all companies.
	 *
	 * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
	 * */

	static async findAll() {
		const companiesRes = await db.query(
			`SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`
		);
		return companiesRes.rows;
	}

	/** Given a company handle, return data about company.
	 *
	 * Returns { handle, name, description, numEmployees, logoUrl, jobs }
	 *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
	 *
	 * Throws NotFoundError if not found.
	 **/

	static async get(handle) {
		const companyRes = await db.query(
			`SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
			[handle]
		);

		const company = companyRes.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);

		return company;
	}

	/** Update company data with `data`.
	 *
	 * This is a "partial update" --- it's fine if data doesn't contain all the
	 * fields; this only changes provided ones.
	 *
	 * Data can include: {name, description, numEmployees, logoUrl}
	 *
	 * Returns {handle, name, description, numEmployees, logoUrl}
	 *
	 * Throws NotFoundError if not found.
	 */

	static async update(handle, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {
			numEmployees: "num_employees",
			logoUrl: "logo_url",
		});
		const handleVarIdx = "$" + (values.length + 1);

		const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
		const result = await db.query(querySql, [...values, handle]);
		const company = result.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);

		return company;
	}

	/** Delete given company from database; returns undefined.
	 *
	 * Throws NotFoundError if company not found.
	 **/

	static async remove(handle) {
		const result = await db.query(
			`DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
			[handle]
		);
		const company = result.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);
	}

	/** Filter companies by name, minEmployees, maxEmployees.
	 *
	 * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
	 *
	 **/

	/**
	 * Filter companies by name, minEmployees, maxEmployees.
	 *
	 * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
	 *
	 * @param {Object} filters - Filters for filtering companies.
	 * @param {string} filters.name - The company name to filter by.
	 * @param {number} filters.minEmployees - The minimum number of employees.
	 * @param {number} filters.maxEmployees - The maximum number of employees.
	 * @returns {Array} - An array of filtered companies.
	 */
  static async filter({ name, minEmployees, maxEmployees }) {
    // Make the query generic, so that way we can add more filters later
    let query = `
      SELECT handle,
             name,
             description,
             num_employees AS "numEmployees",
             logo_url AS "logoUrl"
      FROM companies
      WHERE 1 = 1`;
  
    let queryValues = [];
  
    // If there are any filters, we need to add a WHERE clause to the query
    if (name !== undefined) {
      query += ` AND name ILIKE $${queryValues.length + 1}`;
      queryValues.push(`%${name}%`);
    }
  
    if (minEmployees !== undefined) {
      query += ` AND num_employees >= $${queryValues.length + 1}`;
      queryValues.push(parseInt(minEmployees));
    }
  
    if (maxEmployees !== undefined) {
      query += ` AND num_employees <= $${queryValues.length + 1}`;
      queryValues.push(parseInt(maxEmployees));
    }
  
    if (minEmployees !== undefined && maxEmployees !== undefined && minEmployees > maxEmployees) {
      throw new BadRequestError(
        `Min employees cannot be greater than max employees`
      );
    }
  
    const companiesRes = await db.query(query, queryValues);
  
    if (companiesRes.rows.length === 0) {
      if (minEmployees > maxEmployees) {
        throw new BadRequestError(
          `Min employees cannot be greater than max employees`
        );
      }
      if (minEmployees) {
        throw new NotFoundError(
          `No companies found with less than ${minEmployees} employees`
          );
        }
        if (name) {
          throw new NotFoundError(`No companies found with name: ${name}`);
        }
    }
  
    return companiesRes.rows;
  }
}
  

module.exports = Company;
