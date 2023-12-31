// routes for jobs
const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");
const Job = require("../models/job");
const { ensureAdmin } = require("../middleware/auth");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");
const db = require("../db");
const router = express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login
 * */
router.post("/", ensureAdmin, async function (req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, jobNewSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}
		// if the user is not an admin, throw an error
		if (!res.locals.user.isAdmin) {
			throw new BadRequestError("Only admins can create jobs");
		}
		const job = await Job.create(req.body);
		return res.status(201).json({ job });
	} catch (err) {
		return next(err);
	}
});

// /** GET /  =>
//  *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
//  *
//  * Can filter on provided search filters:
//  * - minSalary
//  * - hasEquity (true returns only jobs with equity > 0, other values ignored)
//  * - title (will find case-insensitive, partial matches)
//  *
//  * Authorization required: none
//  */
router.get("/", async function (req, res, next) {
	try {
		const { title, minSalary, hasEquity } = req.query;
		const validator = jsonschema.validate(req.query, jobSearchSchema);
		if (req.query) {
			const jobs = await Job.filter(req.query);
			return res.json({ jobs });
		} else {
			const jobs = await Job.findAll(req.query);
			return res.json({ jobs });
		}
	} catch (error) {
		return next(error);
	}
});

/** GET /[id]  =>  { job }
 *
 * Job is { id, title, salary, equity, company }
 *  where company is { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: none
 * */
router.get("/:id", async function (req, res, next) {
	try {
		const job = await Job.get(req.params.id);
		return res.json({ job });
	} catch (error) {
		return next(error);
	}
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login
 * */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, jobUpdateSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}
		// if the user is not an admin, throw an error
		if (!res.locals.user.isAdmin) {
			throw new BadRequestError("Only admins can update jobs");
		}
		const job = await Job.update(req.params.id, req.body);
		return res.json({ job });
	} catch (error) {
		return next(error);
	}
});

router.delete("/:id", ensureAdmin, async function (req, res, next) {
	try {
		// if the user is not an admin, throw an error
		if (!res.locals.user.isAdmin) {
			throw new BadRequestError("Only admins can delete jobs");
		}
		await Job.delete(req.params.id);
		return res.json({ deleted: req.params.id });
	} catch (error) {
		return next(error);
	}
});

module.exports = router;
