/* eslint-disable no-undef */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import ReportsListPage from "../ReportsListPage";

jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  Link: ({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("ReportsListPage Component Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReports = [
    {
      _id: "1",
      basicDetails: {
        name: "John Doe",
        creditScore: 750,
      },
      fileName: "report1.xml",
      uploadedAt: "2024-10-15T10:00:00.000Z",
    },
    {
      _id: "2",
      basicDetails: {
        name: "Jane Smith",
        creditScore: 680,
      },
      fileName: "report2.xml",
      uploadedAt: "2024-10-14T10:00:00.000Z",
    },
  ];

  describe("Loading State", () => {
    test("shows loading spinner while fetching reports", () => {
      axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithRouter(<ReportsListPage />);

      expect(screen.getByText(/Loading reports/i)).toBeInTheDocument();
    });
  });

  describe("Reports Display", () => {
    test("displays list of reports", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
          count: 2,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });
    });

    test("displays credit scores with correct styling", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        const score750 = screen.getByText("750");
        const score680 = screen.getByText("680");

        expect(score750).toHaveClass("excellent");
        expect(score680).toHaveClass("good");
      });
    });

    test("displays file names and upload dates", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("report1.xml")).toBeInTheDocument();
        expect(screen.getByText("report2.xml")).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    test("shows empty state when no reports exist", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: [],
          count: 0,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("No Reports Yet")).toBeInTheDocument();
        expect(
          screen.getByText(/Upload your first credit report/i)
        ).toBeInTheDocument();
      });
    });

    test("empty state has upload link", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: [],
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        const uploadLink = screen.getByText("Upload Report");
        expect(uploadLink).toBeInTheDocument();
        expect(uploadLink.closest("a")).toHaveAttribute("href", "/");
      });
    });
  });

  describe("Report Actions", () => {
    test("view details button links to report detail page", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText("View Details");
        expect(viewButtons[0].closest("a")).toHaveAttribute(
          "href",
          "/reports/1"
        );
      });
    });

    test("delete button opens confirmation modal", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByText("Delete Report")).toBeInTheDocument();
        expect(
          screen.getByText("Are you sure you want to delete this report?")
        ).toBeInTheDocument();
        expect(
          screen.getByText("This action cannot be undone.")
        ).toBeInTheDocument();
      });
    });

    test("modal shows correct report name", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Click delete button for first report
      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);

      // Modal should show John Doe's name
      await waitFor(() => {
        const nameElements = screen.getAllByText("John Doe");
        expect(nameElements.length).toBeGreaterThan(1); // One in card, one in modal
      });
    });

    test("cancel button closes modal", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Open modal
      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Delete Report")).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText("Delete Report")).not.toBeInTheDocument();
      });
    });

    test("clicking overlay closes modal", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Open modal
      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Delete Report")).toBeInTheDocument();
      });

      // Click overlay (parent of modal-content)
      const overlay = document.querySelector(".modal-overlay");
      fireEvent.click(overlay);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText("Delete Report")).not.toBeInTheDocument();
      });
    });

    test("successfully deletes report when confirmed", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      axios.delete.mockResolvedValue({
        data: {
          success: true,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Open modal
      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Delete Report")).toBeInTheDocument();
      });

      // Confirm delete - get the button inside the modal
      const confirmButton = document.querySelector(".confirm-delete-btn");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          expect.stringContaining("/api/reports/1")
        );
      });

      // John Doe should be removed from the list
      await waitFor(() => {
        expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
      });

      // Jane Smith should still be there
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    test("shows error message on delete failure", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      axios.delete.mockRejectedValue(new Error("Delete failed"));

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Open modal
      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Delete Report")).toBeInTheDocument();
      });

      // Confirm delete - get the button inside the modal
      const confirmButton = document.querySelector(".confirm-delete-btn");
      fireEvent.click(confirmButton);

      // Should show error in the component
      await waitFor(() => {
        expect(
          screen.getByText(/Failed to delete report/i)
        ).toBeInTheDocument();
      });
    });

    test("delete button shows loading state", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      axios.delete.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { success: true } }), 100)
          )
      );

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Open modal
      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Delete Report")).toBeInTheDocument();
      });

      // Confirm delete - get the button inside the modal
      const confirmButton = document.querySelector(".confirm-delete-btn");
      fireEvent.click(confirmButton);

      // Should show "Deleting..." text
      await waitFor(() => {
        expect(screen.getByText("Deleting...")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    test("shows error message when fetch fails", async () => {
      axios.get.mockRejectedValue(new Error("Network Error"));

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load reports/i)).toBeInTheDocument();
      });
    });
  });
});
