import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DailyPage } from "./pages/DailyPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NotesPage } from "./pages/NotesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { WakatimePage } from "./pages/WakatimePage";
import { SettingsProvider } from "./SettingsContext";

function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/daily" element={<DailyPage />} />
            <Route path="/notas" element={<NotesPage />} />
            <Route path="/wakatime" element={<WakatimePage />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}

export default App;
