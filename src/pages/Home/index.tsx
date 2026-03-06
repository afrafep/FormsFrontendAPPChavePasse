import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CHAVE_TOKEN,
  MOCK_CPF,
  fetchMosiaUserByChavePasse,
  formsUrl,
  getBearerHeaders,
  getChaveUnica,
} from "../../services/api";
import {
  BsClipboard2Data,
  BsFillCheckCircleFill,
  BsFillPersonFill,
  BsFillTrashFill,
} from "react-icons/bs";

const BeneficiaryDashboard = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const chavePasse = queryParams.get("chavePasse") || "";

  const [beneficiaryName, setBeneficiaryName] = useState("Beneficiário");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [tipoDependente, setTipoDependente] = useState("");
  const [planoInterno, setPlanoInterno] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const isDevEnvironment =
    (process.env.REACT_APP_ENVIRONMENT || "").toLowerCase() === "dev";

  useEffect(() => {
    const fetchBeneficiaryData = async () => {
      try {
        let mosiaResult: any = null;
        let chaveUnica = "";

        if (isDevEnvironment && chavePasse && !MOCK_CPF) {
          try {
            mosiaResult = await fetchMosiaUserByChavePasse(chavePasse);
            chaveUnica = mosiaResult?.data?.chaveUnica || "";
          } catch (error: any) {
            mosiaResult = {
              error:
                error?.response?.data ||
                error?.message ||
                "Erro ao consultar Mosia",
            };
          }
        }

        if (!chaveUnica) {
          chaveUnica = await getChaveUnica(chavePasse, {
            preferCache: true,
            allowFetch: true,
          });
        }

        if (isDevEnvironment) {
          setDebugInfo({
            chavePasseFromUrl: chavePasse || "",
            chaveUnicaUsed: chaveUnica || "",
            token: CHAVE_TOKEN || "",
            mockCpf: MOCK_CPF || "",
            mosiaResult:
              mosiaResult ??
              (MOCK_CPF
                ? { info: "Mock ativo: consulta Mosia nao executada." }
                : null),
          });
        }

        if (!chaveUnica) {
          throw new Error("Chave unica nao encontrada.");
        }

        const secondResponse = await axios.get(
          formsUrl(`/reciprocidade/beneficiarios/${chaveUnica}`),
          {
            headers: getBearerHeaders(CHAVE_TOKEN),
          }
        );

        const beneficiaryData = secondResponse.data?.data;
        if (!beneficiaryData) {
          throw new Error("Nenhum dado valido recebido.");
        }

        setBeneficiaryName(beneficiaryData.nome || "Beneficiário");
        setTipoDependente(beneficiaryData.tipoDependente || "");
        setPlanoInterno(beneficiaryData.planoInterno || null);
        localStorage.setItem(
          "afrafep_beneficiary_name",
          beneficiaryData.nome || "Beneficiário"
        );
      } catch (error) {
        console.error("Erro ao buscar dados do beneficiário:", error);
        setLoginError(
          "Erro ao buscar dados do beneficiário. Por favor, tente novamente."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchBeneficiaryData();
  }, [chavePasse, isDevEnvironment]);

  const options = [
    {
      path: `/Reciprocidade/?chavePasse=${chavePasse}`,
      label: "Reciprocidade",
      icon: <BsFillCheckCircleFill size={24} />,
    },
    {
      path: `/Adesao/?chavePasse=${chavePasse}`,
      label: "Adesão",
      icon: <BsFillPersonFill size={24} />,
    },
    {
      path: `/Exclusao/?chavePasse=${chavePasse}`,
      label: "Exclusão",
      icon: <BsFillTrashFill size={24} />,
    },
    {
      path: `/Solicitacoes/?chavePasse=${chavePasse}`,
      label: "Acompanhar solicitações",
      icon: <BsClipboard2Data size={24} color="white" />,
      buttonClass: "bg-green-500",
    },
  ];

  const isTitularPlus = tipoDependente === "TITULAR" && planoInterno === 60;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white-900 to-white text-white px-4 sm:px-8">
      {isLoading ? (
        <motion.div
          className="text-lg font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          Carregando...
        </motion.div>
      ) : loginError ? (
        <motion.div
          className="text-lg font-bold text-red-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {loginError}
        </motion.div>
      ) : (
        <>
          <motion.div
            className="text-center"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-2xl sm:text-3xl font-extrabold text-black">
              Olá, {beneficiaryName}!
            </h1>
          </motion.div>

          {isDevEnvironment && (
            <div className="w-full max-w-4xl mt-6 p-4 rounded-lg border border-yellow-500 bg-yellow-50 text-black text-left">
              <h3 className="font-bold mb-2">Debug Home (ambiente DEV)</h3>
              <p>
                <b>chavePasse (URL):</b> {debugInfo?.chavePasseFromUrl || "(vazio)"}
              </p>
              <p>
                <b>chaveUnica usada:</b> {debugInfo?.chaveUnicaUsed || "(vazio)"}
              </p>
              <p>
                <b>mockCpf:</b> {debugInfo?.mockCpf || "(vazio)"}
              </p>
              <p className="break-all">
                <b>token:</b> {debugInfo?.token || "(vazio)"}
              </p>
              <p className="mt-2">
                <b>resultado Mosia:</b>
              </p>
              <pre className="bg-white p-2 rounded border text-xs overflow-auto max-h-72">
                {JSON.stringify(debugInfo?.mosiaResult, null, 2)}
              </pre>
            </div>
          )}

          {isTitularPlus ? (
            <>
              <motion.div
                className="text-center mt-10"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-3xl sm:text-2xl font-semibold text-gray-300">
                  O que você gostaria de fazer hoje?
                </h2>
              </motion.div>

              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                {options.map((option, index) => (
                  <Link
                    key={index}
                    to={option.path}
                    className={`flex items-center justify-center px-6 py-4 font-bold rounded-lg shadow-lg transform transition duration-500 hover:scale-105 ${option.buttonClass || "bg-blue-500"}`}
                  >
                    <span className="mr-2">{option.icon}</span>
                    {option.label}
                  </Link>
                ))}
              </motion.div>
            </>
          ) : (
            <motion.div
              className="mt-10 w-full max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-white border border-red-400 text-red-700 px-6 py-5 rounded-2xl shadow-lg flex flex-col items-center text-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L4.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <p className="text-gray-700 text-base leading-relaxed">
                  Este serviço é <span className="font-semibold text-red-700">exclusivo</span>{" "}
                  para os <span className="font-bold text-blue-700">titulares</span> do plano{" "}
                  <span className="font-bold text-red-700">Afrafep Saúde Plus</span>.
                </p>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default BeneficiaryDashboard;
