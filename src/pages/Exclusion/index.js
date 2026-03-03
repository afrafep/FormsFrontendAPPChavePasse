import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { jsPDF } from "jspdf";
import logo from "../../images/afrafep.png";
import rodape from "../../images/afrafeprodape.png";
import InputMask from "react-input-mask";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../../components/Footer/Rodape";
import Menu from "../../components/Menu/Menu";
import { motion } from "framer-motion";
import "@react-pdf-viewer/core/lib/styles/index.css";
import Swal from "sweetalert2";

function App() {
  const navigate = useNavigate();

  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [code, setCode] = useState("");
  const [cpf, setCpf] = useState("");
  const [dependents, setDependents] = useState([]);
  const [hasDependents, setHasDependents] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [detalhe, setDetalhe] = useState(false);
  const [pdfBase64, setPdfBase64] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const chavePasse = queryParams.get("chavePasse") || "";

  const chaveFunc = "7a516ed5-1ae8-4980-abd4-f4c033027e26";
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlzIjoiY2hhdmVQYXNzZSIsImtleSI6IjVjZDg2OThhLTllNzYtNDIwYy04MTJiLTc1ODZiMmQ5OTc2NiIsImlhdCI6MTczMzc1MDc2NiwiZXhwIjozMzExNjMwNzY2LCJhdWQiOiJhbGwifQ.pnMRmFnTk685RBuf2kpsly7Pmxam5SjjFoePUMFL0cQ";

  // Fetch dos dados do beneficiário
  useEffect(() => {
    const fetchBeneficiaryData = async () => {
      try {
        const queryParams = new URLSearchParams(window.location.search);
        const chavePasse = queryParams.get("chavePasse") || "";

        if (!chavePasse) {
          console.error("Chave Passe não foi fornecida na URL.");
          setLoginError("Chave Passe não encontrada na URL.");
          return;
        }

        const response = await axios.get(
          `https://api.mosiaomnichannel.com.br/clientes/chavePasse/usuario`,
          {
            params: {
              chavePasse,
              chaveFuncionalidade: chaveFunc,
            },
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
          }
        );

        const chaveUnica = response.data?.data?.chaveUnica;

        if (!chaveUnica) {
          console.error("Chave Unica não encontrada na resposta.");
          setLoginError("Erro ao obter chave única do beneficiário.");
          return;
        }

        const titularResponse = await axios.get(
          `https://api.afrafepsaude.com.br/forms/reciprocidade/beneficiarios/${chaveUnica}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (titularResponse.data && titularResponse.data.data) {
          const {
            codigo: code = "",
            nome: beneficiaryName = "",
            matricula: registrationCode = "",
            cpf: titularCpf = "",
          } = titularResponse.data.data;

          setCode(code);
          setBeneficiaryName(beneficiaryName);
          setRegistrationCode(registrationCode);
          setCpf(titularCpf);

          const dependentesResponse = await axios.get(
            `https://api.afrafepsaude.com.br/forms/reciprocidade/beneficiarios/${chaveUnica}/dependentes`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (dependentesResponse.data && dependentesResponse.data.data) {
            const { dependentes = [] } = dependentesResponse.data.data;
            
            const hasDeps = dependentes.length > 0;
            
            const formattedDependents = dependentes.map((dependent) => ({
              nome: dependent.nome,
              cpf: dependent.cpf,
              codigo: dependent.codigo,
              cns: dependent.cns,
              nmMae: dependent.nmMae,
              dtNascimento: dependent.dtNascimento,
              nmBeneficiario_titular: beneficiaryName,
              nuCpf_titular: titularCpf,
              excluir: false
            }));
            
            setHasDependents(hasDeps);
            setDependents(formattedDependents);
          } else {
            setHasDependents(false);
            setDependents([]);
          }
        } else {
          throw new Error("No valid data received for titular");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do beneficiário:", error);
        setLoginError("Erro ao buscar dados do beneficiário. Tente novamente.");
      }
    };

    fetchBeneficiaryData();
  }, [chavePasse, chaveFunc, token]);

  const [isAllChecked, setIsAllChecked] = useState(false);
  const [excludeAll, setExcludeAll] = useState(false);
  const [excludeFinancialDependent, setExcludeFinancialDependent] = useState(false);

  // Função para alternar o status de exclusão de um dependente
  const toggleDependentExclusion = (index) => {
    setDependents(prevDependents => {
      const updated = [...prevDependents];
      updated[index] = {
        ...updated[index],
        excluir: !updated[index].excluir
      };
      return updated;
    });
    
    setIsAllChecked(false);
  };

  const handleCheckboxChange = () => {
    const newValue = !isAllChecked;
    setIsAllChecked(newValue);
    
    if (newValue) {
      setDependents(prevDependents => 
        prevDependents.map(dep => ({ ...dep, excluir: true }))
      );
    } else {
      setDependents(prevDependents => 
        prevDependents.map(dep => ({ ...dep, excluir: false }))
      );
    }
  };

  const handleExcludeFinancialDependentChange = () => {
    const newValue = !excludeFinancialDependent;
    setExcludeFinancialDependent(newValue);
    
    setIsAllChecked(false);
    setExcludeAll(false);
    
    if (newValue) {
      setDependents(prevDependents => 
        prevDependents.map(dep => ({ ...dep, excluir: false }))
      );
    }
  };

  const handleExcludeAllChange = () => {
    const newValue = !excludeAll;
    setExcludeAll(newValue);
    
    setIsAllChecked(false);
    setExcludeFinancialDependent(false);
    
    if (newValue) {
      setDependents(prevDependents => 
        prevDependents.map(dep => ({ ...dep, excluir: true }))
      );
    } else {
      setDependents(prevDependents => 
        prevDependents.map(dep => ({ ...dep, excluir: false }))
      );
    }
  };

  // Verifica se alguma opção de exclusão foi selecionada
  const hasExclusionSelected = () => {
    if (excludeAll || excludeFinancialDependent) {
      return true;
    }
    
    if (dependents.some(d => d.excluir)) {
      return true;
    }
    
    return false;
  };

  // Função para renderizar a seção de dependentes
  const renderDependentsSection = () => {
    if (dependents.length === 0) {
      return null;
    }

    const isDisabled = excludeAll || excludeFinancialDependent;
    const hasSelectedForExclusion = dependents.some(d => d.excluir);

    return (
      <div className="form-group mb-4">
        {/* Checkbox "Excluir todos os dependentes" */}
        {!excludeAll && !excludeFinancialDependent && dependents.length > 0 && (
          <motion.label
            className="flex items-center cursor-pointer mb-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <input
              type="checkbox"
              className="hidden"
              checked={isAllChecked}
              onChange={handleCheckboxChange}
            />
            <span
              className={`flex items-center justify-center w-6 h-6 border-2 
              ${isAllChecked ? "bg-black text-white border-black" : "bg-white border-black"}
              rounded transition-all duration-200 hover:border-gray-600 hover:shadow-lg`}
            >
              {isAllChecked && "✓"}
            </span>
            <span
              className="ml-2 text-black-800 bg-white rounded p-1 cursor-pointer"
              onClick={handleCheckboxChange}
            >
              Excluir todos os dependentes
            </span>
          </motion.label>
        )}

        {/* Mensagens informativas */}
        {excludeAll && (
          <div className="mb-3 p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
            <span className="font-semibold">⚠️ Exclusão total do titular e todos os dependentes</span>
          </div>
        )}

        {excludeFinancialDependent && (
          <div className="mb-3 p-2 bg-blue-100 border-l-4 border-blue-500 text-blue-800 rounded">
            <span className="font-semibold">ℹ️ Exclusão do titular: {beneficiaryName} - Dependentes vinculados (serão mantidos no plano)</span>
          </div>
        )}
        
        <div className="ml-2 text-black-800 bg-white rounded p-1 mb-3 cursor-default">
          <span className="font-semibold">
            {excludeAll 
              ? "Dependentes vinculados (serão excluídos junto com o titular):" 
              : excludeFinancialDependent
                ? "Dependentes vinculados (serão mantidos no plano):"
                : "Selecione um ou mais dependentes para exclusão, podendo incluir todos, se desejar:"}
          </span>
        </div>
        
        <ul className="space-y-2 mb-4">
          {dependents.map((dependent, index) => (
            <motion.li
              key={`${dependent.nome}-${index}`}
              className={`flex items-center justify-between p-3 rounded-md shadow-sm border-l-4 transition-all ${
                excludeAll
                  ? "bg-yellow-50 border-yellow-400"
                  : excludeFinancialDependent
                    ? "bg-blue-50 border-blue-300"
                    : dependent.excluir 
                      ? "bg-red-50 border-red-500" 
                      : "bg-green-50 border-green-500"
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-center flex-1">
                {excludeAll || excludeFinancialDependent ? (
                  <span className="flex items-center">
                    <span className="w-6 h-6 mr-3 inline-block"></span>
                    <span className={`font-medium ${
                      excludeAll ? "text-gray-800" : "text-gray-800"
                    }`}>
                      {dependent.nome}
                    </span>
                  </span>
                ) : (
                  <label className="flex items-center mr-3">
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={dependent.excluir}
                      onChange={() => toggleDependentExclusion(index)}
                    />
                    <span
                      className={`flex items-center justify-center w-6 h-6 border-2 rounded transition-all duration-200 ${
                        dependent.excluir
                          ? "bg-red-500 border-red-500 text-white cursor-pointer"
                          : "bg-white border-gray-700 hover:border-gray-600 cursor-pointer"
                      }`}
                    >
                      {dependent.excluir && "✓"}
                    </span>
                  </label>
                )}
                <span className={`font-medium ${
                  excludeAll
                    ? "text-gray-800"
                    : excludeFinancialDependent
                      ? "text-gray-800"
                      : dependent.excluir 
                        ? "text-gray-900" 
                        : "text-gray-800"
                }`}>
                  {dependent.nome}
                </span>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                excludeAll
                  ? "bg-yellow-200 text-yellow-800"
                  : excludeFinancialDependent
                    ? "bg-blue-200 text-blue-800"
                    : dependent.excluir 
                      ? "bg-red-200 text-red-800" 
                      : "bg-green-200 text-green-800"
              }`}>
                {excludeAll 
                  ? "Será excluído" 
                  : excludeFinancialDependent 
                    ? "Será mantido"
                    : dependent.excluir 
                      ? "Será excluído" 
                      : "Será mantido"
                }
              </span>
            </motion.li>
          ))}
        </ul>

        {/* Mensagens explicativas */}
        {excludeAll && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
            <span className="font-semibold">ℹ️ Informação:</span> Todos os dependentes serão excluídos junto com o titular. Não é possível selecionar dependentes individualmente nesta modalidade.
          </div>
        )}

        {excludeFinancialDependent && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
            <span className="font-semibold">ℹ️ Informação:</span> Os dependentes serão mantidos no plano. Você continuará como responsável financeiro por eles.
          </div>
        )}

        {/* Resumo das exclusões */}
        {!isDisabled && hasSelectedForExclusion && (
          <div className="mt-3 p-3 bg-gray-100 rounded-lg">
            <p className="text-sm">
              <span className="font-semibold">Resumo:</span>{" "}
              {dependents.filter(d => d.excluir).length} dependente(s) serão excluídos e{" "}
              {dependents.filter(d => !d.excluir).length} serão mantidos.
            </p>
          </div>
        )}
      </div>
    );
  };

  const confirmExclusion = async () => {
    const dependentsToExclude = dependents.filter(d => d.excluir);
    
    let message = "";

    if (excludeAll) {
      message = "Você está prestes a excluir o titular e TODOS os dependentes vinculados.";
    } else if (excludeFinancialDependent) {
      message = "Você está prestes a excluir apenas o titular, mas permanecerá como responsável financeiro. Os dependentes serão mantidos.";
    } else if (dependentsToExclude.length > 0) {
      message = `Você está prestes a excluir os seguintes dependentes:<br><br>`;
      dependentsToExclude.forEach((dep, index) => {
        message += `${index + 1}. ${dep.nome} - CPF: ${dep.cpf}<br>`;
      });
    } else {
      message = "Você está prestes a excluir apenas o titular.";
    }

    message += "<br><br><b>Esta ação é irreversível. Deseja continuar?</b>";

    const result = await Swal.fire({
      title: "Confirmação de Exclusão",
      html: message,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",
    });

    return result.isConfirmed;
  };

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true,
      floatPrecision: 16,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const logoWidth = pageWidth;
    const logoHeight = 40;

    doc.addImage(logo, "JPEG", 0, 0, logoWidth, logoHeight);

    doc.setFont("Arial", "bold");
    doc.setFontSize(13);
    const titleText =
      "REQUERIMENTO DE EXCLUSÃO DE BENEFICIÁRIO DE PLANO DE SAÚDE COLETIVO POR ADESÃO";
    const titleLines = doc.splitTextToSize(titleText, 190);
    let titleY = 55;
    titleLines.forEach((line) => {
      const lineWidth = doc.getTextWidth(line);
      const lineX = (pageWidth - lineWidth) / 2;
      doc.text(line, lineX, titleY);
      titleY += 6;
    });

    doc.setFont("Times New Roman", "normal");
    doc.setFontSize(11);

    function formatarCPF(cpf) {
      const numeros = cpf.replace(/\D/g, "");
      if (numeros.length !== 11) {
        throw new Error("CPF deve ter 11 dígitos.");
      }

      return numeros
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{2})$/, "$1-$2");
    }

    const cpfFormatado = formatarCPF(cpf);
    const fixedText1 = [
      "",
      ``,
      "",
      `Eu, ${beneficiaryName}, CPF: ${cpfFormatado}, Mat. ${registrationCode}, titular do plano de saúde coletivo por adesão denominado AFRAFEP SAÚDE PLUS NACIONAL (registro na ANS sob o nº 492.796/22-6), disponibilizado pela operadora de planos privados de assistência à saúde na modalidade de autogestão, ASSOCIAÇÃO DOS AUDITORES FISCAIS DO ESTADO DA PARAÍBA - AFRAFEP, com registro da ANS sob o nº 33028-1, venho solicitar a exclusão, do referido plano de saúde, do(s) beneficiário(s) abaixo identificados:`,
    ];

    let yOffset = 54;
    fixedText1.forEach((line) => {
      if (line) {
        const splitText = doc.splitTextToSize(line, 180);
        splitText.forEach((textLine) => {
          doc.text(textLine, 10, yOffset, { maxWidth: 190, align: "justify" });
          yOffset += 5;
        });
      } else {
        yOffset += 5;
      }
    });

    const dependentsToExclude = excludeAll ? dependents : (excludeFinancialDependent ? [] : dependents.filter(d => d.excluir));
    
    if (dependentsToExclude.length > 0) {
      doc.setFont("Arial", "normal");
      doc.text("", 8, yOffset, { maxWidth: 190, align: "justify" });
      yOffset += 3;

      dependentsToExclude.forEach((dependent) => {
        const formattedDate = new Date(
          dependent?.dtNascimento
        ).toLocaleDateString("pt-BR");

        const dependentText = `- ${dependent?.nome}/CPF: ${formatarCPF(
          dependent?.cpf
        )}/CODIGO: ${dependent?.codigo}/Dt:NASCIMENTO: ${formattedDate}/MÃE: ${
          dependent?.nmMae
        }/ CNS: ${dependent?.cns}`;

        const splitDependentText = doc.splitTextToSize(dependentText, 190);
        splitDependentText.forEach((textLine) => {
          doc.text(textLine, 10, yOffset, { maxWidth: 190, align: "justify" });
          yOffset += 5;
        });
      });

      yOffset -= 6;
    } else {
      yOffset += 4;
      let beneficiaryText = `${beneficiaryName} / CPF: ${formatarCPF(cpf)}`;

      if (excludeAll) {
        beneficiaryText += " e de todos os meus dependentes a mim vinculados.";
      } else if (excludeFinancialDependent) {
        beneficiaryText += " (exclusão apenas do titular, mantendo-se como responsável financeiro).";
      }
      
      const splitBeneficiaryText = doc.splitTextToSize(beneficiaryText, 190);
      splitBeneficiaryText.forEach((textLine) => {
        doc.text(textLine, 10, yOffset, { maxWidth: 190, align: "justify" });
        yOffset += 1;
      });
    }

    const fixedText = [
      "",
      "",
      "Declaro que fui devidamente informado e estou ciente que:",
      "",
      "I - Eventual novo ingresso do beneficiário excluído em plano de saúde coletivo disponibilizado pela AFRAFEP importará:",
      "a) No cumprimento de novos períodos de carência, observado o disposto no inciso V do art. 12 da Lei 9.656/98;",
      "b) Se aplicado ao beneficiário for, na perda do direito à portabilidade de carência, caso não tenha sido este o motivo da solicitação de exclusão, nos termos da RN 438/2018 da ANS;",
      "c) No preenchimento de nova declaração de saúde, e, caso haja doença ou lesão preexistente – DLP à nova adesão, no cumprimento de Cobertura Parcial Temporária – CPT.",
      "",
      "II- A presente solicitação de exclusão de beneficiário de plano de saúde coletivo tem efeito imediato e caráter irrevogável, a partir da ciência da AFRAFEP;",
      "",
      "III- As contraprestações pecuniárias vencidas, as a vencer referentes à período anterior à presente solicitação de exclusão de beneficiário, e/ou eventuais valores devidos a título de coparticipação ou de franquia pela utilização de serviços realizados antes desta solicitação, são de minha inteira responsabilidade;",
      "",
      "IV- As despesas decorrentes de eventuais utilizações dos serviços pelos beneficiários após a solicitação de exclusão do plano de saúde, inclusive nos casos de urgência ou emergência, correrão por minha conta;",
      "",
      "V- A exclusão do beneficiário titular do plano de saúde coletivo disponibilizado pela AFRAFEP tem como efeito a exclusão do vínculo dos beneficiários dependentes a ele vinculados;",
      "",
    ];

    fixedText.forEach((line) => {
      if (line) {
        const splitText = doc.splitTextToSize(line, 180);
        splitText.forEach((textLine) => {
          doc.text(textLine, 10, yOffset, { maxWidth: 190, align: "justify" });
          yOffset += 4.5;
        });
      } else {
        yOffset += 5;
      }
    });

    function formatarData() {
      const dataAtual = new Date();
      const dia = dataAtual.getDate();
      const mes = dataAtual.toLocaleString("pt-BR", { month: "long" });
      const ano = dataAtual.getFullYear();
      return `João Pessoa, ${dia} de ${mes} de ${ano}.`;
    }

    doc.setFont("Arial", "normal");
    yOffset += 5;
    const centralText = formatarData();
    const centralTextWidth = doc.getTextWidth(centralText);
    const xRight = pageWidth - 10 - centralTextWidth;
    doc.text(centralText, xRight, yOffset);
    yOffset += 11;

    const generateProtocol2 = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");

      let seconds = now.getSeconds() - 3;
      if (seconds < 0) {
        seconds = 60 + seconds;
        now.setMinutes(now.getMinutes() - 1);
      }

      seconds = String(seconds).padStart(2, "0");

      return `${day}${month}${year}${hours}${minutes}${seconds}`;
    };

    const beneficiaryTitleText = `Assinatura do Titular `;
    const beneficiaryTitleWidth = doc.getTextWidth(beneficiaryTitleText);
    const titleCenter = (pageWidth - beneficiaryTitleWidth) / 2;

    doc.text(beneficiaryTitleText, titleCenter, yOffset);
    yOffset += 7;

    doc.setFont("Helvetica", "bold");
    const protocolTextWidth = doc.getTextWidth(
      "_______________________________________"
    );
    const protocolTextCenter = (pageWidth - protocolTextWidth) / 2;
    doc.text(
      "_______________________________________",
      protocolTextCenter,
      yOffset
    );

    doc.setFont("Helvetica", "normal");
    if (hasDependents) {
      yOffset += 12;
    } else {
      yOffset += 15;
    }

    if (dependents.filter(d => d.excluir).length === 1) {
      yOffset += 35;
    } else {
      yOffset += 15;
    }

    if (dependents.filter(d => d.excluir).length === 2) {
      yOffset += 35;
    } else {
      yOffset += -6;
    }

    if (dependents.filter(d => d.excluir).length === 3) {
      yOffset += 35;
    } else {
      yOffset += -6;
    }

    if (dependents.filter(d => d.excluir).length === 4) {
      yOffset += 35;
    } else {
      yOffset += 7;
    }

    if (dependents.filter(d => d.excluir).length > 5) {
      yOffset += 30;
    } else {
      yOffset += -8;
    }

    const additionalInfo = [
      "Rua: Corálio Soares de Oliveira, nº 497, Centro, João Pessoa – PB, CEP 58.013-260.",
      "Telefone: 3533-5310 - www.afrafepsaude.com.br  @afrafepsaude ",
      "CNPJ: 09.306.242/0001-82.",
    ];

    doc.setTextColor(105, 105, 105);
    additionalInfo.forEach((line, index) => {
      const splitText = doc.splitTextToSize(line, 150);
      splitText.forEach((textLine) => {
        doc.text(textLine, 8, yOffset, { maxWidth: 190 });
        yOffset += 5;
      });
      if (index === additionalInfo.length - 1) {
        yOffset += 10;
      }
    });

    const imgBase64 = rodape;
    const imgWidth = 40;
    const imgHeight = 22;
    const pageWidth2 = doc.internal.pageSize.width;
    const xOffsetImage = pageWidth2 - imgWidth - 10;
    const yOffsetImage = doc.internal.pageSize.height - imgHeight - 10;

    doc.addImage(
      imgBase64,
      "PNG",
      xOffsetImage,
      yOffsetImage,
      imgWidth,
      imgHeight
    );

    doc.setTextColor(0, 0, 0);

    const pdfBase64 = doc.output("datauristring");
    setPdfBase64(pdfBase64);

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setPdfUrl(pdfUrl);
    setIsModalOpen(true);
    setDetalhe(true);

    const pdfFilename = (dependentsToExclude.length > 0 || excludeAll)
      ? `Termo_de_ciencia_Exclusao_${beneficiaryName}_dependentes.pdf`
      : `Termo_de_ciencia_Exclusao_${beneficiaryName}.pdf`;

    doc.save(pdfFilename);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const confirmed = await confirmExclusion();
    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      const dependentsToExclude = excludeAll ? dependents : (excludeFinancialDependent ? [] : dependents.filter(d => d.excluir));
      
      const tp_exclusao =
        excludeAll ? 1
          : excludeFinancialDependent ? 2
          : dependentsToExclude.length > 0 ? 3
          : 1;

      const response = await fetch(
        "https://api.afrafepsaude.com.br/forms/exclusao/beneficiarios/salvar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            beneficiaryName,
            registrationCode,
            cpf,
            code,
            tp_exclusao,
            dependents: dependentsToExclude,
            excludeAll,
            excludeFinancialDependent,
            isAllChecked
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error("Erro ao salvar os dados");
      }

      toast.success("Exclusão realizada com sucesso! Voltando...", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      
      generatePDF();
      
      setExcludeAll(false);
      setExcludeFinancialDependent(false);
      setHasDependents(false);
      setDependents([]);
      setIsAllChecked(false);
      
      setIsSubmitting(false);
      
      setTimeout(() => {
        navigate(-1);
      }, 2000);
      
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao realizar exclusão. Tente novamente.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Menu />

      <div className="container mx-auto flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 mt-[70px]">
        <Footer />

        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-2xl sm:text-2xl font-bold text-center mb-3">
            REQUERIMENTO DE EXCLUSÃO DE BENEFICIÁRIO
            <br /> DE PLANO DE SAÚDE COLETIVO POR ADESÃO{" "}
          </h1>
        </motion.div>

        <ToastContainer />
        <div className="flex justify-center items-center">
          <motion.form
            onSubmit={handleSubmit}
            className="w-full max-w-3xl bg-white p-6 shadow-lg rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
          >
            <motion.div
              className="form-group grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div>
                <label className="font-semibold">Nome do Beneficiário:</label>
                <input
                  className="border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full"
                  value={beneficiaryName}
                  readOnly
                  required
                />
              </div>

              <div className="form-group mb-4 flex space-x-4">
                <div className="w-1/2">
                  <label className="font-semibold">Matrícula:</label>
                  <InputMask
                    className="border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full"
                    value={registrationCode}
                    readOnly
                    required
                  />
                </div>

                <div className="w-1/2">
                  <label className="font-semibold">CPF:</label>
                  <InputMask
                    className="border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full"
                    value={cpf}
                    readOnly
                    required
                  />
                </div>
              </div>

              {/* Checkbox: Exclusão Total */}
              {!excludeFinancialDependent && (
                <motion.label
                  className="flex items-center cursor-pointer mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <input
                    type="checkbox"
                    checked={excludeAll}
                    onChange={handleExcludeAllChange}
                    className="hidden"
                  />
                  <span
                    className={`flex items-center justify-center w-8 h-6 border-2 
                  ${
                    excludeAll
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white border-black"
                  }
                  rounded transition-all duration-200 hover:border-gray-600 hover:shadow-lg`}
                  >
                    {excludeAll && "X"}
                  </span>
                  <span className="ml-2 text-black-800 bg-white rounded p-1">
                    Minha própria exclusão e de todos os dependentes a mim
                    vinculados.
                  </span>
                </motion.label>
              )}

              {/* Checkbox: Exclusão Financeira */}
              {!excludeAll && (
                <motion.label
                  className="flex items-center cursor-pointer mb-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <input
                    type="checkbox"
                    checked={excludeFinancialDependent}
                    onChange={handleExcludeFinancialDependentChange}
                    className="hidden"
                  />
                  <span
                    className={`flex items-center justify-center w-8 h-6 border-2 
                  ${
                    excludeFinancialDependent
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white border-black"
                  }
                  rounded transition-all duration-200 hover:border-gray-600 hover:shadow-lg`}
                  >
                    {excludeFinancialDependent && "✓"}
                  </span>
                  <span className="ml-2 text-black-800 bg-white rounded p-1">
                    Minha própria exclusão, mas permaneço como responsável
                    financeiro.
                  </span>
                </motion.label>
              )}
            </motion.div>

            {/* Seção de Dependentes com novo layout */}
            {renderDependentsSection()}

            {/* Botão de envio */}
            {hasExclusionSelected() && (
              <motion.button
                type="submit"
                className={`w-full py-2 rounded text-white transition-all ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Salvar"}
              </motion.button>
            )}
          </motion.form>
        </div>
      </div>
    </>
  );
}

export default App;