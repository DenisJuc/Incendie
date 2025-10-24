import React from 'react';
import './MainControl.css';
import { db } from './../firebase';
import { ref, set } from 'firebase/database';

function MainControl({ temperature, setTemperature, testMode, setTestMode, humidity }) {
  const [trapOpen, setTrapOpen] = React.useState(false);
  const [alarmOn, setAlarmOn] = React.useState(false);

  const now = () => new Date().toISOString();

  const sendCommand = (path, action) => {
    set(ref(db, `commandes/${path}`), {
      action,
      horodatage: now(),
      execute: false
    });
  };

  const updateMesures = (newTemp) => {
    set(ref(db, "mesures"), {
      temperature: newTemp,
      humidite: humidity || 0,
      etat_trappe: trapOpen,
      mode_test: testMode,
      alerte_activee: newTemp >= 25,
      horodatage: now()
    });
  };

  const handleTestToggle = () => {
    const newMode = !testMode;
    setTestMode(newMode);
    sendCommand("mode", newMode ? "test" : "auto");
  };

  const handleTrappeOpen = () => {
    if (!testMode) return;
    setTrapOpen(true);
    sendCommand("trappe", "ouvrir");
    updateMesures(temperature);
  };

  const handleTrappeClose = () => {
    if (!testMode) return;
    setTrapOpen(false);
    sendCommand("trappe", "fermer");
    updateMesures(temperature);
  };

  const handleTempChange = (delta) => {
    if (!testMode) return;
    const newTemp = temperature + delta;
    setTemperature(newTemp);
    updateMesures(newTemp);
  };

  const handleAlarmToggle = () => {
    if (!testMode) return;
    const newAlarm = !alarmOn;
    setAlarmOn(newAlarm);
    sendCommand("alarme", newAlarm ? "activer" : "desactiver");
    updateMesures(temperature);
  };

  return (
    <div className="main-control">
      <h2>Système de Surveillance</h2>

      <p>Température :
        <span className="indicator temp">
          {typeof temperature === 'number' ? `${temperature.toFixed(1)}°C` : '...'}
        </span>
      </p>

      <p>État de la trappe :
        <span className={`indicator ${trapOpen ? 'open' : 'closed'}`}>
          {trapOpen ? 'Ouverte' : 'Fermée'}
        </span>
      </p>

      <p className="mode-test">
        Mode Test :
        <span className={testMode ? 'active' : 'inactive'}>
          {testMode ? ' Activé' : ' Désactivé'}
        </span>
      </p>

      <div className="switch-container">
        <label className="switch">
          <input
            type="checkbox"
            checked={testMode}
            onChange={handleTestToggle}
          />
          <span className="slider"></span>
        </label>
      </div>

      <div className="temp-control full-center">
        <div className="temp-group">
          <strong>Température :</strong>
          <div className="temp-btn-wrapper">
            <button
              className="temp-btn blue"
              onClick={() => handleTempChange(+1)}
              disabled={!testMode}
            >🔺</button>
            <button
              className="temp-btn blue"
              onClick={() => handleTempChange(-1)}
              disabled={!testMode}
            >🔻</button>
          </div>
        </div>
      </div>

      <div className="temp-control">
        <strong>Trappe :</strong>
        <div className="trap-btn-wrapper">
          <button
            className="btn trap-open"
            onClick={handleTrappeOpen}
            disabled={!testMode}
          >Ouvrir</button>
          <button
            className="btn trap-close"
            onClick={handleTrappeClose}
            disabled={!testMode}
          >Fermer</button>
        </div>
      </div>

      <div className="temp-control">
        <strong>Alarme :</strong>
        <div className="trap-btn-wrapper">
          <button
            className={`btn ${alarmOn ? 'trap-close' : 'trap-open'}`}
            onClick={handleAlarmToggle}
            disabled={!testMode}
          >
            {alarmOn ? "Désactiver" : "Activer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MainControl;
