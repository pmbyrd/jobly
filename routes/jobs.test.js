"use strict";

const request = require("supertest");

const app = require("../app.js");

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	adminToken,
	u1Token,
    testJobIds,
} = require("./_testCommon");
const e = require("express");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("POST /jobs", function () {
	test("admin can create job", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send({
				title: "test",
				salary: 100,
				equity: 0.1,
				companyHandle: "c1",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			job: {
				id: expect.any(Number),
				title: "test",
				salary: 100,
				equity: "0.1",
				companyHandle: "c1",
			},
		});
	});
	test("non-admin cannot create job", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send({
				title: "test",
				salary: 100,
				equity: 0.1,
				companyHandle: "c1",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});
    test("unauth for anon", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "test",
                salary: 100,
                equity: 0.1,
                companyHandle: "c1",
            });
        expect(resp.statusCode).toEqual(500);
    });
    test("bad request if missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "test",
                salary: 100,
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
        });
});

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "j1",
                    salary: 100,
                    equity: "0.1",
                    companyHandle: "c1",
                },
                {
                    id: expect.any(Number),
                    title: "j2",
                    salary: 200,
                    equity: "0.2",
                    companyHandle: "c2",
                },
                {
                    id: expect.any(Number),
                    title: "j3",
                    salary: 300,
                    equity: "0.3",
                    companyHandle: "c3",
                },
            ],
        });
    });
});

describe("GET /jobs/:id", function () {
    // test job is not working plug in a dummy test job
    const job = {
        id: 1,
        title: "test",
        salary: 100,
        equity: "0.1",
        company: {
            handle: "c1",
            name: "C1",
            description: "Desc1",
            numEmployees: 1,
            logoUrl: "http://c1.img",
        }
    };
    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});