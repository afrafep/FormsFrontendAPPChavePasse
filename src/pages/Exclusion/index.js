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
  const [dependents, setDependents] = React.useState([]);
  const [hasDependents, setHasDependents] = React.useState(false);
  const [loginError, setLoginError] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [detalhe, setDetalhe] = useState(false);
  const [pdfBase64, setPdfBase64] = useState(""); // Estado para armazenar o PDF em Base64
  const [isModalOpen, setIsModalOpen] = useState(false); // Controle do modal
  const [checked, setChecked] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const chavePasse = queryParams.get("chavePasse") || "";

  const chaveFunc = "7a516ed5-1ae8-4980-abd4-f4c033027e26";
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlzIjoiY2hhdmVQYXNzZSIsImtleSI6IjVjZDg2OThhLTllNzYtNDIwYy04MTJiLTc1ODZiMmQ5OTc2NiIsImlhdCI6MTczMzc1MDc2NiwiZXhwIjozMzExNjMwNzY2LCJhdWQiOiJhbGwifQ.pnMRmFnTk685RBuf2kpsly7Pmxam5SjjFoePUMFL0cQ";

  /*   const chaveFunc = process.env.REACT_APP_CHAVE_FUNC;
  const token = process.env.REACT_APP_CHAVE_TOKEN; */

  const MenssagemSemDependent = () =>
    toast.success(
      "Exclusão feita com sucesso, aperte o botao voltar para acompanhar a solictação",
      {
        position: "top-center",
        autoClose: 5500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        closeButton: false,
        theme: "dark",
      }
    );

  const MenssagemDependent = () =>
    toast.success(
      "Exclusão feita com sucesso, aperte o botao voltar para acompanhar a solictação",
      {
        position: "top-center",
        autoClose: 5500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        closeButton: false,
        theme: "dark",
      }
    );

// Fetch dos dados do beneficiário
useEffect(() => {
  const fetchBeneficiaryData = async () => {
    try {
      // Obtendo chavePasse da URL
      const queryParams = new URLSearchParams(window.location.search);
      const chavePasse = queryParams.get("chavePasse") || "";

      if (!chavePasse) {
        console.error("Chave Passe não foi fornecida na URL.");
        setLoginError("Chave Passe não encontrada na URL.");
        return;
      }

      // Primeiro GET: busca informações do beneficiário usando chavePasse
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

      // Obtendo chaveUnica da resposta
      const chaveUnica = response.data?.data?.chaveUnica;

      if (!chaveUnica) {
        console.error("Chave Unica não encontrada na resposta.");
        setLoginError("Erro ao obter chave única do beneficiário.");
        return;
      }

      // PRIMEIRO: Busca os dados do TITULAR usando chaveUnica
      const titularResponse = await axios.get(
        `https://api.afrafepsaude.com.br/forms/reciprocidade/beneficiarios/${chaveUnica}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Verifica se a resposta contém dados válidos do TITULAR
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

        // SEGUNDO: Busca os DEPENDENTES do titular
        const dependentesResponse = await axios.get(
          `https://api.afrafepsaude.com.br/forms/reciprocidade/beneficiarios/${chaveUnica}/dependentes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Verifica se a resposta contém dados válidos de DEPENDENTES
        if (dependentesResponse.data && dependentesResponse.data.data) {
          const { dependentes = [] } = dependentesResponse.data.data;

          setHasDependents(dependentes.length > 0);
          setDependents(
            dependentes.map((dependent) => ({
              nome: dependent.nome,
              cpf: dependent.cpf,
              codigo: dependent.codigo,
              cns: dependent.cns,
              nmMae: dependent.nmMae,
              dtNascimento: dependent.dtNascimento,
              nmBeneficiario_titular: beneficiaryName, // Nome do titular CORRETO
              nuCpf_titular: titularCpf, // CPF do titular CORRETO
            }))
          );
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
}, [chavePasse, chaveFunc, token]); // Dependências do useEffect

  const [newDependent, setNewDependent] = React.useState("");
  const [savedDependents, setSavedDependents] = useState([]); // Dependentes temporários
  const [availableDependents, setAvailableDependents] = React.useState([]);

  const [isAllChecked, setIsAllChecked] = useState(false);

  const handleCheckboxChange = () => {
    setIsAllChecked(!isAllChecked);
    // Resetar os outros estados quando 'isAllChecked' for alterado para true
    if (!isAllChecked) {
      setExcludeAll(false);
      setExcludeFinancialDependent(false);
    }
  };

  const [excludeAll, setExcludeAll] = useState(false); // Controle para exclusão total
  const [excludeFinancialDependent, setExcludeFinancialDependent] =
    useState(false);

  const handleExcludeFinancialDependentChange = () => {
    const newValue = !excludeFinancialDependent;
    setExcludeFinancialDependent(newValue);
    setIsAllChecked(false); // Desmarcando o isAllChecked quando o 'excludeFinancialDependent' mudar

    if (newValue) {
      // Salva dependentes atuais e limpa a lista
      setSavedDependents(dependents);
      setDependents([]);
      setHasDependents(false);
    } else {
      // Restaura os dependentes salvos
      setDependents(savedDependents);
      setHasDependents(savedDependents.length > 0);
      setSavedDependents([]);
    }
    setExcludeFinancialDependent(newValue); // Atualiza o estado do checkbox
  };

  const handleDependentChange = (value) => {
    if (value) {
      const selectedDependent = JSON.parse(value);
      // Verifica se o dependente já não está na lista
      if (!dependents.some((dep) => dep.nome === selectedDependent.nome)) {
        setDependents((prev) => [...prev, selectedDependent]);
        setNewDependent("");
        setAvailableDependents((prev) =>
          prev.filter((dep) => dep.nome !== selectedDependent.nome)
        );
        setHasDependents(true);
      } else {
        console.warn("Dependente já adicionado.");
      }
    }
  };

  const removeDependent = (index) => {
    const removedDependent = dependents[index];
    const updatedDependents = dependents.filter((_, i) => i !== index);
    setDependents(updatedDependents);

    // Restaura o dependente removido à lista de disponíveis se a exclusão não for financeira
    if (!excludeFinancialDependent) {
      setAvailableDependents((prev) => [...prev, removedDependent]);
    }

    if (updatedDependents.length === 0) {
      setHasDependents(false);
    }
  };

  const handleExcludeAllChange = () => {
    setIsAllChecked(false); // Desmarcando o isAllChecked quando o 'excludeFinancialDependent' mudar

    // Inverte o estado do checkbox
    const newValue = !excludeAll;
    setExcludeAll(newValue);

    if (newValue) {
      // Salva os dependentes atuais em `savedDependents` e limpa `dependents`
      setSavedDependents(dependents);
      setDependents([]);
      setHasDependents(false);
    } else {
      // Restaura os dependentes salvos em `savedDependents`
      setDependents(savedDependents);
      setHasDependents(savedDependents.length > 0);
      setSavedDependents([]);
    }
  };

  const filteredAvailableDependents = availableDependents.filter(
    (dep) => !dependents.includes(dep)
  );

  const handleOpenPDF = () => {
    navigate("/pdf-viewer", { state: { pdfBase64 } }); // Passe o estado corretamente
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  function confirmAction(message) {
    return Swal.fire({
      title: "Confirmação",
      text: message,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim",
      cancelButtonText: "Não",
    }).then((result) => result.isConfirmed);
  }

  const confirmExclusion = async () => {
    let message = "";

    if (dependents && dependents.length > 0) {
      message = `Você está prestes a excluir os seguintes dependentes:<br><br>`;
      dependents.forEach((dep, index) => {
        message += `${index + 1}. ${dep.nome} - CPF: ${dep.cpf}<br>`;
      });
    } else if (excludeFinancialDependent) {
      message =
        "Você está prestes a excluir apenas o titular, mas permanecerá como responsável financeiro.";
    } else if (excludeAll) {
      message =
        "Você está prestes a excluir o titular e TODOS os dependentes vinculados.";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verificar confirmação
    const confirmed = await confirmExclusion();
    if (!confirmed) return;

    setIsSubmitting(true);

    const clearFields = () => {
      setExcludeAll("");
      setExcludeFinancialDependent("");
      setHasDependents("");
      setDependents("");
    };

    try {
      const tp_exclusao =
        dependents && dependents.length > 0
          ? 3
          : excludeFinancialDependent
          ? 2
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
            dependents,
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Erro ao salvar os dados");
      }

      const result = await response.json();
      MenssagemSemDependent();
      clearFields();
      setIsSubmitting(false); // Fim da submissão (sucesso)
    } catch (error) {
      console.error("Erro:", error);
      MenssagemDependent();
      setIsSubmitting(false); // Fim da submissão (erro)
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true,
      floatPrecision: 16,
    });

    // Tamanho e posicionamento do logo
    // Obter tamanho da página
    const pageWidth = doc.internal.pageSize.getWidth();

    // Definir o tamanho da logo para cobrir todo o cabeçalho
    const logoWidth = pageWidth; // Largura total da página
    const logoHeight = 40; // Altura do cabeçalho ajustável

    // Adicionar logo ocupando todo o cabeçalho
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

    const dtSolicitacao = new Date();
    const offset = dtSolicitacao.getTimezoneOffset() * 60000;
    const localTime = new Date(dtSolicitacao.getTime() - offset)
      .toISOString()
      .slice(0, 19)
      .replace("T", " "); // Formato: YYYY-MM-DD HH:mm:ss

    // Gera o PROTOCOLO a partir da data e hora atual
    const generateProtocol = () => {
      const now = new Date(); // Obter a data e hora atual

      // Extrair componentes da data e hora
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      // Montar o protocolo no formato desejado
      return `${day}${month}${year}${hours}${minutes}${seconds}`;
    };

    const protocolo = generateProtocol(); // Gera o PROTOCOLO

    // Usando a variável cpf
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
          yOffset += 5; // Espaço entre linhas
        });
      } else {
        yOffset += 5; // Adiciona espaço para quebras de linha
      }
    });

    // Adiciona dependentes se existirem
    if (hasDependents && dependents.length > 0) {
      doc.setFont("Arial", "normal");
      doc.text("", 8, yOffset, { maxWidth: 190, align: "justify" });
      yOffset += 3;

      dependents.forEach((dependent) => {
        // Formata a data de nascimento para o formato DD/MM/YYYY
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

      yOffset -= 6; // Ajusta a Y offset após a lista de dependentes
    } else {
      // Adiciona um incremento ao yOffset para descer o titular
      yOffset += 4; // Ajuste este valor conforme necessário
      let beneficiaryText = `${beneficiaryName} / CPF: ${formatarCPF(cpf)}`;

      if (excludeAll) {
        beneficiaryText += " e de todos os meus dependentes a mim vinculados.";
      } else if (excludeFinancialDependent) {
        beneficiaryText += " e vou ficar como responsável financeiro.";
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
        yOffset += 5; // Adiciona espaço para quebras de linha
      }
    });

    function formatarData() {
      const dataAtual = new Date();
      const dia = dataAtual.getDate();
      const mes = dataAtual.toLocaleString("pt-BR", { month: "long" });
      const ano = dataAtual.getFullYear();

      // Retornar a string formatada
      return `João Pessoa, ${dia} de ${mes} de ${ano}.`;
    }

    // Text "João Pessoa, _____ de _______ de _______" à direita e mais para baixo
    doc.setFont("Arial", "normal");
    yOffset += 5; // Add more space before the location and date text
    const centralText = formatarData();
    const centralTextWidth = doc.getTextWidth(centralText);
    const xRight = pageWidth - 10 - centralTextWidth;
    doc.text(centralText, xRight, yOffset);
    yOffset += 11; // Additional space after location and date

    // Gera o PROTOCOLO
    const generateProtocol2 = () => {
      const now = new Date(); // Obter a data e hora atual

      // Extrair componentes da data e hora
      const day = String(now.getDate()).padStart(2, "0"); // Dia (DD)
      const month = String(now.getMonth() + 1).padStart(2, "0"); // Mês (MM)
      const year = now.getFullYear(); // Ano (YYYY)
      const hours = String(now.getHours()).padStart(2, "0"); // Horas (HH)
      const minutes = String(now.getMinutes()).padStart(2, "0"); // Minutos (MM)

      // Subtrair 3 segundos
      let seconds = now.getSeconds() - 3;
      if (seconds < 0) {
        seconds = 60 + seconds; // Ajusta para o caso de subtrair e o valor ficar negativo
        now.setMinutes(now.getMinutes() - 1); // Ajusta os minutos se necessário
      }

      seconds = String(seconds).padStart(2, "0"); // Formatar os segundos para dois dígitos

      // Montar o protocolo no formato desejado
      return `${day}${month}${year}${hours}${minutes}${seconds}`;
    };

    // Gera o PROTOCOLO
    const protocolo2 = generateProtocol2();

    // Text "NÚMERO DE PROTOCOLO" com PROTOCOLO em negrito
    const beneficiaryTitleText = `Assinatura do Titular `;
    const beneficiaryTitleWidth = doc.getTextWidth(beneficiaryTitleText);
    const titleCenter = (pageWidth - beneficiaryTitleWidth) / 2;

    // Primeiro, desenha o texto "NÚMERO DE PROTOCOLO: " com a fonte normal
    doc.text(beneficiaryTitleText, titleCenter, yOffset);

    // Ajusta o yOffset para a próxima linha para o PROTOCOLO
    yOffset += 7; // Distância entre as linhas (ajuste conforme necessário)

    // Depois, aplica a fonte negrito e desenha o PROTOCOLO
    doc.setFont("Helvetica", "bold"); // Usando a fonte negrito
    const protocolTextWidth = doc.getTextWidth(
      "_______________________________________"
    );

    // Centraliza o PROTOCOLO na mesma linha
    const protocolTextCenter = (pageWidth - protocolTextWidth) / 2;
    doc.text(
      "_______________________________________",
      protocolTextCenter,
      yOffset
    );

    // Restaura a fonte para normal
    doc.setFont("Helvetica", "normal");
    if (hasDependents) {
      yOffset += 12; // Aumenta o yOffset se tiver dependentes
    } else {
      yOffset += 15; // Aumenta o yOffset se não tiver dependentes
    }

    if (hasDependents.length == 1) {
      yOffset += 35; // Aumenta o yOffset se houver mais de 6 dependentes
    } else {
      yOffset += 15; // Aumenta o yOffset se houver 6 ou menos dependentes
    }

    if (hasDependents.length == 2) {
      yOffset += 35; // Aumenta o yOffset se houver mais de 6 dependentes
    } else {
      yOffset += -6; // Aumenta o yOffset se houver 6 ou menos dependentes
    }

    if (hasDependents.length == 3) {
      yOffset += 35; // Aumenta o yOffset se houver mais de 6 dependentes
    } else {
      yOffset += -6; // Aumenta o yOffset se houver 6 ou menos dependentes
    }

    if (hasDependents.length == 4) {
      yOffset += 35; // Aumenta o yOffset se houver mais de 6 dependentes
    } else {
      yOffset += 7; // Aumenta o yOffset se houver 6 ou menos dependentes
    }

    if (hasDependents.length > 5) {
      yOffset += 30; // Aumenta o yOffset se houver mais de 6 dependentes
    } else {
      yOffset += -8; // Aumenta o yOffset se houver 6 ou menos dependentes
    }

    // Additional information
    const additionalInfo = [
      "Rua: Corálio Soares de Oliveira, nº 497, Centro, João Pessoa – PB, CEP 58.013-260.",
      "Telefone: 3533-5310 - www.afrafepsaude.com.br  @afrafepsaude ",
      "CNPJ: 09.306.242/0001-82.",
    ];

    // Set text color to blue
    doc.setTextColor(105, 105, 105); // Cinza escuro (#696969)
    additionalInfo.forEach((line, index) => {
      const splitText = doc.splitTextToSize(line, 150);
      splitText.forEach((textLine) => {
        doc.text(textLine, 8, yOffset, { maxWidth: 190 });
        yOffset += 5; // Reduced space between lines
      });
      // Add extra space only after the last line
      if (index === additionalInfo.length - 1) {
        yOffset += 10; // You can adjust this value as needed
      }
    });

    // Adiciona a imagem no rodapé (direita)
    const imgBase64 = rodape; // Substitua pelo Base64 real da imagem
    const imgWidth = 40; // Ajuste conforme necessário
    const imgHeight = 22; // Ajuste conforme necessário
    // Certifique-se de que pageWidth já existe antes
    const pageWidth2 = doc.internal.pageSize.width;

    const xOffsetImage = pageWidth2 - imgWidth - 10; // Posição X (direita)
    const yOffsetImage = doc.internal.pageSize.height - imgHeight - 10; // Posição Y (rodapé)

    doc.addImage(
      imgBase64,
      "PNG",
      xOffsetImage,
      yOffsetImage,
      imgWidth,
      imgHeight
    );

    // Reset text color to black
    doc.setTextColor(0, 0, 0);

    // Após gerar o conteúdo

    const pdfBase64 = doc.output("datauristring"); // Gera o PDF em base64

    // Salvar o PDF em base64 no estado
    setPdfBase64(pdfBase64);

    // Gerar o PDF como Blob
    const pdfBlob = doc.output("blob");

    // Gerar a URL do Blob
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Atualizar o estado com a URL do Blob
    setPdfUrl(pdfUrl); // Supondo que você tenha um estado para armazenar a URL

    // Abrir o modal para exibir o PDF
    setIsModalOpen(true);

    // Atualizar o estado para mostrar o PDF
    setDetalhe(true);

    // Save the document
    const pdfFilename = hasDependents
      ? `Termo_de_ciencia_Exclusao_${beneficiaryName}_dependentes.pdf`
      : `Termo_de_ciencia_Exclusao_${beneficiaryName}.pdf`;

    // Salvar o documento
    /*     doc.save(pdfFilename);
     */
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

              {/* Campo: Matrícula */}
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

                {/* Campo: CPF */}
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

            {/* Lista de Dependentes */}
            {(dependents.length > 0 || savedDependents.length > 0) &&
              !excludeAll && (
                <div className="form-group mb-4">
                  <motion.label
                    className="flex items-center cursor-pointer mb-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Exibe o checkbox se 'excludeFinancialDependent' for falso e 'isAllChecked' for falso */}
                    {!excludeFinancialDependent && (
                      <>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isAllChecked}
                          onChange={handleCheckboxChange}
                        />
                        <span
                          className={`flex items-center justify-center w-6 h-6 border-2 
                          ${
                            isAllChecked
                              ? "bg-black text-white border-black"
                              : "bg-white border-black"
                          }
                          rounded transition-all duration-200 hover:border-gray-600 hover:shadow-lg`}
                        >
                          {isAllChecked && "✓"}
                        </span>
                        <span
                          className="ml-2 text-black-800 bg-white rounded p-1 cursor-pointer"
                          onClick={() => handleCheckboxChange()} // Ao clicar no texto, altera o estado do checkbox
                        >
                          Excluir todos os dependentes
                        </span>
                      </>
                    )}
                  </motion.label>
                  {!excludeAll && !excludeFinancialDependent && (
                    <div
                      className="flex items-center mb-2 cursor-pointer"
                      onClick={() => setChecked(!checked)}
                    >
                      <span className="ml-2 text-black-800 bg-white rounded p-1 cursor-default">
                        Obs: Para manter algum dependente, clique em "Remover"
                        apenas nele; os demais serão excluídos.
                      </span>
                    </div>
                  )}
                  <ul className="list-disc ml-6 space-y-2">
                    {(dependents.length > 0 ? dependents : savedDependents).map(
                      (dependent, index) => (
                        <motion.li
                          key={index}
                          className="flex items-center justify-between bg-gray-100 p-2 rounded-md shadow-sm"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          {dependent.nome}
                          {!excludeAll && hasDependents && (
                            <button
                              className="ml-3 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-all"
                              type="button"
                              onClick={() => removeDependent(index)}
                            >
                              Remover
                            </button>
                          )}
                        </motion.li>
                      )
                    )}

                    {/* Seletor para adicionar dependentes */}
                    {!excludeAll && filteredAvailableDependents.length > 0 && (
                      <div className="mt-3">
                        <label className="block font-semibold mb-2">
                          Adicionar Dependente:
                        </label>
                        <select
                          className="border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full sm:w-auto p-2 rounded"
                          value={newDependent}
                          onChange={(e) =>
                            handleDependentChange(e.target.value)
                          }
                        >
                          <option value="">Selecione um dependente</option>
                          {filteredAvailableDependents.map((dep, index) => (
                            <option key={index} value={JSON.stringify(dep)}>
                              {dep.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </ul>
                </div>
              )}

            {/* Botão de envio */}
            <motion.button
              type="submit"
              className={`w-full py-2 rounded text-white transition-all ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Salvar"}
            </motion.button>
          </motion.form>
        </div>
      </div>
    </>
  );
}

export default App;
