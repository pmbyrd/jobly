//NOTE - Pattern match from company model
"use strict";

const { parse } = require("path");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */
class Job {
	/** Create a job (from data), update db, return new job data.
	 *
	 * data should be { title, salary, equity, companyHandle }
	 *
	 * companyHandle is the handle for the company this job belongs to
	 * must
	 *
	 * Returns { id, title, salary, equity, companyHandle }
	 *
	 * Throws BadRequestError if job already in database.
	 * */
	static async create({ title, salary, equity, companyHandle }) {
		const duplicateCheck = await db.query(
			`SELECT title
            FROM jobs
            WHERE title = $1`,
			[title]
		);
		if (duplicateCheck.rows[0])
			throw new BadRequestError(`Duplicate job: ${title}`);
		// if the companyHandle is not in the companies table, throw an error
		const companyCheck = await db.query(
			`SELECT handle
			FROM companies
			WHERE handle = $1`,
			[companyHandle]
		);
		if (!companyCheck.rows[0])
			throw new BadRequestError(`Company does not exist: ${companyHandle}`);

		const result = await db.query(
			`INSERT INTO jobs
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
			[title, salary, equity, companyHandle]
		);
		const job = result.rows[0];
		return job;
	}

	/**SECTION
	 * Find all jobs.
	 *
	 * RETURNS [{ id, title, salary, equity, companyHandle }, ...]
	 */

	static async findAll() {
		const jobsRes = await db.query(
			`SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
            FROM jobs
            ORDER BY title`
		);
		return jobsRes.rows;
	}

	/**SECTION
	 * Given a job id, return data about job.
	 *
	 * Returns { id, title, salary, equity, companyHandle }
	 *  where companyHandle is [{ handle, name, description, numEmployees, logoUrl }, ...]
	 *
	 * Throws NotFoundError if not found.
	 * */
	static async get(id) {
		const jobRes = await db.query(
			`SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`,
			[id]
		);
		const job = jobRes.rows[0];
		if (!job) throw new NotFoundError(`No job: ${id}`);

		const companyRes = await db.query(
			`SELECT handle,
					name,
					description,
					num_employees AS "numEmployees",
					logo_url AS "logoUrl"
			FROM companies
			WHERE handle = $1`,
			[job.companyHandle]
		);
		delete job.companyHandle;  //if not removed data will be duplicated
		job.company = companyRes.rows[0];
		return job;
	}

	/**SECTION
	 * Update job data with `data`.
	 *
	 * This is a "partial update" --- it's fine if data doesn't contain all the
	 * fields; this only changes provided ones.
	 *
	 * Data can include: { title, salary, equity }
	 *
	 * Returns { id, title, salary, equity, companyHandle }
	 *
	 * Throws NotFoundError if not found.
	 * */
	static async update(id, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {
			companyHandle: "company_handle",
		});
		const idVarIdx = "$" + (values.length + 1);
		const querySql = `UPDATE jobs
                        SET ${setCols}
                        WHERE id = ${idVarIdx}
                        RETURNING id,
                                  title,
                                  salary,
                                  equity,
                                  company_handle AS "companyHandle"`;
		const result = await db.query(querySql, [...values, id]);
		const job = result.rows[0];
		if (!job) throw new NotFoundError(`No job: ${id}`);
		return job;
	}

	/**SECTION
	 * Delete given job from database; returns undefined.
	 *
	 * Throws NotFoundError if job not found.
	 * */
	static async remove(id) {
		const result = await db.query(
			`DELETE
            FROM jobs
            WHERE id = $1
            RETURNING id`,
			[id]
		);
		const job = result.rows[0];
		if (!job) throw new NotFoundError(`No job: ${id}`);
	}

	/**SECTION
	 * Filter jobs by title, minSalary, and hasEquity.
	 *
	 * Returns [{ id, title, salary, equity, companyHandle }, ...]
	 *
	 * Throws BadRequestError if no matching jobs found.
	 * */

	static async filter({ title, minSalary, hasEquity }) {
		let query = `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
                FROM jobs
                WHERE 1=1`;
		let queryValues = [];
		if (title !== undefined) {
			query += ` AND title ILIKE $${queryValues.length + 1}`;
			queryValues.push(`%${title}%`);
		}
		if (minSalary !== undefined) {
			query += ` AND salary >= $${queryValues.length + 1}`;
			queryValues.push(minSalary);
		}
		if (hasEquity === true) {
			query += ` AND equity > 0`;
			queryValues.push(hasEquity);
		}
		const jobsRes = await db.query(query, queryValues);
		// error handling
		if (jobsRes.rows.length === 0) {
			throw new BadRequestError(`No jobs found`);
		}
		if (!jobsRes) throw new NotFoundError(`No jobs found`);
		if (minSalary > jobsRes.rows.salary) {
			throw new BadRequestError(`No jobs found meeting minimum salary`);
		}
		return jobsRes.rows;
	}
}
module.exports = Job;
