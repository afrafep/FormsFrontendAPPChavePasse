import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../../components/Footer/Rodape";
import Menu from "../../components/Menu/Menu";
import { motion } from "framer-motion";
import "@react-pdf-viewer/core/lib/styles/index.css";
import {
  FaHourglassHalf,
  FaCheckCircle,
  FaExclamationTriangle,
  FaQuestionCircle,
  FaPhoneAlt,
  FaRegSadTear,
  FaCalendarAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";
import ReactPaginate from "react-paginate";
import {
  CHAVE_TOKEN,
  MOCK_CPF,
  formsUrl,
  getBearerHeaders,
  getChaveUnica,
} from "../../services/api";

function App() {
  const navigate = useNavigate();
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [loginError, setLoginError] = useState("");
  const [dataResponses, setDataResponses] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(5);
  const [cpfAlvo, setCpfAlvo] = useState("");

  const queryParams = new URLSearchParams(window.location.search);
  const chavePasse = queryParams.get("chavePasse") || "";

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return "Não informado";
    const dateAdded = new Date(dateString);
    return !isNaN(dateAdded.getTime())
      ? dateAdded.toLocaleString("pt-BR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "Data não disponível";
  };

  // Função para formatar apenas a data (sem hora)
  const formatDateOnly = (dateString) => {
    if (!dateString) return "Não informado";
    const date = new Date(dateString);
    return !isNaN(date.getTime())
      ? date.toLocaleDateString("pt-BR")
      : "Data não disponível";
  };

  // Função para obter o ícone do status
  const getStatusIcon = (statusCode) => {
    switch (statusCode) {
      case 0:
        return <FaHourglassHalf className="text-yellow-500" />;
      case 1:
        return <FaCheckCircle className="text-green-500" />;
      case 2:
        return <FaExclamationTriangle  className="text-red-500" />;
      case 3:
        return <FaPhoneAlt className="text-blue-500" />;
      default:
        return <FaQuestionCircle className="text-gray-500" />;
    }
  };

  // Função para obter as classes de status
  const getStatusCardClasses = (status) => {
    switch (status) {
      case 0:
        return "bg-yellow-100 border-yellow-500";
      case 1:
        return "bg-green-100 border-green-500";
      case 2:
        return "bg-red-100 border-red-500";
      case 3:
        return "bg-blue-100 border-blue-500";
      default:
        return "bg-gray-100 border-gray-500";
    }
  };

  useEffect(() => {
    const fetchBeneficiaryData = async () => {
      try {
        if (!chavePasse && !MOCK_CPF) {
          setLoginError("Chave Passe não encontrada na URL.");
          return;
        }

        const chaveUnica = await getChaveUnica(chavePasse, {
          preferCache: true,
          allowFetch: true,
        });
        if (!chaveUnica) {
          setLoginError("Erro ao obter chave única do beneficiário.");
          return;
        }

        setCpfAlvo(chaveUnica);

        const urls = [
          "adesao-dependente",
          "reciprocidade",
          "dependente-reciprocidade",
          "exclusao-titulares",
          "exclusao-dependente",
        ].map((path) => formsUrl(`/solicitacoes/${path}/${chaveUnica}`));

        const responses = await Promise.all(
          urls.map((url) =>
            axios
              .get(url, { headers: getBearerHeaders(CHAVE_TOKEN) })
              .catch(() => null)
          )
        );

        const responseData = {};
        urls.forEach((url, index) => {
          responseData[url] = responses[index]?.data || {};
        });

        setDataResponses(responseData);
        setBeneficiaryName(
          localStorage.getItem("afrafep_beneficiary_name") || "Beneficiário"
        );
      } catch (error) {
        console.error("Erro ao buscar dados do beneficiário:", error);
        setLoginError("Erro ao buscar dados do beneficiário. Tente novamente.");
      }
    };

    fetchBeneficiaryData();
  }, [chavePasse]);

  const currentItems = () => {
    const allItems = Object.entries(dataResponses).flatMap(([key, data]) => {
      if (
        key.includes("reciprocidade") &&
        data?.data &&
        Array.isArray(data.data)
      ) {
        return data.data.filter((item) => item.NU_CPF === cpfAlvo);
      }
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    });

    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return allItems.slice(startIndex, endIndex);
  };

  const handlePageChange = (selectedPage) => {
    setCurrentPage(selectedPage.selected);
  };

  // Função para verificar se é uma solicitação de reciprocidade
  const isReciprocidade = (item) => {
    return item.UF_DESTINO || item.DT_INICIO || item.DT_FIM;
  };

  return (
    <>
      <Menu />
      <div className="container mx-auto flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 mt-[20px]">
        <Footer />
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-1xl sm:text-1xl font-bold text-center mb-1">
            Minhas solicitações de <br /> Adesão/Reciprocidade/Exclusão
          </h1>
        </motion.div>
        <ToastContainer />
        {loginError && <div className="text-red-500">{loginError}</div>}

        <div className="w-full max-w-lg">
          <h4 className="text-lg font-medium mt-4">Dados das Solicitações:</h4>
          <div className="mt-2">
            {currentItems().length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-[5rem] text-gray-500">
                <FaRegSadTear size={80} className="text-blue-400" />
                <p className="text-center mt-4 text-lg">
                  Infelizmente, ainda não tem solicitações para você neste
                  momento.
                </p>
              </div>
            ) : (
              <>
                {currentItems().map((item, i) => {
                  const formattedDate = formatDate(item.DATA_ADICAO);
                  const formattedDate2 = item.DATA_UPDATE
                    ? formatDate(item.DATA_UPDATE)
                    : "";

                  const status =
                    [
                      "Pendente",
                      "Concluído",
                      "Indeferido",
                      "Entrar em Contato",
                      "N/A",
                    ][item.STATUS] || "N/A";

                  return (
                    <div
                      key={i}
                      className={`mt-2 border rounded-lg ${getStatusCardClasses(
                        item.STATUS
                      )}`}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-center">
                          <p>
                            <strong>Protocolo:</strong>{" "}
                            {item.PROTOCOLO || "N/A"}
                          </p>
                          <div className="ml-auto text-3xl">
                            {getStatusIcon(item.STATUS)}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <strong>Status:</strong>
                          <span className="ml-1">{status}</span>
                        </div>
                        
                        <p className="mt-1">
                          <strong>Solicitado:</strong> {formattedDate}
                        </p>
                        
                        {formattedDate2 && formattedDate2.trim() !== "" && (
                          <p>
                            <strong>Resolvido:</strong> {formattedDate2}
                          </p>
                        )}

                        {/* Informações específicas para Reciprocidade */}
                        {isReciprocidade(item) && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <h5 className="font-semibold text-blue-800 mb-2 flex items-center">
                              <FaMapMarkerAlt className="mr-2" />
                              Informações da Reciprocidade
                            </h5>
                            
                            {item.UF_DESTINO && (
                              <p className="flex items-center text-sm">
                                <FaMapMarkerAlt className="text-blue-600 mr-2" />
                                <strong>Destino:</strong> 
                                <span className="ml-1">{item.UF_DESTINO}</span>
                              </p>
                            )}
                            
                            {(item.DT_INICIO || item.DT_FIM) && (
                              <div className="flex items-center text-sm mt-1">
                                <FaCalendarAlt className="text-blue-600 mr-2" />
                                <strong>Período:</strong>
                                <span className="ml-1">
                                  {item.DT_INICIO ? formatDateOnly(item.DT_INICIO) : "Não informado"}
                                  {" a "}
                                  {item.DT_FIM ? formatDateOnly(item.DT_FIM) : "Não informado"}
                                </span>
                              </div>
                            )}

                            {item.NM_BENEFICIARIO && (
                              <p className="text-sm mt-1">
                                <strong>Beneficiário:</strong> {item.NM_BENEFICIARIO}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                <div className="w-full overflow-x-auto mb-4">
                  <ReactPaginate
                    previousLabel={"← Anterior"}
                    nextLabel={"Próximo →"}
                    pageCount={Math.ceil(
                      Object.entries(dataResponses).flatMap(([key, data]) =>
                        Array.isArray(data) ? data : [data]
                      ).length / itemsPerPage
                    )}
                    onPageChange={handlePageChange}
                    containerClassName="flex flex-wrap md:flex-nowrap justify-center items-center mt-4 gap-2"
                    activeClassName="bg-blue-500 text-white text-sm px-2 py-1 rounded"
                    pageClassName="text-sm px-2 py-1 border border-gray-300 rounded hover:bg-gray-200 transition shrink-0"
                    previousClassName="text-sm px-2 py-1 border border-gray-300 rounded hover:bg-gray-200 transition shrink-0"
                    nextClassName="text-sm px-2 py-1 border border-gray-300 rounded hover:bg-gray-200 transition shrink-0"
                    disabledClassName="opacity-50 cursor-not-allowed"
                    pageRangeDisplayed={2}
                    marginPagesDisplayed={1}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;

