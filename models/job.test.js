"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("./job.js");
// import the common functions from _testCommon
beforeEach(async function () {
	await db.query("DELETE FROM jobs");
	await db.query("ALTER SEQUENCE jobs_id_seq RESTART WITH 1");
	await db.query(
		`INSERT INTO jobs (title, salary, equity, company_handle)
        VALUES ('test', 100, 0.1, 'c1')`
	);
});

afterAll(async function () {
	await db.end();
});

/************************************** create */
describe("create", function () {
	test("works", async function () {
		let job = await Job.create({
			title: "test2",
			salary: 200,
			equity: 0.2,
			companyHandle: "c1",
		});
		expect(job).toEqual({
			id: expect.any(Number),
			title: "test2",
			salary: 200,
			equity: "0.2",
			companyHandle: "c1",
		});
	});
	test("bad request with dupe", async function () {
		try {
			await Job.create({
				title: "test",
				salary: 100,
				equity: 0.1,
				companyHandle: "c1",
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
	test("bad request with no company", async function () {
		try {
			await Job.create({
				title: "test2",
				salary: 200,
				equity: 0.2,
				companyHandle: "notacompany",
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** findAll */
describe("findAll", function () {
	test("works", async function () {
		let jobs = await Job.findAll();
		expect(jobs).toEqual([
			{
				id: expect.any(Number),
				title: "test",
				salary: 100,
				equity: "0.1",
				companyHandle: "c1",
			},
		]);
	});
	test("fails with no jobs", async function () {
		try {
			await Job.findAll("notajob");
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeFalsy();
		}
	});
});

/************************************** get */
describe("get", function () {
	test("works", async function () {
		let job = await Job.get(1);
		expect(job).toEqual({
			id: 1,
			title: "test",
			salary: 100,
			equity: "0.1",
			companyHandle: "c1",
		});
	});
	test("fails with no job", async function () {
		try {
			await Job.get(0);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** update */
describe("update", function () {
	test("works", async function () {
		let job = await Job.update(1, {
			title: "test2",
			salary: 200,
			equity: 0.2,
			companyHandle: "c1",
		});
		expect(job).toEqual({
			id: 1,
			title: "test2",
			salary: 200,
			equity: "0.2",
			companyHandle: "c1",
		});
	});
	test("fails with no job", async function () {
		try {
			await Job.update(0, {
				title: "test2",
				salary: 200,
				equity: 0.2,
				companyHandle: "c1",
			});
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** remove */
describe("remove", function () {
	test("works", async function () {
		await Job.remove(1);
		const res = await db.query("SELECT id FROM jobs WHERE id=1");
		expect(res.rows.length).toEqual(0);
	});
	test("fails with no job", async function () {
		try {
			await Job.remove(0);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** filter */
describe("filter", function () {
	test("works", async function () {
		let jobs = await Job.filter({
			title: "test",
		});

		console.log("Jobs:", jobs);

		expect(jobs).toEqual([
			{
				id: expect.any(Number),
				title: "test",
				salary: 100,
				equity: "0.1",
				companyHandle: "c1",
			},
		]);
	});
	test("works with minSalary", async function () {
		let jobs = await Job.filter({
			minSalary: 100,
		});
		expect(jobs).toEqual([
			{
				id: expect.any(Number),
				title: "test",
				salary: 100,
				equity: "0.1",
				companyHandle: "c1",
			},
		]);
	});

    // failing test for minSalary
    test("fails with minSalary", async function () {
        try {
            await Job.filter({
                minSalary: 200,
            });
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});
