import React, { useState, useEffect } from "react";
import axios from "axios";
import Table from "../Adesao/table";
import { Button } from "react-bootstrap";
import { BsBoxArrowRight } from "react-icons/bs";
import Swal from "sweetalert2";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { formsUrl } from "../../../services/api";

const Dashboard: React.FC = () => {
  const [search, setSearch] = useState<string>(""); // Campo de busca
  const [adesao, setAdesao] = useState<any[]>([]);
  const [reciprocidade, setReciprocidade] = useState<any[]>([]);
  const [exclusao, setExclusao] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]); // Dados filtrados para exibição
  const [activeTab, setActiveTab] = useState<string>("adesao");
  const [newUsersToday, setNewUsersToday] = useState<number>(0); // Contagem de novos usuários hoje
  const [showAlert, setShowAlert] = useState<boolean>(false); // Estado para mostrar alerta
  const navigate = useNavigate();
  const token = Cookies.get("Frontend");

  const handleLogout = () => {
    Swal.fire({
      title: "Você tem certeza?",
      text: "Você quer realmente sair?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "rgb(0,128,0)",
      cancelButtonColor: "#d33",
    }).then((result) => {
      if (result.isConfirmed) {
        ["Frontend"].forEach((item) => {
          Cookies.remove(item);
          Cookies.remove("alertShownAdesao");
          Cookies.remove("alertShownReciprocidade");
          Cookies.remove("alertShownExclusao");
        });

        Swal.fire({
          title: "Confirmado!",
          text: "Você foi desconectado com sucesso!",
          icon: "success",
          showConfirmButton: false,
          timer: 1700,
          timerProgressBar: true,
          willClose: () => navigate("/login"),
        });
      }
    });
  };

  // Função para calcular a diferença em semanas
  const calculateWeekDifference = (date: string): number => {
    const currentDate = new Date();
    const userDate = new Date(date);
    const diffTime = Math.abs(currentDate.getTime() - userDate.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 3600 * 24 * 7)); // Converte a diferença para semanas
    return diffWeeks;
  };

  // Função para buscar beneficiários e atualizar contagem de novos usuários
  const fetchBeneficiarios = async (
    url: string,
    setState: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`, // Substitua 'yourToken' pelo token adequado
        },
      });

      const data = Array.isArray(response.data) ? response.data : [];
      setState(data);

      const today = new Date().toISOString().split("T")[0]; // Obtém data no formato YYYY-MM-DD
      const newUsers = data.filter((user: any) =>
        user.DATA_ADICAO.startsWith(today)
      );
      setNewUsersToday(newUsers.length);
    } catch (error) {
      console.error("Erro ao buscar beneficiários:", error);
      setState([]);
    }
  };

  const fetchReciprocidadeBeneficiarios = async (
    url: string,
    setState: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`, // Substitua 'yourToken' pelo token adequado
        },
      });

      const data = Array.isArray(response.data.data) ? response.data.data : [];
      setState(data);
    } catch (error) {
      console.error("Erro ao buscar beneficiários (Reciprocidade):", error);
      setState([]);
    }
  };

  const fetchExclusaoBeneficiarios = async (
    url: string,
    setState: React.Dispatch<React.SetStateAction<any[]>>,
    setNewUsersToday: React.Dispatch<React.SetStateAction<number>>,
    alertTitle: string
  ) => {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data =
        Array.isArray(response.data.data) && response.data.data.length > 0
          ? response.data.data
          : [];

      setState(data);

      // Filtra os titulares com STATUS diferente de 1
      const titularesPendentes = response.data.titulares
        ? response.data.titulares.filter((t: any) => t.STATUS !== 1)
        : [];

      // Verifica se o alerta já foi exibido antes
      const alertKey = `alertShownExclusao`;
      const alreadyAlerted = Cookies.get(alertKey);

      if (titularesPendentes.length > 0 && !alreadyAlerted) {
        const totalPendentes = titularesPendentes.length;
        const plural = totalPendentes === 1 ? "" : "s";
        const namesList = titularesPendentes
          .map((t: any) => `<li>${t.NM_BENEFICIARIO}</li>`)
          .join("");

        Swal.fire({
          title: `⚠️ ${alertTitle}!`,
          html: `Você tem <strong>${totalPendentes}</strong> novo${plural} beneficiário${plural} com status: <strong>PENDENTE</strong>:<br><br>
                 <ul style="text-align: center; list-style-type: none; padding: 0;">${namesList}</ul>`,
          icon: "warning",
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
        });

        // Salva no sessionStorage que esse alerta foi exibido
        Cookies.set(alertKey, "true");
      }

      // Lógica para contar novos usuários adicionados hoje
      const today = new Date().toISOString().split("T")[0];
      const newUsers = data.filter((user: any) =>
        user.DATA_ADICAO?.startsWith(today)
      );

      setNewUsersToday(newUsers.length);
    } catch (error) {
      console.error(`Erro ao buscar beneficiários (${alertTitle}):`, error);
      setState([]);
    }
  };

  // Remove o alerta ao sair da página
  useEffect(() => {
    return () => {
      Cookies.remove("alertShownExclusao");
      Cookies.remove("alertShownAdesao");
      Cookies.remove("alertShownReciprocidade");
    };
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case "adesao":
        setReciprocidade([]); // Limpa reciprocidade quando mudando para adesão
        setExclusao([]); // Limpa exclusão quando mudando para adesão
        fetchBeneficiarios(
          formsUrl("/adesaodash/beneficiarios"),
          setAdesao
        );
        break;
      case "reciprocidade":
        setAdesao([]); // Limpa adesão quando mudando para reciprocidade
        setExclusao([]); // Limpa exclusão quando mudando para reciprocidade
        fetchReciprocidadeBeneficiarios(
          formsUrl("/reciprocidade/beneficiarios"),
          setReciprocidade
        );
        break;
      case "exclusao":
        setAdesao([]); // Limpa adesão quando mudando para exclusão
        setReciprocidade([]); // Limpa reciprocidade quando mudando para exclusão
        fetchExclusaoBeneficiarios(
          formsUrl("/exclusao/beneficiarios"),
          setExclusao,
          setNewUsersToday,
          "EXCLUSÃO" // <== Adicione este estado aqui
        );
        break;
      default:
        break;
    }
  }, [activeTab]);

  useEffect(() => {
    const searchTerm = search.trim().toLowerCase();

    const dataToFilter =
      activeTab === "adesao"
        ? adesao
        : activeTab === "reciprocidade"
        ? reciprocidade
        : exclusao;

    const filtered = Array.isArray(dataToFilter)
      ? dataToFilter
          .filter((beneficiario) => {
            const nome = beneficiario.NM_BENEFICIARIO?.toLowerCase() || "";
            const cpf = beneficiario.NU_CPF?.toString() || "";
            const protocolo = beneficiario.PROTOCOLO?.toString() || "";
            return (
              nome.includes(searchTerm) ||
              cpf.includes(searchTerm) ||
              protocolo.includes(searchTerm)
            );
          })
          .filter(
            (value, index, self) =>
              index === self.findIndex((t) => t.PROTOCOLO === value.PROTOCOLO)
          )
          .sort((a, b) => {
            const nomeA = a.NM_BENEFICIARIO?.toLowerCase() || "";
            const nomeB = b.NM_BENEFICIARIO?.toLowerCase() || "";
            return nomeA.localeCompare(nomeB);
          })
      : [];

    // Filtra os usuários pendentes
    const pendingUsers = filtered.filter((user: any) => {
      const weekDifference = calculateWeekDifference(user.DATA_ADICAO);
      return weekDifference >= 1 && user.STATUS === "PENDENTE"; // Ajuste conforme o campo de status
    });

    setFilteredData(filtered);

    // Condição para exibir o alerta de usuários pendentes
    if (pendingUsers.length > 0) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000); // Alerta desaparece após 5 segundos
    }
  }, [search, activeTab, adesao, reciprocidade, exclusao]);

  useEffect(() => {
    if (newUsersToday > 0) {
      const getPendingBeneficiaries = (list: any[]) => {
        return list.filter((user) => user.STATUS === 0);
      };

      const pendingAdesao = getPendingBeneficiaries(adesao);
      const pendingReciprocidade = getPendingBeneficiaries(reciprocidade);

      const showAlertForType = (
        beneficiaries: any[],
        type: string,
        storageKey: string
      ) => {
        if (beneficiaries.length > 0 && !Cookies.get(storageKey)) {
          const total = beneficiaries.length;
          const plural = total === 1 ? "" : "s";
          const namesList = beneficiaries
            .map((user) => `<li>${user.NM_BENEFICIARIO}</li>`)
            .join("");

          Swal.fire({
            title: `⚠️ ${type}!`,
            html: `Você tem <strong>${total}</strong> novo${plural} beneficiário${plural} com status: <strong>PENDENTE</strong>:<br><br>
                   <ul style="text-align: center; list-style-type: none; padding: 0;">${namesList}</ul>`,
            icon: "warning",
            showConfirmButton: false,
            timer: 7000,
            timerProgressBar: true,
          });

          // Salva no sessionStorage que esse alerta foi exibido
          Cookies.set(storageKey, "true");
        }
      };

      showAlertForType(pendingAdesao, "ADESÃO", "alertShownAdesao");
      showAlertForType(
        pendingReciprocidade,
        "RECIPROCIDADE",
        "alertShownReciprocidade"
      );

      setShowAlert(pendingAdesao.length > 0 || pendingReciprocidade.length > 0);
    }
  }, [newUsersToday, adesao, reciprocidade]);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="danger"
          onClick={handleLogout}
          className="py-2 px-4 rounded-lg shadow-md   text-white         bg-red-500 
 transform transition-all duration-300 ease-in-out hover:scale-105 hover:bg-red-700 hover:shadow-xl flex items-center"
        >
          <BsBoxArrowRight className="mr-2" /> Sair
        </Button>
      </div>
      <h1 className="text-2xl font-bold mb-4">Painel de Formulários</h1>

      <nav className="flex space-x-4 mb-4">
        {["adesao", "reciprocidade", "exclusao"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>
      {activeTab !== "exclusao" && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Digite o nome, CPF ou matrícula"
          className="px-4 py-2 border rounded w-full mb-4"
        />
      )}

      <Table data={filteredData} activeTab={activeTab} />
    </div>
  );
};

export default Dashboard;
