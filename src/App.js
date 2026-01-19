import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import Manufacturer from "./pages/Manufacturer";
import Seller from "./pages/Seller";
import Customer from "./pages/Customer";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Admin />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/services" element={<Services />} />
        <Route path="/manufacturer" element={<Manufacturer />} />
        <Route path="/seller" element={<Seller />} />
        <Route path="/customer" element={<Customer />} />
      </Routes>
    </Router>
  );
}

export default App;
