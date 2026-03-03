import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles/global.css";
import { BrowserRouter } from "react-router-dom"; // Troque HashRouter por BrowserRouter

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter> {/* Troque HashRouter por BrowserRouter */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
