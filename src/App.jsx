import { useEffect, useState } from "react";
import axios from "axios";

export default function AppStore() {
  const [apps, setApps] = useState([]);
  const [installing, setInstalling] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/apps")
      .then(res => setApps(res.data))
      .catch(err => console.error(err));
  }, []);

  const installApp = (name) => {
    setInstalling(name);
    setMessage("");
    axios.post(`http://localhost:5000/install/${name}`)
      .then(res => {
        setMessage(`✅ ${name} installé avec succès.`);
      })
      .catch(err => {
        setMessage(`❌ Échec installation ${name}: ${err.response?.data?.error || err.message}`);
      })
      .finally(() => setInstalling(null));
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>App Store</h1>
      {apps.map(app => (
        <div key={app.name} style={{
          border: "1px solid #ccc",
          padding: 20,
          marginBottom: 20,
          borderRadius: 8
        }}>
          <img src={`http://localhost:5000${app.logo_url}`} alt={app.name} style={{ width: 100, height: 100 }} />
          <h2>{app.name}</h2>
          <p>{app.description}</p>
          <button onClick={() => installApp(app.name)} disabled={installing === app.name}>
            {installing === app.name ? "Installation…" : "Installer"}
          </button>
        </div>
      ))}
      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </div>
  );
}
