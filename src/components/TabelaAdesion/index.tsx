import React, { useEffect, useState } from "react";
import "./styles.css";
import { jsPDF } from "jspdf";
import logo from "../../images/afrafep.png";
import rodape from "../../images/afrafeprodape.png";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import {
  CHAVE_TOKEN,
  MOCK_CPF,
  formsFetch,
  formsUrl,
  getBearerHeaders,
  getChaveUnica,
} from "../../services/api";

interface Dependent {
  nome: string;
  dataNascimento: string;
  estadoCivil: string;
  cpf: string;
  rg: string;
  uf_rg: string;
  uf_emissor_rg: string;
  cartaoSus: string;
  sexoDependente: string;
  nomeMae: string;
  parentesco: string;
  telefones: string;
  email: string;
}

interface TitularData {
  cdBeneficiario: string;
  tipoDependente: string;
  codigo: string;
  nome: string;
  cpf: string;
  matricula: string;
  celular: string;
  email: string;
  nmMae: string;
  dtNascimento: string;
  cns: string;
  formaPagamento: number;
  rg: string;
  orgaoRg: string;
  ufRg: string;
  logradouro: string;
  numero: number;
  complemento: string;
  cidade: string;
  bairro: string;
  uf: string;
  cep: string;
  telefone: string | null;
  titular: number;
  formaEnvio: string;
  sexo: string;
}
const Tabela: React.FC = () => {
  const navigate = useNavigate();

  const [titularData, setTitularData] = useState<TitularData | null>(null);
  const [titular, setTitular] = useState("");
  const [cpf, setCpf] = useState("");
  const [matricula, setMatricula] = useState("");
  const [sexo, setSexo] = useState("");
  const [telefones, setTelefones] = useState("");
  const [email, setEmail] = useState("");
  const [portabilidade, setPortabilidade] = useState("");
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [envioBoleto, setEnvioBoleto] = useState("");
  const [pagamento, setPagamento] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [banco, setBanco] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const [error, setError] = useState<string>("");
  const [error3, setError3] = useState<{ [key: number]: string }>({});
  const [phoneErrors, setPhoneErrors] = useState<{ [key: number]: string }>({});
  const [emailErrors, setEmailErrors] = useState<{ [key: number]: string }>({});
  const [dateErrors, setDateErrors] = useState<{ [key: number]: string }>({});

  const [detalhe, setDetalhe] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false); // Controle do modal

  const queryParams = new URLSearchParams(window.location.search);
  const chavePasse = queryParams.get("chavePasse") || ""; // Valor da URL ou string vazia

  useEffect(() => {
    const fetchBeneficiaryData = async () => {
      try {
        if (!chavePasse && !MOCK_CPF) {
          console.error("Chave Passe não foi fornecida na URL.");
          return;
        }

        const chaveUnica = await getChaveUnica(chavePasse, {
          preferCache: true,
          allowFetch: true,
        });

        if (!chaveUnica) {
          console.error("Chave Unica não encontrada na resposta.");
          return;
        }

        const secondResponse = await axios.get(
          formsUrl(`/beneficiarios/cpf/${chaveUnica}`),
          {
            headers: getBearerHeaders(CHAVE_TOKEN),
          }
        );

        if (
          secondResponse.data &&
          Array.isArray(secondResponse.data.data) &&
          secondResponse.data.data.length > 0
        ) {
          const titularApiData = secondResponse.data.data[0];
          const mappedTitularData: TitularData = {
            cdBeneficiario: titularApiData.CD_BENEFICIARIO,
            tipoDependente: titularApiData.DS_TIPO_DEPENDENTE,
            codigo: titularApiData.CD_BENEFICIARIO,
            nome: titularApiData.NM_BENEFICIARIO,
            cpf: titularApiData.NU_CPF,
            matricula: titularApiData.CD_MATRICULA,
            celular: titularApiData.CELULAR,
            email: titularApiData.EMAIL,
            nmMae: "",
            dtNascimento: titularApiData.DT_NASCIMENTO,
            cns: titularApiData.CD_CNS || titularApiData.cd_cns || "",
            formaPagamento: titularApiData.CD_FORMA_PAGAMENTO,
            rg: titularApiData.NU_RG,
            orgaoRg: titularApiData.CD_ORGAO_RG,
            ufRg: titularApiData.CD_UF_RG,
            logradouro: titularApiData.DS_LOGRADOURO,
            numero: titularApiData.NU_NUMERO,
            complemento: titularApiData.DS_COMPLEMENTO,
            cidade: titularApiData.NM_CIDADE,
            bairro: titularApiData.NM_BAIRRO,
            uf: titularApiData.CD_UF,
            cep: titularApiData.CD_CEP,
            telefone: null,
            titular: 1,
            formaEnvio: titularApiData.DS_FORMA_ENVIO,
            sexo: titularApiData.FL_SEXO,
          };

          // Armazena todos os dados do titular no formato interno da tela
          setTitularData(mappedTitularData);

          const {
            nome: beneficiaryName,
            cpf: beneficiaryCpf,
            matricula: registrationCode,
            sexo,
            celular: telefones,
            email,
            formaPagamento: pagamento,
          } = mappedTitularData;

          setTitular(beneficiaryName);
          setCpf(beneficiaryCpf);
          setSexo(sexo);
          setMatricula(registrationCode);
          setTelefones(telefones);
          setEmail(email);
          setPagamento(pagamento.toString());
        } else {
          throw new Error("No valid data received");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do beneficiário:", error);
      }
    };

    fetchBeneficiaryData();
  }, [chavePasse]);

  const addDependent = () => {
    setDependents([
      ...dependents,
      {
        nome: "",
        dataNascimento: "",
        estadoCivil: "",
        cpf: "",
        rg: "",
        uf_rg: "",
        uf_emissor_rg: "",
        cartaoSus: "",
        sexoDependente: "",
        nomeMae: "",
        parentesco: "",
        telefones: "",
        email: "",
      },
    ]);
  };

  const DependentRemoved = () => {
    toast.success("Dependente removido com sucesso.", {
      position: "top-center",
      autoClose: 5500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      closeButton: false,
      theme: "dark",
    });
  };

  const DependentInfo = () => {
    toast.info("Remoção cancelada..", {
      position: "top-center",
      autoClose: 5500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      closeButton: false,
      theme: "dark",
    });
  };

  const removeDependent = async (index: number) => {
    const dependentToRemove = dependents[index];

    const result = await Swal.fire({
      title: "Você realmente deseja remover este dependente?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      // Fazer a requisição para a API para remover o dependente da tabela
      try {
        // Monta a URL com CPF e RG do dependente
        const response = await formsFetch(
          `/adesao/${dependentToRemove.cpf}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          // Se a remoção foi bem-sucedida, atualiza o estado da tabela de dependentes
          const newDependents = dependents.filter((_, i) => i !== index);
          setDependents(newDependents);
          DependentRemoved(); // Chamar função de sucesso
        } else {
          // Caso haja um erro na remoção
          const errorData = await response.json();
          Swal.fire({
            icon: "error",
            title: "Erro!",
            text: errorData.message || "Não foi possível remover o dependente.",
          });
        }
      } catch (error) {
        console.error("Erro ao remover dependente:", error);
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: "Erro de conexão com a API.",
        });
      }
    } else {
      DependentInfo(); // Chamar função para mostrar informações
    }
  };

  const formatDate = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const validDDDs = [
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "21",
    "22",
    "24",
    "27",
    "28",
    "31",
    "32",
    "33",
    "34",
    "35",
    "37",
    "38",
    "41",
    "42",
    "43",
    "44",
    "45",
    "46",
    "47",
    "48",
    "49",
    "51",
    "53",
    "54",
    "55",
    "61",
    "62",
    "63",
    "64",
    "65",
    "66",
    "67",
    "68",
    "69",
    "71",
    "73",
    "74",
    "75",
    "77",
    "79",
    "81",
    "82",
    "83",
    "84",
    "85",
    "86",
    "87",
    "88",
    "89",
    "91",
    "92",
    "93",
    "94",
    "95",
    "96",
    "97",
    "98",
    "99",
  ];

  const formatTelefones = (value: string): string => {
    // Verifica se o valor tem 11 dígitos (considerando DDD)
    if (value.length < 11) return value; // Retorna sem formatação se não tiver pelo menos 11 dígitos

    // Formata o telefone
    return value.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3"); // Formato (XX) 9XXXX-XXXX
  };

  /*  const handleCarenciaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const novoCarencia = event.target.value;
    setCarencia(novoCarencia);
    localStorage.setItem("Carencia", novoCarencia);
  }; */
  const handleOpcaoChange = (value: string) => {
    setPortabilidade(value); // Atualiza o estado
    localStorage.setItem("Portabilidade", value); // Armazena no localStorage
  };

  const handleDependentesChange = (
    index: number,
    field: keyof Dependent,
    value: string
  ) => {
    const newDependents = [...dependents];
    newDependents[index][field] = value;
    setDependents(newDependents);
    localStorage.setItem("dependents", JSON.stringify(newDependents));
  };

    const handlePagamentoChange = (value: string) => {
    setPagamento(value);
    localStorage.setItem("Pagamento", value);

    // Limpa os campos da conta quando a opção de pagamento mudar
    if (value !== "DEBITO") {
      setAgencia("");
      setConta("");
      setBanco("");
      localStorage.removeItem("Agencia");
      localStorage.removeItem("Conta");
      localStorage.removeItem("Banco");
    }
  };
  const handleAgenciaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAgencia(event.target.value);
    localStorage.setItem("Agencia", event.target.value);
  };
  const handleContaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConta(event.target.value);
    localStorage.setItem("Conta", event.target.value);
  };
  const handleBancoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBanco(event.target.value);
    localStorage.setItem("Banco", event.target.value);
  };
  const handleEnvioChange = (value: string) => {
    setEnvioBoleto(value);
    localStorage.setItem("EnvioBoleto", value);
  };
  const isValidCPF = (cpf: string) => {
    // CPF deve ter 11 dígitos
    if (cpf.length !== 11) return false;

    // Verifica se o CPF tem todos os dígitos iguais (ex.: 00000000000, 11111111111)
    const allDigitsSame = /^(\d)\1{10}$/.test(cpf);
    if (allDigitsSame) return false;

    // Validação simplificada (você pode implementar uma validação de CPF mais robusta)
    // Aqui está uma validação básica usando o módulo 10
    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf[i - 1]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[9])) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf[i - 1]) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[10])) return false;

    return true; // CPF é válido
  };

  const format2CPF = (value: string) => {
    const cleanedValue = value.replace(/\D/g, "");

    // Formata o CPF enquanto o usuário digita
    const formattedValue = cleanedValue
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);

    // Verifica se o CPF é válido
    if (cleanedValue.length > 0 && !isValidCPF(cleanedValue)) {
      setError("Erro: CPF inválido.");
    } else {
      setError(""); // Reseta o erro se o CPF for válido
    }

    return formattedValue; // Retorna o valor formatado
  };
  const format2RG = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 12);
  };
  const format2CartaoSUS = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 15);
  };
  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };
  const getDigits = (value: string) => value.replace(/\D/g, "");
  const isValidDate = (value: string) => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;
    const [dayStr, monthStr, yearStr] = value.split("/");
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);
    if (year < 1900 || year > new Date().getFullYear()) return false;

    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };
  const isValidDDD = (ddd: string) => validDDDs.includes(ddd);
  const isValidPhone = (phone: string) => {
    if (!/^\d{2}\s\d\s\d{4}-\d{4}$/.test(phone)) return false;
    const ddd = phone.slice(0, 2);
    return isValidDDD(ddd);
  };
  const handlePhoneBlur = (index: number, value: string) => {
    if (!value.trim()) {
      setPhoneErrors((prev) => ({ ...prev, [index]: "Telefone e obrigatorio." }));
      return;
    }
    if (!isValidPhone(value)) {
      setPhoneErrors((prev) => ({
        ...prev,
        [index]: "Telefone invalido. Use o formato 99 9 9999-9999 com DDD do Brasil.",
      }));
      return;
    }
    setPhoneErrors((prev) => ({ ...prev, [index]: "" }));
  };
  const handleEmailBlur = (index: number, value: string) => {
    if (!value.trim()) {
      setEmailErrors((prev) => ({ ...prev, [index]: "E-mail é obrigatório." }));
      return;
    }
    if (!isValidEmail(value)) {
      setEmailErrors((prev) => ({ ...prev, [index]: "E-mail inválido." }));
      return;
    }
    setEmailErrors((prev) => ({ ...prev, [index]: "" }));
  };
  const handleDateBlur = (index: number, value: string) => {
    if (!value.trim()) {
      setDateErrors((prev) => ({
        ...prev,
        [index]: "Data de nascimento é obrigatória.",
      }));
      return;
    }
    if (!isValidDate(value)) {
      setDateErrors((prev) => ({
        ...prev,
        [index]: "Data inválida. Use DD/MM/AAAA.",
      }));
      return;
    }
    setDateErrors((prev) => ({ ...prev, [index]: "" }));
  };
  const handleTelefoneChange = (index: number, value: string) => {
    setError3((prevErrors) => ({
      ...prevErrors,
      [index]: "",
    }));
    setPhoneErrors((prevErrors) => ({
      ...prevErrors,
      [index]: "",
    }));

    handleDependentesChange(index, "telefones", format2PhoneNumber(value));
  };

  const format2PhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 11);
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 3) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    if (cleaned.length <= 7) {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 3)} ${cleaned.slice(3)}`;
    }
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 3)} ${cleaned.slice(
      3,
      7
    )}-${cleaned.slice(7)}`;
  };

  const MenssagemApiOK = () =>
    toast.success("Dados salvos com sucesso!", {
      position: "top-center",
      autoClose: 5500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      closeButton: false,
      theme: "dark",
    });
  const MenssagemApiNotOK = (p0: string) => {
    toast.error("Por favor, preencha todos os campos obrigatórios.", {
      position: "top-center",
      autoClose: 5500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      closeButton: false,
      theme: "dark",
    });
  };
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Função para validar os dependentes
  const validateDependents = () => {
    let isValid = true;
    const errors: { [key: number]: string } = {};
    const phoneFieldErrors: { [key: number]: string } = {};
    const emailFieldErrors: { [key: number]: string } = {};
    const dateFieldErrors: { [key: number]: string } = {};
    dependents.forEach((dependent, index) => {
      const dependentErrors: string[] = [];

      if (!dependent.nome?.trim()) dependentErrors.push("Nome é obrigatório.");
      if (!dependent.dataNascimento?.trim()) {
        dependentErrors.push("Data de nascimento é obrigatória.");
        dateFieldErrors[index] = "Data de nascimento é obrigatória.";
      } else if (!isValidDate(dependent.dataNascimento)) {
        dependentErrors.push("Data inválida. Use DD/MM/AAAA.");
        dateFieldErrors[index] = "Data inválida. Use DD/MM/AAAA.";
      } else {
        dateFieldErrors[index] = "";
      }
      if (!dependent.estadoCivil?.trim()) {
        dependentErrors.push("Estado civil é obrigatório.");
      }
      if (!dependent.email?.trim()) {
        dependentErrors.push("E-mail é obrigatório.");
        emailFieldErrors[index] = "E-mail é obrigatório.";
      } else if (!isValidEmail(dependent.email)) {
        dependentErrors.push("E-mail inválido.");
        emailFieldErrors[index] = "E-mail inválido.";
      } else {
        emailFieldErrors[index] = "";
      }
      if (!dependent.telefones?.trim()) {
        dependentErrors.push("Telefone e obrigatorio.");
        phoneFieldErrors[index] = "Telefone e obrigatorio.";
      } else if (!isValidPhone(dependent.telefones)) {
        dependentErrors.push("Telefone invalido. Use o formato 99 9 9999-9999 com DDD do Brasil.");
        phoneFieldErrors[index] = "Telefone invalido. Use o formato 99 9 9999-9999 com DDD do Brasil.";
      } else {
        phoneFieldErrors[index] = "";
      }
      if (!dependent.cpf?.trim()) {
        dependentErrors.push("CPF é obrigatório.");
      } else if (!isValidCPF(getDigits(dependent.cpf))) {
        dependentErrors.push("CPF inválido.");
      }
      if (!dependent.parentesco?.trim()) {
        dependentErrors.push("Parentesco é obrigatório.");
      }
      if (dependentErrors.length > 0) {
        isValid = false;
        errors[index] = dependentErrors.join(" ");
      } else {
        errors[index] = "";
      }
    });
    setError3(errors);
    setPhoneErrors(phoneFieldErrors);
    setEmailErrors(emailFieldErrors);
    setDateErrors(dateFieldErrors);
    return isValid;
  };

  const handleOpenPDF = () => {
    navigate("/pdf-viewer", { state: { pdfBase64 } }); // Passe o estado corretamente
  };

    const formatDateForDatabase = (dateString: string): string => {
    if (!dateString) return "";

    try {
      if (dateString.includes("/")) {
        const [day, month, year] = dateString.split("/");
        if (!day || !month || !year) return "";
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      const date = new Date(dateString);
      // Formata para YYYY-MM-DD (formato aceito pelo MySQL)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "";
    }
  };


  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault(); // Evita o comportamento padrão do form

    setIsSubmitting(true);
    const isDependentsValid = validateDependents();
    if (!isDependentsValid) {
      MenssagemApiNotOK("Existem campos inválidos nos dependentes.");
      setIsSubmitting(false);
      return;
    }
    const validDependents = dependents.map((dependent) => ({
      ...dependent,
      dataNascimento: formatDateForDatabase(dependent.dataNascimento),
      telefones: format2PhoneNumber(dependent.telefones),
      email: dependent.email.trim(),
      cartaoSus: getDigits(dependent.cartaoSus),
    }));

    const dtAdesaoAoPlano = `${new Date().toLocaleDateString(
      "pt-BR"
    )} às ${new Date().toLocaleTimeString("pt-BR", { hour12: false })}`;

    const nowIso = new Date().toISOString();
    const dataToSend = {
      adesao: {
        CD_MATRICULA: matricula,
        DS_TIPO_PESSOA: titularData?.tipoDependente || "",
        CD_BENEFICIARIO: titularData?.cdBeneficiario || "",
        NM_BENEFICIARIO: titular,
        NU_CPF: getDigits(cpf),
        NU_RG: titularData?.rg || "",
        CD_ORGAO_RG: titularData?.orgaoRg || "",
        CD_UF_RG: titularData?.ufRg || "",
        EMAIL: email?.trim() || "",
        DT_NASCIMENTO: titularData?.dtNascimento || null,
        FL_SEXO: titularData?.sexo || "",
        NM_MAE: titularData?.nmMae || "",
        DS_GRAU_PARENTESCO: titularData?.tipoDependente || "",
        DS_LOGRADOURO: titularData?.logradouro || "",
        NU_NUMERO:
          titularData?.numero !== undefined && titularData?.numero !== null
            ? String(titularData.numero)
            : "",
        DS_COMPLEMENTO: titularData?.complemento || "",
        NM_CIDADE: titularData?.cidade || "",
        NM_BAIRRO: titularData?.bairro || "",
        CD_UF: titularData?.uf || "",
        CD_CEP: titularData?.cep || "",
        CELULAR: getDigits(telefones || ""),
        FRM_PAGAMENTO: pagamento || "",
        PGM_AGENCIA: agencia || "",
        PGM_CONTA: conta || "",
        PGM_BANCO: banco || "",
        ENV_BOLETO: envioBoleto || "",
        DATA_SOLICITACAO: nowIso,
        OPCAO_SELECIONADA: portabilidade || "",
        CD_CNS: getDigits(titularData?.cns || ""),
      },
      dependentes: validDependents.map((dependent) => ({
        NM_MATRICULA_TITULAR: matricula,
        NM_BENEFICIARIO: dependent.nome,
        NU_CPF: getDigits(dependent.cpf),
        NU_RG: dependent.rg || "",
        CD_ORGAO_RG: dependent.uf_emissor_rg || "",
        CD_UF_RG: dependent.uf_rg || "",
        CD_CNS: getDigits(dependent.cartaoSus),
        DT_NASCIMENTO: dependent.dataNascimento || null,
        FL_SEXO: dependent.sexoDependente || "",
        EST_CIVIL: dependent.estadoCivil || "",
        NM_MAE: dependent.nomeMae || "",
        GRAU_PARENTESCO: dependent.parentesco || "",
        CELULAR: getDigits(dependent.telefones),
        EMAIL: dependent.email.trim(),
        DATA_SOLICITACAO: nowIso,
        CARTAO_SUS: getDigits(dependent.cartaoSus),
        OPCAO_SELECIONADA: portabilidade || "",
      })),
    };

    // Enviar os dados para o backend
    try {
      // Após o envio, desativa o botão por 3 minutos
      setIsButtonDisabled(true);
      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 180000); // 180.000 ms = 3 minutos
      const response = await formsFetch(
        "/adesao/completa",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend), // Converte os dados para JSON
        }
      );

      if (response.ok) {
        MenssagemApiOK();
        localStorage.setItem(
          "Data de inclusão no plano de saúde",
          JSON.stringify(dtAdesaoAoPlano)
        );
        // Atualiza o estado para indicar que o formulário foi enviado
        setIsSubmitted(true);

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

        // Título do termo de adesão
        doc.setFont("Arial", "bold");
        doc.setFontSize(16);
        const titleText = "TERMO DE ADESÃO AO PLANO DE SAÚDE PLUS NACIONAL";
        const titleLines = doc.splitTextToSize(titleText, 190);
        let titleY = 55;
        titleLines.forEach((line: string) => {
          const lineWidth = doc.getTextWidth(line);
          const lineX = (pageWidth - lineWidth) / 2;
          doc.text(line, lineX, titleY);
          titleY += 8;
        });

        // Texto adicional do termo
        doc.setFont("Arial", "normal");
        doc.setFontSize(12);
        const termText = `Eu, ${titular}, cpf: ${cpf}, titular do grupo familiar abaixo especificado,`;
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
        function formatDate(dateString: string) {
          if (!dateString) return "";
          if (dateString.includes("/")) return dateString;

          const date = new Date(dateString);
          if (Number.isNaN(date.getTime())) return "";
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        }

        // Adicionar dependentes, se houver
        if (validDependents.length > 0) {
          let dependentTextY = termTextY + 10;
          doc.setFont("Arial", "bold");
          doc.text("Dependentes:", 10, dependentTextY);
          doc.setFont("Arial", "normal");

          validDependents.forEach((dependent, index) => {
            const formattedDateNascimento = formatDate(
              dependent.dataNascimento
            ); // Formatar a data de nascimento
            const dependentInfo = `${index + 1}. Nome: ${
              dependent.nome
            } / CPF: ${
              dependent.cpf
            } / Data Nascimento: ${formattedDateNascimento} / CNS: ${
              dependent.cartaoSus
            } / Nome da Mãe: ${dependent.nomeMae} / Parentesco: ${
              dependent.parentesco
            }`;

            // Quebra de linha automática para evitar que o texto ultrapasse a página
            const textLines = doc.splitTextToSize(dependentInfo, 180); // 180 é a largura do texto na página

            doc.text(textLines, 13, dependentTextY + (index + 1) * 8);
          });
        }

        // Adicionar data de adesão à direita
        doc.setFont("Arial", "normal");
        doc.setFontSize(12);
        const dateText = `Data de adesão: ${dtAdesaoAoPlano}`;
        const dateX = pageWidth - doc.getTextWidth(dateText) - 10; // Alinha à direita
        doc.text(dateText, dateX, termTextY + 40);

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
          return `${day}${month}${year}${hours}${minutes}${formattedSeconds}`;
        };

        // Gera o PROTOCOLO
        const protocolo = generateProtocol();

        // Adicionar o protocolo centralizado
        doc.setFont("Arial", "normal");
        const beneficiaryTitleText = `Assinatura Titular: `;
        const beneficiaryTitleWidth = doc.getTextWidth(beneficiaryTitleText);
        const titleCenter = (pageWidth - beneficiaryTitleWidth) / 2;

        // Título do protocolo (centrado)
        doc.text(beneficiaryTitleText, titleCenter, termTextY + 85);

        // Protocolo (centralizado logo abaixo do título)
        doc.setFont("Arial", "bold");
        const protocoloWidth = doc.getTextWidth(
          "_______________________________________"
        );
        const protocoloX = (pageWidth - protocoloWidth) / 2; // Centralizando o número do protocolo

        doc.text(
          "_______________________________________",
          protocoloX,
          termTextY + 93
        ); // Ajustando a posição do protocolo

        const additionalInfo = [
          "Rua: Corálio Soares de Oliveira, nº 497, Centro, João Pessoa – PB, CEP 58.013-260.",
          "Telefone: 3533-5310 - www.afrafepsaude.com.br  @afrafepsaude ",
          "CNPJ: 09.306.242/0001-82.",
        ];

        doc.setTextColor(105, 105, 105); // Cinza escuro (#696969)
        let yOffset = doc.internal.pageSize.height - 35; // Iniciar 35mm acima do rodapé
        additionalInfo.forEach((line, index) => {
          const splitText = doc.splitTextToSize(line, 150);
          splitText.forEach((textLine: string) => {
            doc.text(textLine, 9, yOffset);
            yOffset += 5; // Ajustar o espaçamento
          });
          if (index === additionalInfo.length - 1) {
            yOffset += 10; // Espaçamento extra após a última linha
          }
        });

        // Adiciona a imagem no rodapé (direita)
        const imgBase64 = rodape; // Substitua pelo Base64 real da imagem
        const imgWidth = 45; // Ajuste conforme necessário
        const imgHeight = 25; // Ajuste conforme necessário
        // Certifique-se de que pageWidth já existe antes
        const pageWidth2 = doc.internal.pageSize.width;

        const xOffsetImage = pageWidth2 - imgWidth - 10; // Posição X (direita)
        const yOffsetImage = doc.internal.pageSize.height - imgHeight - 17; // Posição Y (rodapé)

        doc.addImage(
          imgBase64,
          "PNG",
          xOffsetImage,
          yOffsetImage,
          imgWidth,
          imgHeight
        );

        // Resetar cor para preto
        doc.setTextColor(0, 0, 0);

        // Gerar o PDF em Base64
        const pdfBase64 = doc.output("datauristring");

        // Salvar o PDF em base64 no estado
        setPdfBase64(pdfBase64);

        // Gerar o PDF como Blob
        const pdfBlob = doc.output("blob");

        // Gerar a URL do Blob
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // Atualizar o estado com a URL do Blob
        setPdfUrl(pdfUrl);

        // Abrir o modal para exibir o PDF
        setIsModalOpen(true);

        // Atualizar o estado para mostrar o PDF
        setDetalhe(true);

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1500);

        // Baixar o PDF
        /*         doc.save(`adesao_plano_${titular}.pdf`);
         */
      } else {
        throw new Error("Erro ao salvar os dados no banco de dados");
      }
    } catch (error) {
      console.error("Erro ao salvar os dados:", error);
      MenssagemApiNotOK("Ocorreu um erro ao salvar os dados.");
    } finally {
      // Sempre reabilita após o envio (caso queira permitir novos envios)
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("dependents", JSON.stringify(dependents));
  }, [dependents]);

  const areAllDependentsFieldsFilled =
    dependents.length > 0 &&
    dependents.every((dependent) =>
      Object.entries(dependent).every(([key, value]) => {
        if (key === "cartaoSus") return true;
        return value.trim() !== "";
      })
    );

  return (
    <div className="max-x-auto">
      <form onSubmit={handleSubmit}>
        {/* Dados do Titular do Plano */}
        <table className="min-w-full sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
          <thead>
            <tr>
              <th
                colSpan={6}
                className="border-b-2 border-gray-300 px-4 py-2 text-center"
              >
                DADOS DO TITULAR DO PLANO
              </th>
            </tr>
          </thead>
          <div className="space-y-2 titular-compact">
            <div className="border-b pb-3 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                {/* Nome */}
                <div className="w-full">
                  <label className="font-bold block mb-1">Nome:</label>
                  <h3>{titular}</h3>
                </div>

                {/* CPF */}
                <div className="w-full">
                  <label className="font-bold block mb-1">CPF Nº:</label>
                  <h3>{cpf}</h3>
                </div>

                {/* Matrícula */}
                <div className="w-full">
                  <label className="font-bold block mb-1">Matrícula Nº:</label>
                  <h3>{matricula}</h3>
                </div>

                {/* Telefone */}
                <div className="w-full">
                  <label className="font-bold block mb-1">
                    Telefone (com DDD):
                  </label>
                  <h3>{telefones}</h3>
                </div>

                {/* E-mail */}
                <div className="w-full">
                  <label className="font-bold block mb-1">E-mail:</label>
                  <h3>{email}</h3>
                </div>

                {/* Data de Nascimento */}
                <div className="w-full">
                  <label className="font-bold block mb-1">
                    Data de Nascimento:
                  </label>
                  <h3>
                    {titularData?.dtNascimento
                      ? new Date(titularData.dtNascimento).toLocaleDateString(
                          "pt-BR"
                        )
                      : ""}
                  </h3>
                </div>

                {/* Cartão SUS */}
                <div className="w-full">
                  <label className="font-bold block mb-1">Cartão SUS:</label>
                  <h3>{titularData?.cns || ""}</h3>
                </div>

                {/* RG */}
                <div className="w-full">
                  <label className="font-bold block mb-1">RG:</label>
                  <h3>{titularData?.rg || ""}</h3>
                </div>

                {/* Órgão Emissor */}
                <div className="w-full">
                  <label className="font-bold block mb-1">Órgão Emissor:</label>
                  <h3>{titularData?.orgaoRg || ""}</h3>
                </div>

                {/* UF RG */}
                <div className="w-full">
                  <label className="font-bold block mb-1">UF RG:</label>
                  <h3>{titularData?.ufRg || ""}</h3>
                </div>

                {/* Endereço */}
                <div className="w-full col-span-1 md:col-span-3">
                  <label className="font-bold block mb-1">Endereço:</label>
                  <h3>
                    {titularData?.logradouro || ""}, {titularData?.numero || ""}
                    {titularData?.complemento
                      ? `, ${titularData.complemento}`
                      : ""}
                  </h3>
                </div>

                {/* Bairro */}
                <div className="w-full">
                  <label className="font-bold block mb-1">Bairro:</label>
                  <h3>{titularData?.bairro || ""}</h3>
                </div>

                {/* Cidade */}
                <div className="w-full">
                  <label className="font-bold block mb-1">Cidade:</label>
                  <h3>{titularData?.cidade || ""}</h3>
                </div>

                {/* UF */}
                <div className="w-full">
                  <label className="font-bold block mb-1">UF:</label>
                  <h3>{titularData?.uf || ""}</h3>
                </div>

                {/* CEP */}
                <div className="w-full">
                  <label className="font-bold block mb-1">CEP:</label>
                  <h3>{titularData?.cep || ""}</h3>
                </div>


                {/* Portabilidade */}
                <div className="w-full col-span-1 md:col-span-3">
                  <div className="border-b pb-1">
                    <b>Portabilidade:</b>
                    <div className="flex space-x-2 mt-2">
                      <span
                        className={`custom-check ${
                          portabilidade === "1" ? "checked" : ""
                        }`}
                        onClick={() => handleOpcaoChange("1")}
                      >
                        {portabilidade === "1" ? "X" : ""}
                      </span>{" "}
                      SIM
                      <span
                        className={`custom-check ${
                          portabilidade === "0" ? "checked" : ""
                        }`}
                        onClick={() => handleOpcaoChange("0")}
                      >
                        {portabilidade === "0" ? "X" : ""}
                      </span>{" "}
                      <span className="ml-1">NÃO</span>{" "}
                      {/* Aumenta o espaçamento aqui */}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="border-b pb-4">
              <h3 className="border-b-2 border-gray-300 px-4 py-2 text-center   font-bold">
                FORMA DE PAGAMENTO
              </h3>
              <div className="flex flex-col md:flex-row md:space-x-4 mt-4">
                <h1>
                  <strong>
                    {Number(pagamento) === 1 || Number(pagamento) === 3
                      ? "DÉBITO EM CONTA"
                      : Number(pagamento) === 4
                      ? "COBRANÇA BANCÁRIA"
                      : ""}
                  </strong>
                  <br />
                  <br />* Caso deseje alterar a forma de pagamento, entre em
                  contato com o setor de relacionamento.{" "}
                </h1>
              </div>
            </div>
          </div>
        </table>

        {dependents.map((dependent, index) => (
          <React.Fragment key={index}>
            <div className="mt-4 px-3 sm:px-6 lg:px-8">
              <div className="overflow-hidden bg-white sm:rounded-lg">
                <div className="px-3 py-5 sm:px-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Dados dos Dependentes - {`0${index + 1}`}
                  </h3>
                </div>
                <div className="border-t border-gray-200">
                  <div className="px-3 py-1 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Nome */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Nome
                        </label>
                        <input
                          type="text2"
                          maxLength={40}
                          value={dependent.nome}
                          onChange={(e) =>
                            handleDependentesChange(
                              index,
                              "nome",
                              e.target.value
                            )
                          }
                          className="mt-1 block w-full px-3 py-2 border-b border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          style={{
                            width: `${Math.max(
                              40,
                              dependent.nome.length * 10
                            )}px`,
                            minWidth: "150px",
                          }}
                        />
                      </div>

                      {/* Telefone */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Telefone (com DDD)
                        </label>
                        <input
                          type="text2"
                          maxLength={14}
                          value={dependent.telefones}
                          required
                          onChange={(e) =>
                            handleTelefoneChange(index, e.target.value)
                          }
                          onBlur={(e) => handlePhoneBlur(index, e.target.value)}
                          placeholder="99 9 9999-9999"
                          className="mt-1 block w-full px-3 py-2 border-b border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          style={{
                            width: `${Math.max(
                              55,
                              dependent.telefones.length * 7
                            )}px`,
                            minWidth: "146px",
                          }}
                        />
                        {phoneErrors[index] && (
                          <p className="text-red-500 text-xs">
                            {phoneErrors[index]}
                          </p>
                        )}
                        {error3[index] && (
                          <p className="text-red-500 text-xs">
                            {error3[index]}
                          </p>
                        )}
                      </div>

                      {/* E-mail */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                          E-mail
                        </label>
                        <input
                          type="email"
                          maxLength={80}
                          value={dependent.email}
                          required
                          onChange={(e) =>
                            {
                              handleDependentesChange(
                                index,
                                "email",
                                e.target.value
                              );
                              setEmailErrors((prev) => ({
                                ...prev,
                                [index]: "",
                              }));
                            }
                          }
                          onBlur={(e) => handleEmailBlur(index, e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border-b border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          style={{
                            width: `${Math.max(
                              55,
                              dependent.email.length * 7
                            )}px`,
                            minWidth: "200px",
                          }}
                        />
                        {emailErrors[index] && (
                          <p className="text-red-500 text-xs">
                            {emailErrors[index]}
                          </p>
                        )}
                      </div>

                      {/* Cartão SUS */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Cartão SUS Nº
                        </label>
                        <input
                          type="text2"
                          maxLength={15}
                          value={dependent.cartaoSus}
                          onChange={(e) =>
                            {
                              handleDependentesChange(
                                index,
                                "cartaoSus",
                                format2CartaoSUS(e.target.value)
                              );
                            }
                          }
                          className="mt-1 block w-full sm:w-40 px-3 py-2 border-b border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      {/* Nome da Mãe */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Nome da Mãe
                        </label>
                        <input
                          type="text2"
                          maxLength={40}
                          value={dependent.nomeMae}
                          onChange={(e) =>
                            handleDependentesChange(
                              index,
                              "nomeMae",
                              e.target.value
                            )
                          }
                          className="mt-1 block w-full px-3 py-2 border-b border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          style={{
                            width: `${Math.max(
                              40,
                              dependent.nomeMae.length * 7.5
                            )}px`,
                            minWidth: "247px",
                          }}
                        />
                      </div>

                      {/* Parentesco */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Parentesco com Titular
                        </label>
                        <select
                          value={dependent.parentesco}
                          onChange={(e) =>
                            handleDependentesChange(
                              index,
                              "parentesco",
                              e.target.value
                            )
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="">Selecione</option>
                          <option value="Pai">Pai</option>
                          <option value="Mae">Mãe</option>
                          <option value="Filho">Filho</option>
                          <option value="Filha">Filha</option>
                          <option value="Irmao">Irmão</option>
                          <option value="Arma">Irmã</option>
                          <option value="Avô">Avô</option>
                          <option value="Avó">Avó</option>
                          <option value="Tio">Tio</option>
                          <option value="Tia">Tia</option>
                          <option value="Primo">Primo</option>
                          <option value="Prima">Prima</option>
                          <option value="Cônjuge">Cônjuge</option>
                        </select>
                      </div>

                      {/* CPF */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                          CPF Nº
                        </label>
                        <input
                          type="text2"
                          maxLength={14}
                          value={dependent.cpf}
                          onChange={(e) =>
                            handleDependentesChange(
                              index,
                              "cpf",
                              format2CPF(e.target.value)
                            )
                          }
                          className="mt-1 block w-full sm:w-[140px] px-3 py-2 border-b border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        {error && (
                          <p className="text-red-500 text-xs">{error}</p>
                        )}
                      </div>

                      {/* RG */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                          RG Nº / Órgão Emissor / UF Emissor
                        </label>

                        <div className="flex space-x-2 mt-1">
                          {/* RG Nº */}
                          <input
                            type="text2"
                            value={dependent.rg}
                            onChange={(e) =>
                              handleDependentesChange(
                                index,
                                "rg",
                                format2RG(e.target.value)
                              )
                            }
                            maxLength={11}
                            className="block w-[127px] px-3 py-2 border-b border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="RG Nº"
                          />
                          {/* Órgão Emissor */}
                          <input
                            type="text2"
                            value={dependent.uf_emissor_rg}
                            onChange={(e) =>
                              handleDependentesChange(
                                index,
                                "uf_emissor_rg",
                                e.target.value
                              )
                            }
                            maxLength={3}
                            className="block w-20 px-3 py-2 border-b border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Órgão"
                          />
                          {/* UF Emissor */}
                          <input
                            type="text2"
                            value={dependent.uf_rg}
                            onChange={(e) =>
                              handleDependentesChange(
                                index,
                                "uf_rg",
                                e.target.value
                              )
                            }
                            maxLength={2}
                            className="block w-[55px] px-3 py-2 border-b border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="UF"
                          />
                        </div>
                      </div>

                      {/* Data de Nascimento */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Data de Nascimento
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="DD/MM/AAAA"
                          value={dependent.dataNascimento}
                          onChange={(e) =>
                            {
                              handleDependentesChange(
                                index,
                                "dataNascimento",
                                formatDate(e.target.value)
                              );
                              setDateErrors((prev) => ({
                                ...prev,
                                [index]: "",
                              }));
                            }
                          }
                          onBlur={(e) => handleDateBlur(index, e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        {dateErrors[index] && (
                          <p className="text-red-500 text-xs">
                            {dateErrors[index]}
                          </p>
                        )}
                      </div>

                      {/* Sexo */}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Sexo
                        </label>
                        <div className="flex items-center space-x-4">
                          {/* Opção Masculino */}
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`sexo-${index}`}
                              value="M"
                              checked={dependent.sexoDependente === "M"}
                              onChange={() =>
                                handleDependentesChange(
                                  index,
                                  "sexoDependente",
                                  "M"
                                )
                              }
                              className="hidden"
                            />
                            <span
                              className={`custom-check ${
                                dependent.sexoDependente === "M" ? "checked" : ""
                              }`}
                            >
                              {dependent.sexoDependente === "M" ? "X" : ""}
                            </span>
                            Masculino
                          </label>

                          {/* Opção Feminino */}
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`sexo-${index}`}
                              value="F"
                              checked={dependent.sexoDependente === "F"}
                              onChange={() =>
                                handleDependentesChange(
                                  index,
                                  "sexoDependente",
                                  "F"
                                )
                              }
                              className="hidden"
                            />
                            <span
                              className={`custom-check ${
                                dependent.sexoDependente === "F" ? "checked" : ""
                              }`}
                            >
                              {dependent.sexoDependente === "F" ? "X" : ""}
                            </span>
                            Feminino
                          </label>
                        </div>
                      </div>

                      {/* Estado Civil */}
                      <div className="col-span-1 mb-5">
                        <label className="block text-sm font-medium text-gray-700">
                          Estado Civil
                        </label>
                        <select
                          value={dependent.estadoCivil}
                          onChange={(e) =>
                            handleDependentesChange(
                              index,
                              "estadoCivil",
                              e.target.value
                            )
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="">Selecione</option>
                          <option value="solteiro">Solteiro</option>
                          <option value="casado">Casado</option>
                          <option value="divorciado">Divorciado</option>
                          <option value="viúvo">Viúvo</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
        <ToastContainer />
      </form>

      <div className="flex justify-between mt-4">
        <button
          id="submitButton"
          className={`hide-print text-white px-4 py-2 transition duration-300 rounded ${
            !cpf.trim() ||
            !matricula.trim() ||
            !telefones.trim() ||
            !email.trim() ||
            !portabilidade.trim() ||
            dependents.length >= 5
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          onClick={addDependent}
          disabled={
            !cpf.trim() ||
            !matricula.trim() ||
            !telefones.trim() ||
            !email.trim() ||
            !portabilidade.trim() ||
            dependents.length >= 5
          }
        >
          Adicionar Dependente
        </button>

        <button
          id="submitButton"
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            isButtonDisabled ||
            !cpf.trim() ||
            !matricula.trim() ||
            !telefones.trim() ||
            !email.trim() ||
            !portabilidade.trim() ||
            !areAllDependentsFieldsFilled
          }
          className={`hide-print text-white px-4 py-2 transition duration-300 rounded btn
    ${
      isSubmitting ||
      isButtonDisabled ||
      !cpf.trim() ||
      !matricula.trim() ||
      !telefones.trim() ||
      !email.trim() ||
      !portabilidade.trim() ||
      !areAllDependentsFieldsFilled
        ? "bg-gray-500 cursor-not-allowed opacity-50"
        : "bg-blue-600 hover:bg-blue-700"
    }
  `}
        >
          {isSubmitting ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </div>
  );
};

export default Tabela;









