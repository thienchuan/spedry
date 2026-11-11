import { useState } from "react";
import { Layout, type View } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { AgentVaults } from "./components/AgentVaults";
import { SpendHistory } from "./components/SpendHistory";
import { SettingsPage } from "./components/SettingsPage";

export default function App() {
  const [view, setView] = useState<View>("dashboard");

  const renderView = () => {
    switch (view) {
      case "dashboard": return <Dashboard onNavigate={setView} />;
      case "agents":    return <AgentVaults />;
      case "history":   return <SpendHistory />;
      case "settings":  return <SettingsPage />;
    }
  };

  return (
    <Layout view={view} onView={setView}>
      {renderView()}
    </Layout>
  );
}
