const mongoose = require("mongoose");
const CreditReport = require("../../models/CreditReport");

const MONGODB_TEST_URI = "mongodb://localhost:27017/creditsea-test-models";

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

afterEach(async () => {
  await CreditReport.deleteMany({});
});

describe("CreditReport Model Unit Tests", () => {
  const validReportData = {
    basicDetails: {
      name: "John Doe",
      mobilePhone: "9876543210",
      pan: "ABCDE1234F",
      creditScore: 750,
    },
    reportSummary: {
      totalAccounts: 3,
      activeAccounts: 2,
      closedAccounts: 1,
      currentBalanceAmount: 100000,
      securedAccountsAmount: 60000,
      unsecuredAccountsAmount: 40000,
      last7DaysEnquiries: 2,
    },
    creditAccounts: [
      {
        type: "Credit Card",
        bank: "HDFC Bank",
        accountNumber: "XXXX-1234",
        currentBalance: 50000,
        amountOverdue: 0,
        address: "Mumbai",
        status: "Active",
      },
    ],
    addresses: ["123 Main St, Mumbai", "456 Park Ave, Delhi"],
    fileName: "test-report.xml",
  };

  describe("Model Creation", () => {
    test("should create a valid credit report with all fields", async () => {
      const report = new CreditReport(validReportData);
      const savedReport = await report.save();

      expect(savedReport._id).toBeDefined();
      expect(savedReport.basicDetails.name).toBe("John Doe");
      expect(savedReport.basicDetails.creditScore).toBe(750);
      expect(savedReport.creditAccounts.length).toBe(1);
      expect(savedReport.addresses.length).toBe(2);
      expect(savedReport.uploadedAt).toBeDefined();
      expect(savedReport.createdAt).toBeDefined();
      expect(savedReport.updatedAt).toBeDefined();
    });

    test("should create report with minimal required fields", async () => {
      const minimalReport = {
        basicDetails: {
          name: "Jane Doe",
          creditScore: 650,
        },
        reportSummary: {
          totalAccounts: 0,
          activeAccounts: 0,
          closedAccounts: 0,
          currentBalanceAmount: 0,
          securedAccountsAmount: 0,
          unsecuredAccountsAmount: 0,
          last7DaysEnquiries: 0,
        },
        creditAccounts: [],
        addresses: [],
      };

      const report = new CreditReport(minimalReport);
      const savedReport = await report.save();

      expect(savedReport._id).toBeDefined();
      expect(savedReport.basicDetails.name).toBe("Jane Doe");
      expect(savedReport.creditAccounts).toEqual([]);
    });

    test("should handle multiple credit accounts", async () => {
      const multiAccountData = {
        ...validReportData,
        creditAccounts: [
          {
            type: "Credit Card",
            bank: "HDFC",
            accountNumber: "CC-001",
            currentBalance: 25000,
            amountOverdue: 0,
            status: "Active",
          },
          {
            type: "Personal Loan",
            bank: "ICICI",
            accountNumber: "PL-002",
            currentBalance: 75000,
            amountOverdue: 5000,
            status: "Active",
          },
          {
            type: "Auto Loan",
            bank: "SBI",
            accountNumber: "AL-003",
            currentBalance: 50000,
            amountOverdue: 0,
            status: "Active",
          },
        ],
      };

      const report = new CreditReport(multiAccountData);
      const savedReport = await report.save();

      expect(savedReport.creditAccounts.length).toBe(3);
      expect(savedReport.creditAccounts[0].type).toBe("Credit Card");
      expect(savedReport.creditAccounts[1].type).toBe("Personal Loan");
      expect(savedReport.creditAccounts[2].type).toBe("Auto Loan");
    });
  });

  describe("Timestamps", () => {
    test("should auto-generate timestamps on creation", async () => {
      const report = new CreditReport(validReportData);
      const savedReport = await report.save();

      expect(savedReport.createdAt).toBeInstanceOf(Date);
      expect(savedReport.updatedAt).toBeInstanceOf(Date);
      expect(savedReport.uploadedAt).toBeInstanceOf(Date);
    });

    test("should update updatedAt on modification", async () => {
      const report = new CreditReport(validReportData);
      const savedReport = await report.save();
      const originalUpdatedAt = savedReport.updatedAt;

      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 100));

      savedReport.basicDetails.name = "Updated Name";
      const updatedReport = await savedReport.save();

      expect(updatedReport.basicDetails.name).toBe("Updated Name");
      expect(updatedReport.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe("Queries", () => {
    test("should find reports by credit score range", async () => {
      await CreditReport.create([
        {
          ...validReportData,
          basicDetails: {
            ...validReportData.basicDetails,
            name: "User 1",
            creditScore: 800,
          },
        },
        {
          ...validReportData,
          basicDetails: {
            ...validReportData.basicDetails,
            name: "User 2",
            creditScore: 650,
          },
        },
        {
          ...validReportData,
          basicDetails: {
            ...validReportData.basicDetails,
            name: "User 3",
            creditScore: 750,
          },
        },
      ]);

      const highScoreReports = await CreditReport.find({
        "basicDetails.creditScore": { $gte: 750 },
      });

      expect(highScoreReports.length).toBe(2);
    });

    test("should find reports by name", async () => {
      await CreditReport.create(validReportData);

      const found = await CreditReport.findOne({
        "basicDetails.name": "John Doe",
      });

      expect(found).toBeDefined();
      expect(found.basicDetails.name).toBe("John Doe");
    });

    test("should sort reports by uploadedAt descending", async () => {
      const report1 = await CreditReport.create({
        ...validReportData,
        basicDetails: { ...validReportData.basicDetails, name: "First" },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const report2 = await CreditReport.create({
        ...validReportData,
        basicDetails: { ...validReportData.basicDetails, name: "Second" },
      });

      const reports = await CreditReport.find().sort({ uploadedAt: -1 });

      expect(reports[0].basicDetails.name).toBe("Second");
      expect(reports[1].basicDetails.name).toBe("First");
    });
  });

  describe("Validation", () => {
    test("should accept report without fileName", async () => {
      const dataWithoutFileName = { ...validReportData };
      delete dataWithoutFileName.fileName;

      const report = new CreditReport(dataWithoutFileName);
      const savedReport = await report.save();

      expect(savedReport._id).toBeDefined();
    });

    test("should handle empty arrays", async () => {
      const dataWithEmptyArrays = {
        ...validReportData,
        creditAccounts: [],
        addresses: [],
      };

      const report = new CreditReport(dataWithEmptyArrays);
      const savedReport = await report.save();

      expect(savedReport.creditAccounts).toEqual([]);
      expect(savedReport.addresses).toEqual([]);
    });
  });

  describe("Updates and Deletions", () => {
    test("should update specific fields", async () => {
      const report = new CreditReport(validReportData);
      const savedReport = await report.save();

      savedReport.basicDetails.creditScore = 800;
      const updatedReport = await savedReport.save();

      expect(updatedReport.basicDetails.creditScore).toBe(800);
    });

    test("should delete report by ID", async () => {
      const report = new CreditReport(validReportData);
      const savedReport = await report.save();
      const reportId = savedReport._id;

      await CreditReport.findByIdAndDelete(reportId);

      const found = await CreditReport.findById(reportId);
      expect(found).toBeNull();
    });

    test("should count total documents", async () => {
      await CreditReport.create(validReportData);
      await CreditReport.create({
        ...validReportData,
        basicDetails: { ...validReportData.basicDetails, name: "Another User" },
      });

      const count = await CreditReport.countDocuments();
      expect(count).toBe(2);
    });
  });
});
