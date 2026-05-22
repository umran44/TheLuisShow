import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import './index.css';
import App from './App';
import ContestantDisplay from './Stackers';
import ChaserDisplay from './Chaser';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <Router>
    <Routes>
      <Route path="/host" element={<App />} />
      <Route path="/stackers" element={<ContestantDisplay />} />
      <Route path="/chaser" element={<ChaserDisplay />} />
    </Routes>

  </Router>
);

