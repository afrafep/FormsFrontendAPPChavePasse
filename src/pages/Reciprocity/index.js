import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { jsPDF } from "jspdf";
import logo from "../../images/afrafep.png";
import rodape from "../../images/afrafeprodape.png";
import InputMask from "react-input-mask";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import Menu from "../../components/Menu/Menu";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  CHAVE_TOKEN,
  MOCK_CPF,
  formsUrl,
  getBearerHeaders,
  getChaveUnica,
} from "../../services/api";

import "@react-pdf-viewer/core/lib/styles/index.css";
function App() {
  const navigate = useNavigate();

  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [code, setCode] = useState("");
  const [cpf, setCpf] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dependents, setDependents] = React.useState([]);
  const [hasDependents, setHasDependents] = React.useState(false);
  const [loginError, setLoginError] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [pdfUrl, setPdfUrl] = useState(null);
  const [detalhe, setDetalhe] = useState(false);
  const [pdfBase64, setPdfBase64] = useState(""); // Estado para armazenar o PDF em Base64
  const [isModalOpen, setIsModalOpen] = useState(false); // Controle do modal

  const queryParams = new URLSearchParams(window.location.search);
  const chavePasse = queryParams.get("chavePasse") || ""; // Valor da URL ou string vazia

  const [selectedUF, setSelectedUF] = useState("");
  const [destinationState, setDestinationState] = useState([]);

  const addUF = () => {
    if (selectedUF && !destinationState.includes(selectedUF)) {
      setDestinationState([...destinationState, selectedUF]);
      setSelectedUF(""); // Limpa o select após adicionar
    }
  };

  const removeUF = (uf) => {
    setDestinationState((prev) => prev.filter((item) => item !== uf));
  };

  const UFs = [
    { value: "AL", label: "Alagoas" },
    { value: "AM", label: "Amazonas" },
    { value: "BA", label: "Bahia" },
    { value: "CE", label: "Ceará" },
    { value: "DF", label: "Distrito Federal" },
    { value: "MG", label: "Minas Gerais" },
    { value: "PA", label: "Pará" },
    { value: "PE", label: "Pernambuco" },
    { value: "RJ", label: "Rio de Janeiro" },
    { value: "RS", label: "Rio Grande do Sul" },
    { value: "SE", label: "Sergipe" },
    { value: "SP", label: "São Paulo" },
  ];

  const MenssagemSemDependent = () =>
    toast.success(
      "Reciprocidade feita com sucesso,  aperte o botao voltar para acompanhar a solictação",
      {
        position: "top-center",
        autoClose: 4500,
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
      "Reciprocidade feita com suceeso,  aperte o botao voltar para acompanhar a solictação",
      {
        position: "top-center",
        autoClose: 4500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        closeButton: false,
        theme: "dark",
      }
    );

  const maskCpfWithAsterisks = (cpf) => {
    if (!cpf) return "";

    // Remove tudo que não seja número
    const cleanedCpf = cpf.replace(/\D/g, "");

    // Checa se tem 11 dígitos e formata conforme o solicitado
    if (cleanedCpf.length === 11) {
      return `${cleanedCpf.slice(0, 2)}*.***.***-${cleanedCpf.slice(9, 11)}`;
    }

    return cpf; // Retorna o CPF original se não estiver completo
  };

  const maskMatriculaWithAsterisks = (matricula) => {
    if (!matricula) return "";

    // Converte a matrícula em string e substitui os números do meio por ***
    const cleanedMatricula = matricula.toString();

    // Verifica se a matrícula tem pelo menos 6 dígitos para mascarar corretamente
    if (cleanedMatricula.length >= 5) {
      return `${cleanedMatricula.slice(0, 2)}****${cleanedMatricula.slice(-1)}`;
    }

    return matricula; // Retorna a matrícula original se não estiver no formato esperado
  };

useEffect(() => {
  const fetchBeneficiaryData = async () => {
    try {
      // Obtendo chavePasse da URL
      const queryParams = new URLSearchParams(window.location.search);
      const chavePasse = queryParams.get("chavePasse") || "";

      if (!chavePasse && !MOCK_CPF) {
        console.error("Chave Passe não foi fornecida na URL.");
        return;
      }

      // Usa cache da Home e faz fallback para não quebrar acesso direto
      const chaveUnica = await getChaveUnica(chavePasse, {
        preferCache: true,
        allowFetch: true,
      });

      if (chaveUnica) {
        // PRIMEIRO: Busca os dados do TITULAR usando a chaveUnica
        const titularResponse = await axios.get(
          formsUrl(`/reciprocidade/beneficiarios/${chaveUnica}`),
          {
            headers: getBearerHeaders(CHAVE_TOKEN),
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
            formsUrl(`/reciprocidade/beneficiarios/${chaveUnica}/dependentes`),
            {
              headers: getBearerHeaders(CHAVE_TOKEN),
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
              }))
            );
          }
        } else {
          throw new Error("No valid data received for titular");
        }
      }
    } catch (error) {
      setLoginError("Erro ao buscar dados do beneficiário. Tente novamente.");
    }
  };

  fetchBeneficiaryData();
}, [chavePasse]); // Dependências para o useEffect


  const [newDependent, setNewDependent] = React.useState("");
  const [availableDependents, setAvailableDependents] = React.useState([]);

  const handleDependentChange = (value) => {
    if (value) {
      const selectedDependent = JSON.parse(value);
      console.log("Dependente selecionado:", selectedDependent);

      setDependents((prev) => [...prev, selectedDependent]);
      setHasDependents(true);

      setAvailableDependents((prev) =>
        prev.filter((dep) => dep.nome !== selectedDependent.nome)
      );
    }
  };

  const [isLoading, setIsLoading] = useState(false); // Estado do spinner

  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (dependents.length > 0 && !isCompleted) {
      setIsLoading(true); // Ativa o carregamento

      const timer = setTimeout(() => {
        console.log("🔥 Removendo todos os dependentes rapidamente...");

        setAvailableDependents((prev) => [...prev, ...dependents]);

        setDependents([]); // Remove todos os dependentes
        setHasDependents(false);
        setIsLoading(false); // Desativa o carregamento
        setIsCompleted(true); // Marca como concluído
      }, 1000); // Tempo de 1 segundo

      return () => clearTimeout(timer);
    }
  }, [dependents, isCompleted]); // Agora depende de dependents e isCompleted

  const removeDependent = (index) => {
    const removedDependent = dependents[index];

    // Remover o dependente da lista de dependents
    const updatedDependents = dependents.filter((_, i) => i !== index);
    setDependents(updatedDependents);

    // Atualizar hasDependents caso não haja mais dependentes
    if (updatedDependents.length === 0) {
      setHasDependents(false);
    }

    // Adicionar o dependente de volta à lista de disponíveis, se ainda não estiver lá
    setAvailableDependents((prev) =>
      prev.some((dep) => dep.nome === removedDependent.nome)
        ? prev
        : [...prev, removedDependent]
    );
  };

  // Filtrar dependentes disponíveis que já foram adicionados
  const filteredAvailableDependents = availableDependents.filter(
    (dep) => !dependents.includes(dep)
  );

  const handleOpenPDF = () => {
    navigate("/pdf-viewer", { state: { pdfBase64 } }); // Passe o estado corretamente
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verifica se há ao menos uma UF de destino
    if (!destinationState || destinationState.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "UF de Destino obrigatória",
        text: "Por favor, selecione ao menos uma UF de Destino.",
      });
      return;
    }

    const clearFields = () => {
      setDestinationState("");
      setStartDate("");
      setEndDate("");
    };

    // Enviar os dados para o backend
    try {
      const response = await fetch(
        formsUrl("/reciprocidade/beneficiarios/salvar"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            beneficiaryName,
            registrationCode,
            cpf,
            code,
            destinationState,
            startDate,
            endDate,
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
      /*   console.log(result.message); // Mensagem de sucesso */
    } catch (error) {
      console.error("Erro:", error);
      MenssagemDependent();
    }

    if (new Date(startDate) >= new Date(endDate)) {
      Swal.fire({
        icon: "error",
        title: "Datas inválidas",
        text: "Data de Início deve ser anterior à Data de Fim.",
      });
      return;
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

    // Title
    doc.setFont("Arial", "bold");
    doc.setFontSize(13);
    const titleText =
      "Termo de ciência e solicitação de uso de rede de operadora coirmã do Fisco de outro Estado (Convênio de Reciprocidade)";
    const titleLines = doc.splitTextToSize(titleText, 190);
    let titleY = 55;
    titleLines.forEach((line) => {
      const lineWidth = doc.getTextWidth(line);
      const lineX = (pageWidth - lineWidth) / 2;
      doc.text(line, lineX, titleY);
      titleY += 6;
    });

    // Return to normal font
    doc.setFont("Times New Roman", "normal");
    doc.setFontSize(11);

    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    function formatarCPF(cpf) {
      // Remove qualquer caractere que não seja número
      const numeros = cpf.replace(/\D/g, "");

      // Verifica se o CPF possui 11 dígitos
      if (numeros.length !== 11) {
        throw new Error("CPF deve ter 11 dígitos.");
      }

      // Formata o CPF
      return numeros
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{2})$/, "$1-$2");
    }

    // Usando a variável cpf
    const cpfFormatado = formatarCPF(cpf);

    // Fixed text
    const fixedText = ["", "Fui informado e declaro ciência que:", ""];

    const fixedText1 = [
      "    a)    O plano de saúde ao qual estou vinculado, o AFRAFEP-SAÚDE PLUS NACIONAL, tem abrangência em todo território nacional. Nas demais unidades da Federação além da Paraíba, a assistência do plano de saúde é prestada atualmente através da rede credenciada da operadora CASSI;",
    ];

    const fixedText2 = [
      "    b)   A CASSI, através de convênio, cedeu à AFRAFEP a sua rede assistencial nesses outras unidades da federação, passando a rede credenciada da CASSI a figurar como rede assistencial da AFRAFEP (contratação indireta);",
    ];

    const fixedText3 = [
      "    c)    Para fazer uso da rede assistencial do plano de saúde AFRAFEP-SAÚDE PLUS NACIONAL nas demais unidades da Federação, o beneficiário passa a portar os documentos formais que lhe dão acesso à rede da operadora conveniada CASSI;",
    ];

    const fixedText4 = [
      "    d)   Além da rede assistência da CASSI, caso o beneficiário, por livre opção sua, decida ser assistido em outro Estado da Federação (diferente da Paraíba) através da rede credenciada de outra autogestão do Fisco filiada à FEBRAFITE, é preciso apresentar previamente formal solicitação à AFRAFEP.",
      "",
    ];

    const fixedText5 = [
      `    Ciente do que consta acima, eu, ${beneficiaryName}, matrícula ${registrationCode}, inscrito(a) no CPF sob o nº ${cpfFormatado}, beneficiário titular do plano de saúde AFRAFEP-SAÚDE PLUS NACIONAL, venho solicitar a assistência no Estado ${destinationState}, no período de ${formattedStartDate} a ${formattedEndDate}, por meio de operadora de plano de saúde coirmã da AFRAFEP, em decorrência do Convênio de Reciprocidade existente entre essa AFRAFEP e autogestão do Fisco desse outro Estado filiada à FEBRAFITE.`,
      "",
    ];

    let yOffset = 70; // Initial Y position for fixed text
    [
      ...fixedText,
      ...fixedText1,
      ...fixedText2,
      ...fixedText3,
      ...fixedText4,
      ...fixedText5,
    ].forEach((line) => {
      if (line) {
        const splitText = doc.splitTextToSize(line, 180);
        splitText.forEach((textLine) => {
          doc.text(textLine, 10, yOffset, { Width: 190, align: "justify" });
          yOffset += 5.5; // Space between lines
        });
      } else {
        // If the line is empty, add additional space for the line break
        yOffset += 5; // Adjust the space as needed
      }
    });

    // Adicione dependentes apenas se existirem
    if (hasDependents) {
      const dependentsList = dependents.filter((dep) => dep); // Filtra dependentes vazios
      if (dependentsList.length > 0) {
        doc.setFont("Arial", "normal");
        // Texto inicial para os dependentes
        doc.text(
          "A solicitação acima inclui também os seguintes beneficiários dependentes a mim vinculados ao AFRAFEP-SAÚDE PLUS NACIONAL:",
          10.5,
          yOffset,
          { maxWidth: 190, align: "justify" }
        );
        yOffset += 10; // Aumenta a Y offset após o texto inicial

        function formatarCPF(cpf) {
          // Remove qualquer caractere que não seja número
          const numeros = cpf.replace(/\D/g, "");

          // Verifica se o CPF possui 11 dígitos
          if (numeros.length !== 11) {
            throw new Error("CPF deve ter 11 dígitos.");
          }

          // Formata o CPF
          return numeros
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{2})$/, "$1-$2");
        }

        // Adiciona cada dependente em uma nova linha
        dependentsList.forEach((dependent) => {
          // Formata a data de nascimento para o formato DD/MM/YYYY
          const formattedDate = new Date(
            dependent?.dtNascimento
          ).toLocaleDateString("pt-BR");

          const dependentText = `- ${dependent?.nome} / CPF: ${formatarCPF(
            dependent?.cpf
          )} / CODIGO: ${
            dependent?.codigo
          } / DATA DE NASCIMENTO: ${formattedDate} / MÃE: ${
            dependent?.nmMae
          } / CNS: ${dependent?.cns}.`;

          const splitDependentText = doc.splitTextToSize(dependentText, 190);

          // Verifica se há múltiplas linhas após a quebra
          doc.text(splitDependentText, 10, yOffset, {
            maxWidth: 190,
            align: "justify",
          });

          // Ajusta o espaçamento com base na quantidade de linhas geradas
          yOffset += splitDependentText.length * 5;
        });

        yOffset += -13; // Espaço extra após a lista de dependentes
      }
    }

    function formatarData() {
      const dataAtual = new Date();
      const dia = dataAtual.getDate(); // Dia do mês
      const mes = dataAtual.toLocaleString("pt-BR", { month: "long" }); // Mês por extenso
      const ano = dataAtual.getFullYear(); // Ano

      // Retornar a string formatada
      return `João Pessoa, ${dia} de ${mes} de ${ano}.`;
    }

    // Text "João Pessoa, _____ de _______ de _______" à direita e mais para baixo
    doc.setFont("Arial", "normal");
    yOffset += 22; // Add more space before the location and date text
    const centralText = formatarData();
    const centralTextWidth = doc.getTextWidth(centralText);
    const xRight = pageWidth - 10 - centralTextWidth;
    doc.text(centralText, xRight, yOffset);
    yOffset += 15; // Additional space after location and date

    yOffset += 5;

    // Gera o PROTOCOLO
    const generateProtocol = () => {
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
    const protocolo = generateProtocol();

    // Text "NÚMERO DE PROTOCOLO" com PROTOCOLO em negrito
    const beneficiaryTitleText = `Assinatura do Titular `;
    const beneficiaryTitleWidth = doc.getTextWidth(beneficiaryTitleText);
    const titleCenter = (pageWidth - beneficiaryTitleWidth) / 2;

    // Primeiro, desenha o texto "NÚMERO DE PROTOCOLO: " com a fonte normal
    doc.text(beneficiaryTitleText, titleCenter, yOffset);

    // Ajusta o yOffset para a próxima linha para o PROTOCOLO
    yOffset += -7; // Distância entre as linhas (ajuste conforme necessário)

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
      yOffset += 18; // Aumenta o yOffset se tiver dependentes
    } else {
      yOffset += 39; // Aumenta o yOffset se não tiver dependentes
    }

    if (hasDependents.length > 5) {
      yOffset += 30; // Aumenta o yOffset se houver mais de 6 dependentes
    } else {
      yOffset += -4; // Aumenta o yOffset se houver 6 ou menos dependentes
    }

    if (hasDependents.length == 1) {
      yOffset += 35; // Aumenta o yOffset se houver mais de 6 dependentes
    } else {
      yOffset += 21; // Aumenta o yOffset se houver 6 ou menos dependentes
    }

    if (hasDependents.length == 2) {
      yOffset += 35; // Aumenta o yOffset se houver mais de 6 dependentes
    } else {
      yOffset += -2; // Aumenta o yOffset se houver 6 ou menos dependentes
    }

    if (hasDependents.length == 3) {
      yOffset += 35; // Aumenta o yOffset se houver mais de 6 dependentes
    } else {
      yOffset += 2; // Aumenta o yOffset se houver 6 ou menos dependentes
    }

    if (hasDependents.length == 4) {
      yOffset += 35; // Aumenta o yOffset se houver mais de 6 dependentes
    } else {
      yOffset += -8; // Aumenta o yOffset se houver 6 ou menos dependentes
    }

    const additionalInfo = [
      "Rua: Corálio Soares de Oliveira, nº 497, Centro, João Pessoa – PB, CEP 58.013-260.",
      "Telefone: 3533-5310 - www.afrafepsaude.com.br  @afrafepsaude ",
      "CNPJ: 09.306.242/0001-82.",
    ];

    doc.setTextColor(105, 105, 105); // Cinza escuro (#696969)
    let yOffsetFooter = doc.internal.pageSize.height - 22;

    // Renderiza o texto do rodapé
    additionalInfo.forEach((line, index) => {
      const splitText = doc.splitTextToSize(line, 150);
      splitText.forEach((textLine) => {
        doc.text(textLine, 8, yOffsetFooter);
        yOffsetFooter += 5;
      });
      if (index === additionalInfo.length - 1) {
        yOffsetFooter += 10;
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

    // Save the document
    const pdfFilename = hasDependents
      ? `Termo_de_ciencia_reciprocidade_${beneficiaryName}_dependentes.pdf`
      : `Termo_de_ciencia_reciprocidade_${beneficiaryName}.pdf`;

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
    /* 
    // Salvar o documento
    doc.save(pdfFilename); */
  };

  return (
    <>
      <Menu />
      <div className="container mx-auto flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 mt-[70px]">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Registro de RECIPROCIDADE
          </h1>
        </motion.div>
        <ToastContainer />
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-3xl bg-white p-6 shadow-lg rounded-lg"
        >
          <motion.div
            className="form-group grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <label className="block font-semibold mb-2">
                Nome do Beneficiário:
              </label>
              <input
                className="border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full p-2"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                readOnly
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Matrícula:</label>
              <InputMask
                className="border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full p-2"
                value={maskMatriculaWithAsterisks(registrationCode)}
                onChange={(e) => setRegistrationCode(e.target.value)}
                readOnly
                required
              />
            </div>
          </motion.div>
          <motion.div
            className="form-group grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <label className="block font-semibold mb-2">CPF:</label>
              <InputMask
                className="border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full p-2"
                value={maskCpfWithAsterisks(cpf)}
                onChange={(e) => setCpf(e.target.value)}
                readOnly
                required
              />
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-2">
                Você pode adicionar mais de um UF de Destino:
              </label>
              <div className="flex gap-2 mb-2">
                <select
                  className="border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full"
                  value={selectedUF}
                  onChange={(e) => setSelectedUF(e.target.value)}
                >
                  <option value="">Selecione uma UF</option>
                  {UFs.map((uf) => (
                    <option key={uf.value} value={uf.value}>
                      {uf.label}
                    </option>
                  ))}
                </select>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={addUF}
                    className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 w-[110px]"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {destinationState.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {destinationState.map((uf) => (
                    <div
                      key={uf}
                      className="flex items-center bg-gray-200 px-3 py-1 rounded-full"
                    >
                      <span>{uf}</span>
                      <button
                        type="button"
                        onClick={() => removeUF(uf)}
                        className="ml-2 text-red-600 font-bold hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
          <motion.div
            className="form-group grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <label className="block font-semibold mb-2">
                Data de Início:
              </label>
              <input
                type="date"
                className="border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full p-2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Data de Fim:</label>
              <input
                type="date"
                className="border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full p-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
                required
              />
            </div>
          </motion.div>
          <motion.div
            className="form-group mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {hasDependents && dependents.length > 0 && (
              <label className="block font-semibold mb-2">- Dependentes</label>
            )}
            {hasDependents && (
              <ul className="list-disc ml-6 space-y-2">
                {dependents.map((dependent, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between bg-gray-100 p-2 rounded-md shadow-sm"
                  >
                    {dependent.nome}
                    <button
                      type="button"
                      className="text-white bg-red-500 hover:bg-red-600 p-1 rounded"
                      onClick={() => removeDependent(index)}
                    >
                      Excluir
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
          {filteredAvailableDependents.filter(
            (dep) => !dependents.includes(dep)
          ).length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-4"
            >
              <label className="block font-semibold mb-2">
                Adicionar Dependente:
              </label>
              <select
                className="border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full sm:w-auto p-2 rounded"
                value={newDependent}
                onChange={(e) => handleDependentChange(e.target.value)}
              >
                <option value="">Selecione um dependente</option>
                {filteredAvailableDependents
                  .filter((dep) => !dependents.includes(dep))
                  .map((dep, index) => (
                    <option key={index} value={JSON.stringify(dep)}>
                      {dep.nome}
                    </option>
                  ))}
              </select>
            </motion.div>
          )}
          <motion.div
            className="flex justify-end"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-md shadow-md transition-all duration-300 mt-4 sm:mt-4 ${
                !destinationState || !startDate || !endDate
                  ? "bg-gray-300 text-white-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              disabled={
                !destinationState ||
                !startDate ||
                !endDate ||
                (hasDependents && dependents.some((dep) => dep === ""))
              }
            >
              Salvar{" "}
            </button>
          </motion.div>{" "}
        </motion.form>
      </div>
    </>
  );
}

export default App;

