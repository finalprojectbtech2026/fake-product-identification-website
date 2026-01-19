import React from 'react';
import Navbar from './Navbar';
import './Design.css';
import SideBar from './Sidebar';
import Editor from './Editor';
import CostEstimator from './CostEstimator';

function Design() {
  return (
    <div className="design-page">
        <Navbar />

      <div className="design-main">
        <SideBar />
        <Editor />
      </div>

      <CostEstimator />
    </div>
  );
}

export default Design;
