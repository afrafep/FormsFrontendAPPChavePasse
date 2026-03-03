import { Routes, Route } from "react-router-dom";
import Reciprocity from "../pages/Reciprocity";
import Exclusion from "../pages/Exclusion";
import Adesion from "../pages/Adesion";
import Home from "../pages/Home";
import PDFViewerPage from "../pages/Reciprocity/PDFViewePage";
import PDFViewerPage2 from "../pages/Reciprocity/PDFViewePage";
import Cookies from "js-cookie";

import Solicitacoes from "../pages/Solicitacoes";

export const Initial = () => {
  const isAuthenticated = !!Cookies.get("Frontend"); // Aqui você pode ajustar conforme sua lógica de autenticação

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Rotas privadas protegidas */}
      <Route path="/Reciprocidade" element={<Reciprocity />} />
      <Route path="/pdf-viewer" element={<PDFViewerPage />} />
      <Route path="/pdf-viewer2" element={<PDFViewerPage2 />} />

      <Route path="/Exclusao" element={<Exclusion />} />
      <Route path="/Adesao" element={<Adesion />} />
      <Route path="/Solicitacoes" element={<Solicitacoes />} />
    </Routes>
  );
};
