import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { installDemoApiMock } from "./lib/demoApi";
import "./index.css";

installDemoApiMock();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  });
}

createRoot(document.getElementById("root")!).render(<App />);
