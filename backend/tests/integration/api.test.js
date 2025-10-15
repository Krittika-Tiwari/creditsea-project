const request = require("supertest");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Create Express app for testing
const express = require("express");
const cors = require("cors");
const uploadRoutes = require("../../routes/uploadRoutes");
const reportRoutes = require("../../routes/reportRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/upload", uploadRoutes);
app.use("/api/reports", reportRoutes);

const MONGODB_TEST_URI = "mongodb://localhost:27017/creditsea-test-api";

beforeAll(async () => {
  await mongoose.connect(MONGODB_TEST_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe("API Integration Tests", () => {
  describe("POST /api/upload", () => {
    test("should upload and process XML file successfully", async () => {
      const mockXML = `<?xml version="1.0" encoding="UTF-8"?>
        <CreditReport>
          <Applicant>
            <n>API Test User</n>
            <Telephone><Number>1234567890</Number></Telephone>
            <Identifier><PAN>TEST12345A</PAN></Identifier>
          </Applicant>
          <Score><Value>720</Value></Score>
          <Accounts>
            <Account>
              <AccountType>Credit Card</AccountType>
              <Institution>Test Bank</Institution>
              <AccountNumber>TEST123</AccountNumber>
              <Status>Active</Status>
              <CurrentBalance>25000</CurrentBalance>
              <AmountOverdue>0</AmountOverdue>
            </Account>
          </Accounts>
        </CreditReport>`;

      const testFilePath = path.join(__dirname, "test-upload.xml");
      fs.writeFileSync(testFilePath, mockXML);

      const response = await request(app)
        .post("/api/upload")
        .attach("xmlFile", testFilePath)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.reportId).toBeDefined();
      expect(response.body.data.basicDetails.name).toBe("API Test User");
      expect(response.body.data.basicDetails.creditScore).toBe(720);

      fs.unlinkSync(testFilePath);
    });

    test("should reject non-XML files", async () => {
      const txtFilePath = path.join(__dirname, "test.txt");
      fs.writeFileSync(txtFilePath, "This is a text file");

      await request(app)
        .post("/api/upload")
        .attach("xmlFile", txtFilePath)
        .expect(400);

      fs.unlinkSync(txtFilePath);
    });

    test("should return error when no file is uploaded", async () => {
      const response = await request(app).post("/api/upload").expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("No file uploaded");
    });
  });

  describe("GET /api/reports", () => {
    test("should retrieve all reports", async () => {
      const response = await request(app).get("/api/reports").expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /api/reports/:id and DELETE /api/reports/:id", () => {
    let reportId;

    beforeEach(async () => {
      const CreditReport = require("../../models/CreditReport");
      const report = new CreditReport({
        basicDetails: { name: "Test User", creditScore: 700 },
        reportSummary: {
          totalAccounts: 1,
          activeAccounts: 1,
          closedAccounts: 0,
          currentBalanceAmount: 50000,
          securedAccountsAmount: 0,
          unsecuredAccountsAmount: 50000,
          last7DaysEnquiries: 0,
        },
        creditAccounts: [],
        addresses: [],
      });
      const saved = await report.save();
      reportId = saved._id;
    });

    test("should retrieve report by ID", async () => {
      const response = await request(app)
        .get(`/api/reports/${reportId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.basicDetails.name).toBe("Test User");
    });

    test("should return 404 for non-existent report", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app).get(`/api/reports/${fakeId}`).expect(404);
    });

    test("should delete report successfully", async () => {
      await request(app).delete(`/api/reports/${reportId}`).expect(200);

      await request(app).get(`/api/reports/${reportId}`).expect(404);
    });
  });
});
