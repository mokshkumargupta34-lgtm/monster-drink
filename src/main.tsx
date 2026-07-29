import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  // basename follows Vite's base, so the same build works at the domain root in
  // dev and under /monster-drink/ on GitHub Pages.
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <App/>
  </BrowserRouter>,
);
