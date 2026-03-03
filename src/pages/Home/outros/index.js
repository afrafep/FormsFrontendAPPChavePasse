import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  // Obtém o valor de chavePasse da URL
  const queryParams = new URLSearchParams(window.location.search);
  const chavePasse = queryParams.get('chavePasse') || ''; // Valor da URL ou string vazia

  const chaveFunc = "7a516ed5-1ae8-4980-abd4-f4c033027e26";
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlzIjoiY2hhdmVQYXNzZSIsImtleSI6IjVjZDg2OThhLTllNzYtNDIwYy04MTJiLTc1ODZiMmQ5OTc2NiIsImlhdCI6MTczMzc1MDc2NiwiZXhwIjozMzExNjMwNzY2LCJhdWQiOiJhbGwifQ.pnMRmFnTk685RBuf2kpsly7Pmxam5SjjFoePUMFL0cQ";

/*   const chaveFunc = process.env.REACT_APP_CHAVE_FUNC;
  const token = process.env.REACT_APP_CHAVE_TOKEN; */
  
  const [responseData, setResponseData] = useState(null);
  const [dependentesData, setDependentesData] = useState(null); // Novo estado para dependentes
  const [error, setError] = useState(null);
  const [secondError, setSecondError] = useState(null); // Novo estado para capturar erros do segundo GET

  useEffect(() => {
    const fetchData = async () => {
      if (!chavePasse) {
        setError('Chave Passe não foi fornecida na URL.');
        return;
      }

      try {
        // Primeiro GET: busca informações do beneficiário
        const response = await axios.get(
          `https://api.mosiaomnichannel.com.br/clientes/chavePasse/usuario`,
          {
            params: {
              chavePasse,
              chaveFuncionalidade: chaveFunc,
            },
            headers: {
              'Content-Type': 'application/json',
              Authorization: `${token}`,
            },
          }
        );
        setResponseData(response.data); // Armazena a resposta do primeiro GET

        // Verificando se chaveUnica existe e se foi extraída corretamente
        const chaveUnica = response.data?.data?.chaveUnica;

        if (chaveUnica) {
          // Segundo GET: busca dependentes usando a chaveUnica do primeiro GET
          const dependentesResponse = await axios.get(
            `https://api.afrafepsaude.com.br/forms/reciprocidade/beneficiarios/${chaveUnica}`
          );
          setDependentesData(dependentesResponse.data); // Armazena a resposta do segundo GET
        } else {
          setSecondError('Chave Unica não encontrada no primeiro GET.');
        }
      } catch (err) {
        setError(err.message); // Armazena o erro do primeiro GET
      }
    };

    fetchData();
  }, [chavePasse, chaveFunc, token]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Resposta da API</h1>
      <div>
        <strong>Chave Passe:</strong> <p>{chavePasse}</p>
        <strong>Chave Funcionalidade:</strong> <p>{chaveFunc}</p>
        <strong>Resposta do Primeiro GET:</strong>
        {error ? (
          <p style={{ color: 'red' }}>Erro: {error}</p>
        ) : responseData ? (
          <>
            <pre>{JSON.stringify(responseData, null, 2)}</pre>
            <strong>Chave Unica do Beneficiário:</strong> <p>{responseData.data.chaveUnica}</p>
          </>
        ) : (
          <p>Carregando...</p>
        )}

        <strong>Resposta do Segundo GET (Dependentes):</strong>
        {secondError ? (
          <p style={{ color: 'red' }}>Erro do Segundo GET: {secondError}</p>
        ) : dependentesData ? (
          <pre>{JSON.stringify(dependentesData, null, 2)}</pre>
        ) : (
          <p>Carregando dependentes...</p>
        )}
      </div>
    </div>
  );
}

export default App;
