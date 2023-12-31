"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login
 **/

router.post("/", ensureLoggedIn, async function (req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, userNewSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const user = await User.register(req.body);
		const token = createToken(user);
		return res.status(201).json({ user, token });
	} catch (err) {
		return next(err);
	}
});

/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login
 **/

// NOTE changed ensureLoggedIn to ensureAdmin
router.get("/", ensureAdmin, async function (req, res, next) {
	try {
		const users = await User.findAll();
		return res.json({ users });
	} catch (err) {
		return next(err);
	}
});

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: login
 **/

router.get("/:username", ensureLoggedIn, async function (req, res, next) {
	try {
		const user = await User.get(req.params.username);
		console.log("res.locals.user", res.locals.user);
		// Check if the user is the current user or an admin
		if (user.username === res.locals.user.username || res.locals.user.isAdmin) {
			return res.json({ user });
		} else {
			throw new BadRequestError("Unauthorized access");
		}
	} catch (err) {
		return next(err);
	}
});

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login
 **/

router.patch("/:username", ensureLoggedIn, async function (req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, userUpdateSchema);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const user = await User.update(req.params.username, req.body);
		if (user.username === res.locals.user.username || res.locals.user.isAdmin) {
			return res.json({ user });
		} else {
			throw new BadRequestError("Unauthorized access");
		}
	} catch (err) {
		return next(err);
	}
});

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login
 *
 * NOTE should only be able to delete self or if admin
 **/

router.delete("/:username", ensureLoggedIn, async function (req, res, next) {
	try {
		// if not user or not admin, throw error
		if (!res.user || !res.locals.user.isAdmin) {
			await User.remove(req.params.username);
			return res.json({ deleted: req.params.username });
		} else {
			throw new BadRequestError("Unauthorized access");
		}
	} catch (err) {
		return next(err);
	}
});

// TODO: add a route to apply for a job
/**
 * Apply for job: update db, returns undefined.
 *
 * - username: username of user applying for job
 * - jobId: id of job
 *
 */
router.post(
	"/:username/jobs/:id",
	// ensureLoggedIn,
	async function (req, res, next) {
		try {
			const jobId = req.params.id;
			if (!res.user || !res.locals.user.isAdmin) {
				await User.apply(req.params.username, jobId);
				return res.json({ applied: jobId });
			}
		} catch (err) {
			return next(err);
		}
	}
);

module.exports = router;
