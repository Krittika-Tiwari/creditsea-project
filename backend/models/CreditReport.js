const mongoose = require("mongoose");

const creditAccountSchema = new mongoose.Schema({
  type: String,
  bank: String,
  accountNumber: String,
  currentBalance: Number,
  amountOverdue: Number,
  address: String,
  status: String,
});

const creditReportSchema = new mongoose.Schema(
  {
    // Basic Details
    basicDetails: {
      name: String,
      mobilePhone: String,
      pan: String,
      creditScore: Number,
    },

    // Report Summary
    reportSummary: {
      totalAccounts: Number,
      activeAccounts: Number,
      closedAccounts: Number,
      currentBalanceAmount: Number,
      securedAccountsAmount: Number,
      unsecuredAccountsAmount: Number,
      last7DaysEnquiries: Number,
    },

    // Credit Accounts
    creditAccounts: [creditAccountSchema],

    // Addresses
    addresses: [String],

    // Metadata
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    fileName: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CreditReport", creditReportSchema);
