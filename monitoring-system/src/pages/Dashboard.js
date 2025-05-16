import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

function Dashboard() {
  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [testMode, setTestMode] = useState(false);
  const [trapOpen, setTrapOpen] = useState(false);
  const [lastModified, setLastModified] = useState("");

  useEffect(() => {
    const tempRef = ref(db, "mesures/temperature");
    const humRef = ref(db, "mesures/humidite");
    const modeRef = ref(db, "mesures/mode_test");
    const trapRef = ref(db, "mesures/etat_trappe");
    const modRef = ref(db, "mesures/horodatage");

    const unsubTemp = onValue(tempRef, snap => {
      if (snap.exists()) setTemperature(snap.val());
    });

    const unsubHum = onValue(humRef, snap => {
      if (snap.exists()) setHumidity(snap.val());
    });

    const unsubMode = onValue(modeRef, snap => {
      if (snap.exists()) setTestMode(snap.val());
    });

    const unsubTrap = onValue(trapRef, snap => {
      if (snap.exists()) setTrapOpen(snap.val());
    });

    const unsubMod = onValue(modRef, snap => {
      if (snap.exists()) setLastModified(snap.val());
    });

    return () => {
      unsubTemp();
      unsubHum();
      unsubMode();
      unsubTrap();
      unsubMod();
    };
  }, []);

  const getArc = (value) => {
    const angle = (value / 100) * 180;
    const radians = (angle * Math.PI) / 180;
    const x = 100 + 100 * Math.cos(Math.PI - radians);
    const y = 100 - 100 * Math.sin(Math.PI - radians);
    return `M0,100 A100,100 0 0,1 ${x},${y}`;
  };

  return (
    <div className="dashboard-container">
      <div className="gauge-card">
        <h3>Température</h3>
        <svg viewBox="0 -20 200 120" className="gauge-svg">
          <path d="M0,100 A100,100 0 0,1 200,100" className="gauge-bg" />
          <path d={getArc(Math.min(temperature, 100))} className="gauge-fill temp" />
        </svg>
        <div className="gauge-label">{temperature.toFixed(1)}°C</div>
      </div>

      <div className="gauge-card">
        <h3>Humidité</h3>
        <svg viewBox="0 -20 200 120" className="gauge-svg">
          <path d="M0,100 A100,100 0 0,1 200,100" className="gauge-bg" />
          <path d={getArc(Math.min(humidity, 100))} className="gauge-fill humidity" />
        </svg>
        <div className="gauge-label">{humidity.toFixed(1)}%</div>
      </div>

      <div className="gauge-card test-toggle">
        <h3>Mode Test</h3>
        <span className={`test-indicator ${testMode ? 'on' : 'off'}`}>
          {testMode ? 'ON' : 'OFF'}
        </span>

        <div className="dashboard-details">
          <p>
            <span className="label">Trappe :</span> {trapOpen ? 'Ouverte' : 'Fermée'}
          </p>
          <p>
            <span className="label">Dernière modification :</span><br />
            {lastModified
              ? new Date(lastModified).toLocaleString('fr-CA', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : '–'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
