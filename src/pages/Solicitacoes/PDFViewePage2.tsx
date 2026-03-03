import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { useLocation, useNavigate } from "react-router-dom";

const PDFViewerPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pdfBase64 = location.state?.pdfBase64; // Usa "?.pdfBase64" para evitar erros

  if (!pdfBase64) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-red-500">
          Nenhum PDF encontrado. Certifique-se de que os dados foram enviados corretamente.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
     <h1 className="font-bold text-lg mb-4">Visualizar PDF</h1>

{/* Botão "Voltar" posicionado acima do conteúdo */}
<button
  onClick={() => navigate(-1)} // Volta para a página anterior
  className="self-right bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700 mb-4"
>
  ← Voltar
</button>
      <div className="overflow-hidden rounded-md shadow-md w-full max-w-4xl">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer fileUrl={pdfBase64} />
        </Worker>
      </div>
      <a
        href={pdfBase64}
        download="reciprocidade.pdf"
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Baixar PDF
      </a>   
    </div>
  );
};

export default PDFViewerPage;
