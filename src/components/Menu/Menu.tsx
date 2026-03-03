import { Nav, Navbar } from "react-bootstrap";
import { BsArrowLeft } from "react-icons/bs"; // Ícone de voltar
import { Link } from "react-router-dom";

// Estilo personalizado para o Navbar
const navbarStyle = {
  backgroundImage: "linear-gradient(to bottom, #003366, #0055aa)", // Gradiente azul profissional
  color: "#fff",
  padding: "10px",
};

export default function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const chavePasse = queryParams.get("chavePasse") || ""; // Pegando chavePasse da URL

  return (
    <Navbar style={navbarStyle}>
      {/* Logo ou título */}
      <Navbar.Brand href="/" className="text-white"></Navbar.Brand>

      {/* Menu de navegação (sempre visível) */}
      <Nav className="ml-auto">
        {/* Botão de voltar para home com chavePasse */}
        <Link
          className="nav-link text-white hover:text-red-300"
          to={`/?chavePasse=${chavePasse}`}
        >
          <BsArrowLeft /> Voltar
        </Link>
      </Nav>
    </Navbar>
  );
}
