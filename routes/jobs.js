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
    const jobs = await Job.findAll(req.query);
    return res.json({ jobs });
    
});


module.exports = router;