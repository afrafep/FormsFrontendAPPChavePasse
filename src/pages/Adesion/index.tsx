import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../../components/Footer/Rodape";
import Tabela from "../../components/TabelaAdesion";
import Menu from "../../components/Menu/Menu";

interface Dependent {
  nome: string;
  dataNascimento: string;
  estadoCivil: string;
  cpf: string;
  rg: string;
  cartaoSus: string;
  sexoDependent: string;
  nomeMae: string;
  parentesco: string;
  telefones: string;
  email: string;
}

function App() {
  const [titular, setTitular] = useState<string>(() => {
    return localStorage.getItem("Titular") || "";
  });
  const [opcaoSelecionada, setOpcaoSelecionada] = useState(() => {
    // Recupera a opção selecionada do localStorage ou define "A" como padrão
    const storedOption = localStorage.getItem("opcaoSelecionada");
    if (storedOption === null) {
      localStorage.setItem("opcaoSelecionada", "A"); // Define "A" como padrão no localStorage
      return "A";
    }
    return storedOption;
  });
  const handleOpcaoChange = (value: string) => {
    setOpcaoSelecionada(value);
    // Armazena a opção selecionada no localStorage somente se for diferente da atual
    if (value !== opcaoSelecionada) {
      localStorage.setItem("opcaoSelecionada", value);
    }
  };

  useEffect(() => {
    localStorage.setItem("Titular", titular);
  }, [titular]);

  return (
    <>      <Menu />

      <div className="container mt-2">
        <div>
          <Footer />
          <br />
          <br />
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              marginBottom: "2rem",
            }}
          >
            TERMO DE ADESÃO AO PLANO DE SAÚDE PLUS NACIONAL
          </h1>

          <ToastContainer />

          <div className="p-2 mx-auto">
               {/* Opções de adesão */}
            <div className="mb-4">
              <label className="block mb-2">
                <span
                  className={`custom-check ${
                    opcaoSelecionada === "A" ? "checked" : ""
                  }`}
                  onClick={() => handleOpcaoChange("A")}
                >
                  {opcaoSelecionada === "A" ? "X" : ""}
                </span>
                A adesão ao plano de saúde do(s) meu(s) dependente(s) abaixo
                listados
              </label>
            </div>
            <br />

            <Tabela />
          </div>
        </div>

        {/* CSS */}
        <style>{`
        .custom-check {
          display: inline-block;
          width: 20px;
          height: 20px;
          margin-right: 8px;
          border: 2px solid #000; /* Borda preta */
          border-radius: 50%; /* Arredondado */
          text-align: center;
          line-height: 20px;
          font-weight: bold;
          font-size: 18px;
          color: transparent; /* Esconde o X */
          transition: background-color 0.3s; /* Transição suave */
        }

        .custom-check.checked {
          background-color: #ffff; /* Verde quando checado */
          color: red; /* O X ficará visível em branco */
        }

        .custom-check:not(.checked):hover {
          background-color: #4caf50; /* Muda a cor ao passar o mouse */
        }
      `}</style>
      </div>
    </>
  );
}

export default App;
