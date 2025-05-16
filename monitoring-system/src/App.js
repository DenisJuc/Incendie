import './App.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MainControl from './pages/MainControl';
import Dashboard from './pages/Dashboard';

function App() {
  const [temperature, setTemperature] = useState(24.0);
  const [humidity, setHumidity] = useState(55.0); 
  const [testMode, setTestMode] = useState(true);

  return (
    <Router>
      <nav style={{ textAlign: 'center', padding: 10 }}>
        <Link to="/" style={{ marginRight: 20 }}>Control</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
      <Routes>
        <Route
          path="/"
          element={<MainControl
            temperature={temperature}
            setTemperature={setTemperature}
            humidity={humidity}
            setHumidity={setHumidity}
            testMode={testMode}
            setTestMode={setTestMode}
          />}
        />
        <Route
          path="/dashboard"
          element={<Dashboard
            temperature={temperature}
            humidity={humidity}
            testMode={testMode}
          />}
        />
      </Routes>
    </Router>
  );
}

export default App;
