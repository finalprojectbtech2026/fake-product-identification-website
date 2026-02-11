import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Admin from "./pages/Admin";
import Manufacturer from "./pages/Manufacturer";
import Seller from "./pages/Seller";
import Customer from "./pages/Customer";
import Regulator from "./pages/Regulator";
import AuthModal from "./pages/AuthModal";
import ManufacturerDescription from "./pages/ManufacturerDescription";
import SellerDescription from "./pages/SellerDescription";
import RegulatorDescription from "./pages/RegulatorDescription";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Customer />} />

        <Route path="/manufacturer" element={<Manufacturer />} />
        <Route path="/seller" element={<Seller />} />
        <Route path="/customer" element={<Customer />} />
        <Route path="/scan" element={<Customer />} />
        <Route path="/regulator" element={<Regulator />} />

        <Route path="/role/manufacturer" element={<ManufacturerDescription />} />
        <Route path="/role/seller" element={<SellerDescription />} />
        <Route path="/role/regulator" element={<RegulatorDescription />} />

        <Route path="/auth" element={<AuthModal />} />
      </Routes>
    </Router>
  );
}

export default App;
