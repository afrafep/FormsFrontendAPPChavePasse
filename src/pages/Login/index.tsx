import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { MDBFooter } from "mdb-react-ui-kit";
import { motion } from "framer-motion";
import Cookies from "js-cookie";
import { toast, ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import logologin from "../../assets/logotela.avif";
import { FaUser, FaEye, FaEyeSlash } from "react-icons/fa"; // Importando os ícones
import { formsFetch } from "../../services/api";

const loginApi = async (
  username: string,
  password: string
): Promise<{ success: boolean; message: string; token?: string }> => {
  try {
    const response = await formsFetch(
      "/Acess",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: username, password: password }),
      }
    );
    const data = await response.json();
    return {
      success: data.success,
      message: data.message,
      token: data.token || undefined,
    };
  } catch (error) {
    throw new Error("Usuário ou Senha inválidos.");
  }
};

export default function Login() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false); // Estado para mostrar/ocultar senha
  const navigate = useNavigate();

  const toastConfig: ToastOptions = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    style: { backgroundColor: "black", color: "white" },
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginApi(username, password);

      if (response.success && response.token) {
        Cookies.set("Frontend", response.token, { expires: 1 });

        let count = 3;
        const countdownToast = toast.success(
          `Logando em ${count} segundos...`,
          toastConfig
        );

        setButtonDisabled(true);

        const countdownInterval = setInterval(() => {
          count--;
          toast.update(countdownToast, {
            render: `Logando em ${count} segundos...`,
          });

          if (count === 0) {
            clearInterval(countdownInterval);
            setTimeout(() => {
              navigate("/forms");
              window.location.reload();
            }, 500);
          }
        }, 1000);
      } else {
        toast.error(response.message || "Falha no login", toastConfig);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro desconhecido",
        toastConfig
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <MDBFooter style={{ backgroundColor: "#F5F5F5" }} className="flex h-screen">
      <div className="w-[100%] h-[100%] absolute bg-blue-500 opacity-90">
        <img
          src={logologin}
          alt="logo"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="w-full h-full flex items-center justify-center relative z-10 opacity-85">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 50 }}
          className="bg-white p-8 shadow-md rounded-lg w-full max-w-md"
        >
          <motion.div
            className="flex justify-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.img
              src="https://i0.wp.com/afrafepsaude.com.br/wp-content/uploads/2021/06/logo.png?w=692&ssl=1"
              alt="Logo AFRAFEP"
              className="w-60 h-auto"
            />
          </motion.div>

          <motion.form
            onSubmit={handleLogin}
            className="flex flex-col items-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-lg font-semibold mb-4">Login</h2>
            <motion.div
              className="mb-4 w-full relative"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <label className="block">Usuário</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="p-2 border rounded w-full pr-12"
              />
              <FaUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer mt-3" />
            </motion.div>

            <motion.div className="relative mb-4 w-full">
              <label className="block">Senha</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="p-2 border rounded w-full pr-12"
              />
              {showPassword ? (
                <FaEye
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer mt-3"
                />
              ) : (
                <FaEyeSlash
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer mt-3"
                />
              )}
            </motion.div>

            {!loading && (
              <motion.button
                type="submit"
                disabled={buttonDisabled || loading}
                className="relative px-4 py-2 rounded w-full bg-blue-500 hover:bg-blue-600 text-white"
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                Entrar
              </motion.button>
            )}
            {loading && (
              <motion.div
                className="w-full h-12 flex justify-center items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-8 h-8 border-4 border-t-transparent border-blue-500 rounded-full animate-spin" />
              </motion.div>
            )}
            <ToastContainer />
          </motion.form>
        </motion.div>
      </div>
    </MDBFooter>
  );
}
