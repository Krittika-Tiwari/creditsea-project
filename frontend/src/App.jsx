import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import UploadPage from "./pages/UploadPage";
import ReportsListPage from "./pages/ReportsListPage";
import ReportDetailPage from "./pages/ReportDetailPage";

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              <span className="logo-icon">💳</span>
              CreditSea
            </Link>
            <div className="nav-menu">
              <div className="nav-item">
                <Link to="/" >
                  <button className="nav-link">Upload</button>
                </Link>
              </div>
              <div className="nav-item">
                <Link to="/reports" >
                  <button className="nav-link">Reports</button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/reports" element={<ReportsListPage />} />
            <Route path="/reports/:id" element={<ReportDetailPage />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>© 202 CreditSea - Credit Report Management System</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
