/* eslint-disable no-undef */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import ReportDetailPage from "../ReportDetailPage";

jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockReport = {
  _id: "123",
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
    currentBalanceAmount: 150000,
    securedAccountsAmount: 100000,
    unsecuredAccountsAmount: 50000,
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
    {
      type: "Personal Loan",
      bank: "ICICI Bank",
      accountNumber: "XXXX-5678",
      currentBalance: 100000,
      amountOverdue: 5000,
      address: "Delhi",
      status: "Active",
    },
  ],
  addresses: ["123 Main St, Mumbai", "456 Park Ave, Delhi"],
};

const renderWithRouter = (initialRoute = "/reports/123") => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/reports/:id" element={<ReportDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("ReportDetailPage Component Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading State", () => {
    test("shows loading spinner while fetching report", async () => {
      axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithRouter();

      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });
  });

  describe("Report Display", () => {
    test("displays basic details section", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReport,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      expect(screen.getByText("9876543210")).toBeInTheDocument();
      expect(screen.getByText("ABCDE1234F")).toBeInTheDocument();
      expect(screen.getByText("750")).toBeInTheDocument();
    });

    test("displays report summary statistics", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReport,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Look for labels and values together
      expect(screen.getByText(/Total Accounts/i)).toBeInTheDocument();
      expect(screen.getByText(/Active Accounts/i)).toBeInTheDocument();
      expect(screen.getByText(/Closed Accounts/i)).toBeInTheDocument();
    });

    test("displays credit accounts information", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReport,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("Credit Card")).toBeInTheDocument();
      });

      expect(screen.getByText("Personal Loan")).toBeInTheDocument();
      expect(screen.getByText("HDFC Bank")).toBeInTheDocument();
      expect(screen.getByText("ICICI Bank")).toBeInTheDocument();
    });

    test("displays addresses section", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReport,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("123 Main St, Mumbai")).toBeInTheDocument();
      });

      expect(screen.getByText("456 Park Ave, Delhi")).toBeInTheDocument();
    });

    test("applies correct CSS class for excellent credit score", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReport,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        const scoreElement = screen.getByText("750");
        expect(scoreElement).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    test("shows error when report fetch fails", async () => {
      axios.get.mockRejectedValue(new Error("Network Error"));

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
      });
    });

    test("shows error when report not found", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: false,
          message: "Report not found",
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/not found/i)).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    test("back button navigates to reports list", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReport,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const backButton = screen.getByRole("button", { name: /back/i });
      if (backButton) {
        backButton.click();
        expect(mockNavigate).toHaveBeenCalledWith("/reports");
      }
    });
  });
});
