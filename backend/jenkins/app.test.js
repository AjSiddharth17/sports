const request = require("supertest");
const app = require("../server");

describe("GET /api/health", () => {
  it("should return 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
  });
});
it("should fail if event name is missing", async () => {
  const res = await request(app)
    .post("/api/events")
    .send({});

  expect(res.statusCode).toBe(400);
});