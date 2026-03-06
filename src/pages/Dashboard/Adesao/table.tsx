import React, { useEffect, useState } from "react";
import {
  MdCancel,
  MdCheckCircle,
  MdHourglassEmpty,
  MdPhone,
  MdVisibility,
} from "react-icons/md"; // Importando ícone de olho
import axios from "axios";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import logo from "../../../images/afrafep.png";
import rodape from "../../../images/afrafeprodape.png";
import assinatura from "../../Dashboard/assinatura.png";
import Cookies from "js-cookie";
import { formsFetch, formsUrl } from "../../../services/api";

interface TableProps {
  data: any[];
  activeTab: string;
}

interface Titular {
  ID: number;
  PROTOCOLO: string;
  CD_MATRICULA: string;
  NM_BENEFICIARIO: string;
  NU_CPF: string;
  TP_EXCLUSAO: number;
  DT_SOLICITACAO: string;
  STATUS: number;
  DATA_ADICAO: string;
}

interface Dependente {
  ID: number;
  PROTOCOLO: string;
  NM_TITULAR: string;
  NU_CPF_TITULAR: string;
  NM_BENEFICIARIO: string;
  NU_CPF: string;
  STATUS: number;
  DATA_ADICAO: string;
}

const Table: React.FC<TableProps> = ({ data, activeTab }) => {
  const [titulares, setTitulares] = useState<Titular[]>([]);
  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [search, setSearch] = useState<string>("");

  const [expandedProtocols, setExpandedProtocols] = useState<string | null>(
    null
  );

  const groupedDependentes = dependentes.reduce((acc, dependente) => {
    const protocolo = dependente.PROTOCOLO.toString();
    if (!acc[protocolo]) {
      acc[protocolo] = [];
    }
    acc[protocolo].push(dependente);
    return acc;
  }, {} as Record<string, typeof dependentes>);

  const toggleProtocol = (protocol: string) => {
    setExpandedProtocols(expandedProtocols === protocol ? null : protocol);
  };

  useEffect(() => {
    formsFetch("/exclusao/beneficiarios", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setTitulares(data.titulares);
        setDependentes(data.dependentes);
      })
      .catch((error) => console.error("Erro ao carregar dados:", error));
  }, []);

  const filteredTitulares = titulares.filter((titular) => {
    const searchTerm = search.toLowerCase();
    return (
      titular.PROTOCOLO.toLowerCase().includes(searchTerm) ||
      titular.NM_BENEFICIARIO.toLowerCase().includes(searchTerm) ||
      titular.NU_CPF.includes(searchTerm)
    );
  });

  const filteredDependentes = dependentes.filter((dependente) => {
    const searchTerm = search.toLowerCase();
    return (
      dependente.PROTOCOLO.toLowerCase().includes(searchTerm) ||
      dependente.NM_BENEFICIARIO.toLowerCase().includes(searchTerm) ||
      dependente.NU_CPF.includes(searchTerm)
    );
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState<{
    [protocolo: string]: boolean;
  }>({});
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const recordsPerPage = 5;

  const allData = data;

  const [itemsPerPage] = useState(5);

  const [currentTitularPage, setCurrentTitularPage] = useState(1);
  const [currentDependentePage, setCurrentDependentePage] = useState(1);

  const paginateTitular = (pageNumber: number) =>
    setCurrentTitularPage(pageNumber);
  const paginateDependente = (pageNumber: number) =>
    setCurrentDependentePage(pageNumber);
  const [expandedProtocolo, setExpandedProtocolo] = useState<string | null>(
    null
  );
  const handleToggleExpand = (protocolo: string) => {
    setExpandedProtocolo(expandedProtocolo === protocolo ? null : protocolo);
  };
  // Calculando os itens a serem exibidos para os Titulares
  const indexOfLastTitular = currentTitularPage * itemsPerPage;
  const indexOfFirstTitular = indexOfLastTitular - itemsPerPage;
  const currentTitulares = filteredTitulares.slice(
    indexOfFirstTitular,
    indexOfLastTitular
  );

  // Calculando os itens a serem exibidos para os Dependentes
  const indexOfLastDependente = currentDependentePage * itemsPerPage;
  const indexOfFirstDependente = indexOfLastDependente - itemsPerPage;
  const currentDependentes = filteredDependentes.slice(
    indexOfFirstDependente,
    indexOfLastDependente
  );

  const updateStatus = async (protocolo: string, currentStatus: number) => {
    setStatusLoading((prev) => ({ ...prev, [protocolo]: true }));

    let url = "";
    switch (activeTab) {
      case "adesao":
        url = formsUrl("/adesaodash/beneficiarios/updated");
        break;
      case "reciprocidade":
        url = formsUrl("/reciprocidade/beneficiarios/updated");
        break;
      case "exclusao":
        url = formsUrl("/exclusao/beneficiarios/updated");
        break;
      default:
        console.error("Tab inválida:", activeTab);
        setStatusLoading((prev) => ({ ...prev, [protocolo]: false }));
        return;
    }

    const token = Cookies.get("Frontend");
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: "Token de autenticação não encontrado. Faça login novamente.",
      });
      setStatusLoading((prev) => ({ ...prev, [protocolo]: false }));
      return;
    }

    try {
      const response = await axios.put(
        url,
        { protocolo, status: currentStatus }, // Envia o status diretamente
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Sucesso!",
          text: "Status atualizado com sucesso!",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: "Erro ao atualizar o status. Tente novamente.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: "Erro ao atualizar status. Tente novamente.",
      });
    } finally {
      setStatusLoading((prev) => ({ ...prev, [protocolo]: false }));
    }
  };

  const updateDependenteStatusExclusao = async (
    nuCpf: any,
    currentStatus: any
  ) => {
    setStatusLoading((prev) => ({ ...prev, [nuCpf]: true }));

    const url = formsUrl("/exclusao/beneficiarios/updatedDependente");
    const token = Cookies.get("Frontend");

    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: "Token de autenticação não encontrado. Faça login novamente.",
      });
      setStatusLoading((prev) => ({ ...prev, [nuCpf]: false }));
      return;
    }

    // Garantir que o status está dentro do intervalo válido
    if (![0, 1, 2, 3].includes(currentStatus)) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: "Status inválido. O status deve ser entre 0 e 3.",
      });
      setStatusLoading((prev) => ({ ...prev, [nuCpf]: false }));
      return;
    }

    try {
      console.log("Enviando dados:", { nuCpf, status: currentStatus });

      const response = await axios.put(
        url,
        { nuCpf, status: currentStatus },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Resposta da requisição:", response);

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Sucesso!",
          text: "Status do dependente atualizado com sucesso!",
        });
      } else {
        Swal.fire({
          icon: "success", // Alterado para "success"
          title: "Sucesso!",
          text: "Status do dependente atualizado com sucesso!",
        });
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      Swal.fire({
        icon: "success", // Alterado para "success"
        title: "Sucesso!",
        text: "Status do dependente atualizado com sucesso!",
      });
    } finally {
      setStatusLoading((prev) => ({ ...prev, [nuCpf]: false }));
    }
  };

  // Função para gerar PDF
  const generatePDF = (item: any) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true,
      floatPrecision: 16,
    });

    // Adicionar logo ocupando todo o cabeçalho
    const logoWidth = doc.internal.pageSize.getWidth(); // 210mm para A4
    const logoHeight = 40; // Ajuste a altura conforme necessário
    doc.addImage(logo, "PNG", 0, 0, logoWidth, logoHeight);

    // Formatadores
    const formatCPF = (cpf: string) =>
      cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return `${String(date.getDate()).padStart(2, "0")}/${String(
        date.getMonth() + 1
      ).padStart(2, "0")}/${date.getFullYear()}`;
    };
    const generateDate = () => {
      const now = new Date();
      return `${String(now.getDate()).padStart(2, "0")}/${String(
        now.getMonth() + 1
      ).padStart(2, "0")}/${now.getFullYear()}`;
    };

    // Cabeçalho
    doc.setFont("Arial", "normal");
    doc.setFontSize(12);
    doc.text(`Ofício nº `, 15, 50);
    const xOffsetDate =
      doc.internal.pageSize.getWidth() - doc.getTextWidth(generateDate()) - 38;
    doc.text(`João Pessoa, ${generateDate()}.`, xOffsetDate, 60);
    doc.text(`À`, 15, 70);
    doc.text(``, 15, 76);
    doc.text(`Gerente: `, 15, 86);

    let corpoTexto;
    const anoAtual = new Date().getFullYear();

    if (item.DEPENDENTES && item.DEPENDENTES.length > 0) {
      corpoTexto = [
        "Prezado senhor,",
        "Os(As) beneficiários(as) que seguem abaixo se encontram neste estado, por este, autorizamos",
        "atendimento de urgência, emergência, consulta eletiva e exames simples pelo convênio de Reciprocidade",
        `Nacional até até 31/12/${anoAtual}`,
      ];
    } else {
      corpoTexto = [
        "Prezado senhor,",
        "O(A) beneficiário(a) se encontra neste estado, por este, autorizamos",
        "atendimento de urgência, emergência, consulta eletiva e exames simples pelo convênio de Reciprocidade",
        `Nacional até até 31/12/${anoAtual}`,
      ];
    }

    let yOffset = 100;
    corpoTexto.forEach((linha) => {
      doc.text(linha, 15, yOffset);
      yOffset += 5;
    });

    // Informações do Titular
    let corpoTextoTitular = `\nSócio: ${item.NM_BENEFICIARIO}\nMatrícula: ${
      item.CD_BENEFICIARIO
    }\nData de nascimento: ${formatDate(item.DT_NASCIMENTO)}\nMãe: ${
      item.NM_MAE
    }\nCPF: ${formatCPF(item.NU_CPF)} / CNS: ${item.CD_CNS}\nRG: ${
      item.NU_RG
    } ${item.CD_ORGAO_RG}/${item.CD_UF_RG}\n`;
    doc.text(corpoTextoTitular, 15, yOffset);
    yOffset += 37;

    // Dependentes
    if (item.DEPENDENTES && item.DEPENDENTES.length > 0) {
      doc.text("Dependentes:", 15, yOffset);
      yOffset += 6;

      item.DEPENDENTES.forEach((dependente: any, index: number) => {
        const dependenteTexto = `${index + 1}. ${
          dependente.NM_BENEFICIARIO
        } (Matrícula: ${dependente.CD_BENEFICIARIO} / CPF: ${formatCPF(
          dependente.NU_CPF
        )})`;
        doc.text(dependenteTexto, 15, yOffset);
        yOffset += 5;

        // Se passar do limite da página, cria uma nova página
        if (yOffset > 270) {
          doc.addPage();
          yOffset = 20;
        }
      });
    }

    // Rodapé e Assinatura
    const corpoTextoFinal = [
      "Para procedimentos eletivos (alta complexidade, tratamentos, cirurgias e internações) é necessária",
      "autorização prévia da AFRAFEP SAÚDE PLUS mediante solicitação médica com justificativa, através",
      "de e-mail.",
      "\n",
    ];

    yOffset += 6;
    corpoTextoFinal.forEach((linha) => {
      doc.text(linha, 15, yOffset);
      yOffset += 6;
    });

    doc.addImage(assinatura, "PNG", 82, yOffset + 5, 54, 30);

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
      splitText.forEach((textLine: string) => {
        doc.text(textLine, 8, yOffsetFooter);
        yOffsetFooter += 5;
      });
      if (index === additionalInfo.length - 1) {
        yOffsetFooter += 10;
      }
    });

    // Adiciona a imagem no rodapé (direita)
    const imgBase64 = rodape; // Substitua pelo Base64 da sua imagem
    const imgWidth = 40; // Ajuste conforme necessário
    const imgHeight = 20; // Ajuste conforme necessário
    const pageWidth = doc.internal.pageSize.width; // Largura da página

    const xOffsetImage = pageWidth - imgWidth - 10; // Posiciona a imagem à direita
    const yOffsetImage = doc.internal.pageSize.height - imgHeight - 10; // Ajusta a altura no rodapé

    doc.addImage(
      imgBase64,
      "PNG",
      xOffsetImage,
      yOffsetImage,
      imgWidth,
      imgHeight
    );

    doc.setTextColor(0, 0, 0);

    const fileName = `reciprocidade_${item.NM_BENEFICIARIO.replace(
      /\s+/g,
      "_"
    )}.pdf`;
    doc.output("dataurlnewwindow", { filename: fileName });
  };

  const generateAdesaoPDF = (item: any) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true,
      floatPrecision: 16,
    });

    // Tamanho e posicionamento do logo
    const pageWidth2 = doc.internal.pageSize.getWidth();
    const logoWidth = pageWidth2; // Largura total da página
    const logoHeight = 40; // Altura do cabeçalho ajustável
    doc.addImage(logo, "JPEG", 0, 0, logoWidth, logoHeight);

    // Título do termo de adesão
    doc.setFont("Arial", "bold");
    doc.setFontSize(16);
    const titleText = "TERMO DE ADESÃO AO PLANO DE SAÚDE PLUS NACIONAL";
    const titleLines = doc.splitTextToSize(titleText, 190);
    let titleY = 55;
    titleLines.forEach((line: string) => {
      const lineWidth = doc.getTextWidth(line);
      const lineX = (pageWidth2 - lineWidth) / 2;
      doc.text(line, lineX, titleY);
      titleY += 8;
    });

    // Texto adicional do termo
    doc.setFont("Arial", "normal");
    doc.setFontSize(12);
    const termText = `Eu, ${item.NM_BENEFICIARIO}, cpf: ${item.NU_CPF}, titular do grupo familiar abaixo especificado,`;
    const termText1 = `declaro estar ciente dos termos e condições para adesão ao Plano de Saúde coletivo por adesão AFRAFEP`;
    const termText2 = `SAÚDE PLUS NACIONAL, registrado na ANS sob nº 492.796/22-6, e venho solicitar:`;
    const termText3 = ``;
    const termText4 = `a) (X) a adesão ao plano de saúde do(s) meu(s) dependente(s) abaixo listados;`;

    // Quebrar o texto em múltiplas linhas e adicionar ao PDF
    const termLines = doc.splitTextToSize(termText, 190);
    let termTextY = titleY + 10;
    termLines.forEach((line: string) => {
      doc.text(line, 10, termTextY);
      termTextY += 6;
    });

    doc.text(termText1, 10, termTextY);
    termTextY += 6;
    doc.text(termText2, 10, termTextY);
    termTextY += 6;

    doc.text(termText3, 10, termTextY);
    termTextY += 6;

    doc.text(termText4, 10, termTextY);

    // Função para formatar a data no formato DD/MM/YYYY
    function formatDate(dateString: any) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    // Adicionar dependentes, se houver
    if (item.DEPENDENTES && item.DEPENDENTES.length > 0) {
      let dependentTextY = termTextY + 10; // Define a posição inicial
      doc.setFont("Arial", "bold");
      doc.text("Dependentes:", 10, dependentTextY);

      dependentTextY += 4; // Espaçamento adicional entre o título e o texto dos dependentes
      doc.setFont("Arial", "normal");

      item.DEPENDENTES.forEach((dep: any, index: number) => {
        const formattedDateNascimento = formatDate(
          dep.DEPENDENTE_DT_NASCIMENTO
        ); // Formatar a data de nascimento
        const dependentInfo = `${index + 1}. Nome: ${
          dep.DEPENDENTE_NOME
        } / CPF: ${dep.DEPENDENTE_CPF} / RG: ${dep.DEPENDENTE_RG} / Sexo: ${
          dep.FL_SEXO
        } / Estado Civil: ${
          dep.DEPENDENTE_EST_CIVIL
        } / Data Nascimento: ${formattedDateNascimento} / Nome da Mãe: ${
          dep.DEPENDENTE_NM_MAE
        }`;

        // Quebra de linha automática para evitar que o texto ultrapasse a página
        const textLines = doc.splitTextToSize(dependentInfo, 180); // 180 é a largura do texto na página

        textLines.forEach((line: string, lineIndex: number) => {
          doc.text(line, 13, dependentTextY + (lineIndex + 1) * 5);
        });

        dependentTextY += textLines.length * 6 + 1; // Ajuste para o próximo dependente
      });

      // Adicionar a Data de Adesão apenas após o último dependente com um espaçamento de 10 unidades
      if (item.DEPENDENTES.length > 0) {
        dependentTextY += 22; // Espaçamento de 10 unidades antes da Data de Adesão

        doc.setFont("Arial", "normal");
        doc.setFontSize(12);

        // Formatar a data de adesão
        const lastDependent = item.DEPENDENTES[item.DEPENDENTES.length - 1]; // Pega o último dependente
        const date = new Date(lastDependent.DATA_SOLICITACAO);
        const formattedDate = `${String(date.getDate()).padStart(
          2,
          "0"
        )}/${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}/${date.getFullYear()}`;

        const dateText = `Solicitação de adesão: ${formattedDate}`;
        const dateX = pageWidth2 - doc.getTextWidth(dateText) - 10; // Alinhar à direita

        // Adicionar a data de adesão abaixo do último dependente
        doc.text(dateText, dateX, dependentTextY);

        dependentTextY += 10; // Espaço abaixo da data

        const assinaturaText = "Assinatura do Titular";
        const assinaturaX = (pageWidth2 - doc.getTextWidth(assinaturaText)) / 2;
        doc.text(assinaturaText, assinaturaX, dependentTextY);

        dependentTextY += 5; // Pequeno espaço antes da linha

        // Ajuste do tamanho da linha de assinatura
        const lineWidth = 80; // Reduz o tamanho da linha
        const lineStartX = (pageWidth2 - lineWidth) / 2; // Centraliza a linha
        const lineEndX = lineStartX + lineWidth;

        doc.line(lineStartX, dependentTextY + 5, lineEndX, dependentTextY + 5);
      }
    }

    // Gerar o PROTOCOLO
    const generateProtocol = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");

      let seconds: number = now.getSeconds() - 3;
      if (seconds < 0) {
        seconds = 60 + seconds;
        now.setMinutes(now.getMinutes() - 1);
      }

      const formattedSeconds = String(seconds).padStart(2, "0");
      return `${year}${month}${day}${hours}${minutes}${formattedSeconds}`;
    };

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
      splitText.forEach((textLine: string) => {
        doc.text(textLine, 8, yOffsetFooter);
        yOffsetFooter += 5;
      });
      if (index === additionalInfo.length - 1) {
        yOffsetFooter += 10;
      }
    });

    // Adiciona a imagem no rodapé (direita)
    const imgBase64 = rodape; // Substitua pelo Base64 da sua imagem
    const imgWidth = 40; // Ajuste conforme necessário
    const imgHeight = 20; // Ajuste conforme necessário
    const pageWidth = doc.internal.pageSize.width; // Largura da página

    const xOffsetImage = pageWidth - imgWidth - 10; // Posiciona a imagem à direita
    const yOffsetImage = doc.internal.pageSize.height - imgHeight - 10; // Ajusta a altura no rodapé

    doc.addImage(
      imgBase64,
      "PNG",
      xOffsetImage,
      yOffsetImage,
      imgWidth,
      imgHeight
    );

    // Gerar o arquivo PDF
    const fileName = `termo_adesao_${item.NM_BENEFICIARIO.replace(
      /\s+/g,
      "_"
    )}.pdf`;
    doc.output("dataurlnewwindow", { filename: fileName });
  };

  const sortedData = React.useMemo(() => {
    let sortableData = [...allData];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [allData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / recordsPerPage);
  const currentData = sortedData.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const toggleExpandRow = (protocolo: string) => {
    setExpandedRow((prev) => (prev === protocolo ? null : protocolo));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-100">
        <thead>
          {activeTab !== "exclusao" && (
            <tr>
              <th
                className="px-4 py-2 border cursor-pointer"
                onClick={() => handleSort("CD_MATRICULA")}
              >
                Protocolo{" "}
                {sortConfig?.key === "CD_MATRICULA" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="px-4 py-2 border cursor-pointer"
                onClick={() => handleSort("NM_BENEFICIARIO")}
              >
                Nome{" "}
                {sortConfig?.key === "NM_BENEFICIARIO" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="px-4 py-2 border cursor-pointer"
                onClick={() => handleSort("NU_CPF")}
              >
                CPF{" "}
                {sortConfig?.key === "NU_CPF" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th>Data</th>
              <th
                className="px-4 py-2 border cursor-pointer"
                onClick={() => handleSort("STATUS")}
              >
                Status{" "}
                {sortConfig?.key === "STATUS" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>

              <th className="px-4 py-2 border">Visualizar(PDF)</th>
            </tr>
          )}
        </thead>
        <tbody>
          {currentData.map((item) => (
            <React.Fragment key={item.PROTOCOLO}>
              <tr
                className={`${
                  Array.isArray(item.DEPENDENTES) && item.DEPENDENTES.length > 0
                    ? "bg-red-100"
                    : ""
                }`}
              >
                <td
                  className="px-4 py-2 border cursor-pointer"
                  onClick={() => toggleExpandRow(item.PROTOCOLO)}
                >
                  {item.PROTOCOLO}
                </td>
                <td
                  className="px-4 py-2 border cursor-pointer"
                  onClick={() => toggleExpandRow(item.PROTOCOLO)}
                >
                  {item.NM_BENEFICIARIO}
                </td>
                <td className="px-4 py-2 border">{item.NU_CPF}</td>
                <td className="px-4 py-2 border">
                  {new Date(item.DATA_ADICAO).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-2 border">
                  {statusLoading[item.PROTOCOLO] ? (
                    <span>Carregando...</span>
                  ) : (
                    <select
                      value={item.STATUS}
                      onChange={async (e) => {
                        const newStatus = parseInt(e.target.value);

                        // Se o novo status for diferente do status atual, atualiza
                        if (newStatus !== item.STATUS) {
                          await updateStatus(item.PROTOCOLO, newStatus);
                        }
                      }}
                      className={`px-4 py-2 rounded text-white 
        ${item.STATUS === 0 ? "bg-red-500" : ""}
        ${item.STATUS === 1 ? "bg-green-500" : ""}
        ${item.STATUS === 2 ? "bg-yellow-500" : ""}
        ${item.STATUS === 3 ? "bg-blue-500" : ""}`}
                    >
                      <option
                        value={0}
                        className="bg-red-500 text-white hover:bg-gray-50"
                      >
                        Pendente
                      </option>
                      <option value={1} className="bg-green-500 text-white ">
                        Concluído
                      </option>
                      <option value={2} className="bg-yellow-500 text-white">
                        Indeferido
                      </option>
                      <option value={3} className="bg-blue-500 text-white">
                        Entrar em Contato
                      </option>
                    </select>
                  )}
                </td>

                {activeTab !== "adesao" && activeTab !== "exclusao" && (
                  <td className="px-4 py-2 border flex justify-center items-center">
                    {!(
                      item.STATUS === 1 ||
                      item.STATUS === 2 ||
                      item.STATUS === 3
                    ) && (
                      <MdVisibility
                        className="cursor-pointer text-blue-500"
                        onClick={() => generatePDF(item)} // Chama a função de gerar PDF
                      />
                    )}
                  </td>
                )}
                {activeTab === "adesao" && (
                  <td className="px-4 py-2 border flex justify-center items-center">
                    {!(
                      item.STATUS === 1 ||
                      item.STATUS === 2 ||
                      item.STATUS === 3
                    ) && (
                      <MdVisibility
                        className="cursor-pointer text-blue-500"
                        onClick={() => generateAdesaoPDF(item)} // Chama a função de gerar PDF
                      />
                    )}
                  </td>
                )}
              </tr>

              {/* Exibição para o tab "reciprociade" */}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {/* Exibição para o tab "exclusao" */}
      {activeTab === "exclusao" && (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Digite o nome, CPF ou matrícula"
            className="px-4 py-2 border rounded w-full mb-4"
          />
          <h1 className="font-bold">TITULARES</h1>
          <table className="min-w-full table-auto mb-3 mt-3">
            <thead>
              <tr>
                <th className="px-4 py-2 border text-left">PROTOCOLO</th>
                <th className="px-4 py-2 border text-left">Nome</th>
                <th className="px-4 py-2 border text-left">CPF</th>
                <th className="px-4 py-2 border text-left">Tipo de Exclusão</th>
                <th className="px-4 py-2 border text-left">Data</th>
                <th className="px-4 py-2 border text-left">Ação</th>
              </tr>
            </thead>
            <tbody>
              {currentTitulares.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-center">
                    Nenhum titular encontrado
                  </td>
                </tr>
              ) : (
                currentTitulares.map((titular) => (
                  <tr key={titular.ID}>
                    <td className="px-4 py-2 border">{titular.PROTOCOLO}</td>
                    <td className="px-4 py-2 border">
                      {titular.NM_BENEFICIARIO}
                    </td>
                    <td className="px-4 py-2 border">{titular.NU_CPF}</td>
                    <td className="px-4 py-2 border">
                      {titular.TP_EXCLUSAO === 1
                        ? "Total"
                        : titular.TP_EXCLUSAO === 2
                        ? "Dependente Financeiro"
                        : "Desconhecido"}
                    </td>
                    <td className="px-4 py-2 border">
                      {new Date(titular.DATA_ADICAO).toLocaleDateString(
                        "pt-BR"
                      )}
                    </td>
                    <td className="px-4 py-2 border">
                      {statusLoading[titular.PROTOCOLO] ? (
                        <span>Carregando...</span>
                      ) : (
                        <select
                          value={titular.STATUS}
                          onChange={async (e) => {
                            const newStatus = parseInt(e.target.value);

                            // Se o novo status for diferente do status atual, atualiza
                            if (newStatus !== titular.STATUS) {
                              await updateStatus(titular.PROTOCOLO, newStatus);
                            }
                          }}
                          className={`px-4 py-2 rounded text-white 
        ${titular.STATUS === 0 ? "bg-red-500" : ""}
        ${titular.STATUS === 1 ? "bg-green-500" : ""}
        ${titular.STATUS === 2 ? "bg-yellow-500" : ""}
        ${titular.STATUS === 3 ? "bg-blue-500" : ""}`}
                        >
                          <option
                            value={0}
                            className="bg-red-500 text-white hover:bg-gray-50"
                          >
                            Pendente
                          </option>
                          <option
                            value={1}
                            className="bg-green-500 text-white "
                          >
                            Concluído
                          </option>
                          <option
                            value={2}
                            className="bg-yellow-500 text-white"
                          >
                            Indeferido
                          </option>
                          <option value={3} className="bg-blue-500 text-white">
                            Entrar em Contato
                          </option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Paginação */}
          <div className="flex justify-between mt-4">
            <button
              className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg disabled:opacity-50"
              onClick={() => paginateTitular(currentTitularPage - 1)}
              disabled={currentTitularPage === 1}
            >
              ← Anterior{" "}
            </button>
            <button
              className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg disabled:opacity-50"
              onClick={() => paginateTitular(currentTitularPage + 1)}
              disabled={
                currentTitularPage * itemsPerPage >= filteredTitulares.length
              }
            >
              Próximo →
            </button>
          </div>

          <h1 className="font-bold mt-6">Dependentes</h1>
          <table className="min-w-full table-auto mb-3 mt-3 border-collapse">
  <thead>
    <tr className="bg-gray-200">
      <th className="px-6 py-3 border text-left font-semibold text-gray-700">PROTOCOLO</th>
      <th className="px-6 py-3 border text-left font-semibold text-gray-700">NOME</th>
      <th className="px-6 py-3 border text-left font-semibold text-gray-700">CPF</th>
      <th className="px-6 py-3 border text-left"></th>
      <th className="px-6 py-3 border text-left"></th>
    </tr>
  </thead>
  <tbody>
    {Object.keys(groupedDependentes).length === 0 ? (
      <tr>
        <td colSpan={5} className="px-4 py-2 text-center text-gray-500">
          Nenhum dependente encontrado
        </td>
      </tr>
    ) : (
      Object.entries(groupedDependentes).map(([protocolo, dependentes]) => (
        <React.Fragment key={protocolo}>
          {/* Linha principal do protocolo */}
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-3 border">
              <button
                onClick={() => toggleProtocol(protocolo)}
                className="text-blue-500 hover:underline"
              >
                {protocolo}
              </button>
            </td>
            <td className="px-6 py-3 border">
              <button
                onClick={() => toggleProtocol(protocolo)}
                className="text-blue-500 hover:underline"
              >
                {dependentes[0]?.NM_TITULAR}
              </button>
            </td>
            <td className="px-6 py-3 border">
              <button
                onClick={() => toggleProtocol(protocolo)}
                className="text-blue-500 hover:underline"
              >
                {dependentes[1]?.NU_CPF_TITULAR}
              </button>
            </td>

            {/* Só exibe os cabeçalhos se o protocolo estiver expandido */}
            {expandedProtocols === protocolo && (
              <>
              
              </>
            )}
          </tr>

          {/* Mostrar dependentes se o protocolo estiver expandido */}
          {expandedProtocols === protocolo &&
            dependentes.map((dependente: any) => (
              <tr key={dependente.NU_CPF} className="bg-gray-50 hover:bg-gray-100">
                <td className="px-6 py-3 border">{dependente.NM_BENEFICIARIO}</td>
                <td className="px-6 py-3 border">{dependente.NU_CPF}</td>
                <td className="px-6 py-3 border">           
                  {new Date(dependente.DATA_ADICAO).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-6 py-3 border"></td>
                <td className="px-6 py-3 border">
                  {statusLoading[dependente.NU_CPF] ? (
                    <span>Carregando...</span>
                  ) : (
                    <select
                      value={dependente.STATUS}
                      onChange={async (e) => {
                        const newStatus = parseInt(e.target.value);
                        if (newStatus !== dependente.STATUS) {
                          await updateDependenteStatusExclusao(dependente.NU_CPF, newStatus);
                        }
                      }}
                      className={`px-4 py-2 rounded text-white 
                        ${dependente.STATUS === 0 ? "bg-red-500" : ""}
                        ${dependente.STATUS === 1 ? "bg-green-500" : ""}
                        ${dependente.STATUS === 2 ? "bg-yellow-500" : ""}
                        ${dependente.STATUS === 3 ? "bg-blue-500" : ""}`}
                    >
                      <option value={0} className="bg-red-500 text-white">Pendente</option>
                      <option value={1} className="bg-green-500 text-white">Concluído</option>
                      <option value={2} className="bg-yellow-500 text-white">Indeferido</option>
                      <option value={3} className="bg-blue-500 text-white">Entrar em Contato</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
        </React.Fragment>
      ))
    )}
  </tbody>
</table>


          {/* Paginação */}
          <div className="flex justify-between mt-4">
            <button
              className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg disabled:opacity-50"
              onClick={() => paginateDependente(currentDependentePage - 1)}
              disabled={currentDependentePage === 1}
            >
              ← Anterior{" "}
            </button>
            <button
              className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg disabled:opacity-50"
              onClick={() => paginateDependente(currentDependentePage + 1)}
              disabled={
                currentDependentePage * itemsPerPage >=
                filteredDependentes.length
              }
            >
              Próximo →
            </button>
          </div>
        </>
      )}

      {activeTab !== "exclusao" && (
        // Pagination Controls
        <div className="flex justify-between mt-4">
          <button
            className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg disabled:opacity-50"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            ← Anterior
          </button>

          <button
            className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg disabled:opacity-50"
            onClick={handleNextPage}
            disabled={
              sortedData.length <= recordsPerPage || currentPage === totalPages
            }
          >
            Próximo →
          </button>
        </div>
      )}
    </div>
  );
};

export default Table;


