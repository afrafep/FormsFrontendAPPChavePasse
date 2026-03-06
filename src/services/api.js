import axios from "axios";

export const FORMS_API_URL =
  process.env.REACT_APP_FORMS_API_URL ||
  "https://api.afrafepsaude.com.br/forms";
export const MOSIA_API_URL =
  process.env.REACT_APP_MOSIA_API_URL || "https://api.mosiaomnichannel.com.br";

export const CHAVE_FUNC = process.env.REACT_APP_CHAVE_FUNC || "";
export const CHAVE_TOKEN = process.env.REACT_APP_CHAVE_TOKEN || "";
export const MOCK_CPF = (
  process.env.REACT_APP_MOCK_CPF ||
  process.env.REACT_APP_mock_cpf ||
  process.env.REACT_APP_MOCK_CHAVE_UNICA ||
  ""
).trim();

const CHAVE_CACHE_KEY = "afrafep_chave_unica_cache";

export const formsApi = axios.create({
  baseURL: FORMS_API_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${CHAVE_TOKEN}`,
  },
});

export const formsUrl = (path = "") =>
  `${FORMS_API_URL}/${path}`.replace(/([^:]\/)\/+/g, "$1");

export const getMosiaHeaders = (token = CHAVE_TOKEN) => ({
  "Content-Type": "application/json",
  Authorization: token,
});

export const getBearerHeaders = (token = CHAVE_TOKEN) => ({
  Authorization: `Bearer ${token}`,
});

const isFormsApiRequest = (url = "", baseURL = "") => {
  const cleanUrl = String(url || "");
  const cleanBaseURL = String(baseURL || "");

  if (!cleanUrl) return false;

  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl.startsWith(FORMS_API_URL);
  }

  if (cleanBaseURL) {
    return cleanBaseURL.startsWith(FORMS_API_URL);
  }

  return false;
};

axios.interceptors.request.use((config) => {
  if (!CHAVE_TOKEN) return config;

  if (isFormsApiRequest(config.url, config.baseURL)) {
    config.headers = {
      ...(config.headers || {}),
      ...getBearerHeaders(CHAVE_TOKEN),
    };
  }

  return config;
});

formsApi.interceptors.request.use((config) => {
  if (!CHAVE_TOKEN) return config;

  config.headers = {
    ...(config.headers || {}),
    ...getBearerHeaders(CHAVE_TOKEN),
  };

  return config;
});

export const formsFetch = (pathOrUrl = "", options = {}) => {
  const url =
    String(pathOrUrl).startsWith("http://") ||
    String(pathOrUrl).startsWith("https://")
      ? String(pathOrUrl)
      : formsUrl(pathOrUrl);

  const headers = {
    ...(options.headers || {}),
    ...getBearerHeaders(CHAVE_TOKEN),
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

const readChaveCache = () => {
  try {
    const raw = localStorage.getItem(CHAVE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

export const getCachedChaveUnica = (chavePasse) => {
  const cache = readChaveCache();
  if (!cache) return "";
  if (cache.chavePasse !== chavePasse) return "";
  return cache.chaveUnica || "";
};

export const setCachedChaveUnica = (chavePasse, chaveUnica) => {
  if (!chavePasse || !chaveUnica) return;
  localStorage.setItem(
    CHAVE_CACHE_KEY,
    JSON.stringify({
      chavePasse,
      chaveUnica,
      updatedAt: new Date().toISOString(),
    })
  );
};

export const fetchChaveUnicaByChavePasse = async (
  chavePasse,
  chaveFunc = CHAVE_FUNC,
  token = CHAVE_TOKEN
) => {
  const response = await axios.get(
    `${MOSIA_API_URL}/clientes/chavePasse/usuario`,
    {
      params: {
        chavePasse,
        chaveFuncionalidade: chaveFunc,
      },
      headers: getMosiaHeaders(token),
    }
  );

  const chaveUnica = response.data?.data?.chaveUnica || "";
  if (chaveUnica) {
    setCachedChaveUnica(chavePasse, chaveUnica);
  }
  return chaveUnica;
};

export const fetchMosiaUserByChavePasse = async (
  chavePasse,
  chaveFunc = CHAVE_FUNC,
  token = CHAVE_TOKEN
) => {
  const response = await axios.get(
    `${MOSIA_API_URL}/clientes/chavePasse/usuario`,
    {
      params: {
        chavePasse,
        chaveFuncionalidade: chaveFunc,
      },
      headers: getMosiaHeaders(token),
    }
  );

  const chaveUnica = response.data?.data?.chaveUnica || "";
  if (chaveUnica) {
    setCachedChaveUnica(chavePasse, chaveUnica);
  }
  return response.data;
};

export const getChaveUnica = async (
  chavePasse,
  { preferCache = true, allowFetch = true } = {}
) => {
  if (MOCK_CPF) {
    if (chavePasse) {
      setCachedChaveUnica(chavePasse, MOCK_CPF);
    }
    return MOCK_CPF;
  }

  if (!chavePasse) return "";

  if (preferCache) {
    const cached = getCachedChaveUnica(chavePasse);
    if (cached) return cached;
  }

  if (!allowFetch) return "";

  return fetchChaveUnicaByChavePasse(chavePasse);
};
