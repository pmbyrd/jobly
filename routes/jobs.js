// routes for jobs
const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");
const Job = require("../models/jobs");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
