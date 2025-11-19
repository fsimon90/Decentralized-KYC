import { Routes, Route, Link } from "react-router-dom";
import CustomerPage from "./pages/CustomerPage";
import BankerView from "./pages/BankerView";

export default function App() {
  return (
    <div>
      {/* Simple Navbar */}
      <nav style={{ padding: "10px", background: "#eee" }}>
        <Link style={{ marginRight: "20px" }} to="/customer">Customer</Link>
        <Link to="/banker">Banker</Link>
      </nav>

      {/* Page Routes */}
      <Routes>
        <Route path="/" element={<CustomerPage />} />
        <Route path="/customer" element={<CustomerPage />} />
        <Route path="/banker" element={<BankerView />} />
      </Routes>
    </div>
  );
}
