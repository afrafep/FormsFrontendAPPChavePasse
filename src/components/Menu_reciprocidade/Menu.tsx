import Cookies from "js-cookie";
import { Nav, Navbar, Button } from "react-bootstrap";
import {
  BsFillBookFill,
  BsFillHouseDoorFill,
  BsFileEarmarkDiffFill,
  BsFileEarmarkXFill,
  BsBoxArrowRight, // Ícone para o botão de sair
} from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";

// Adicionando o gradiente de vermelho para azul no Navbar
const navbarStyle = {
  backgroundImage: "linear-gradient(to bottom, #003366 90%, #ffffff 100%)", // Gradiente de azul para branco com transição suave
};

export default function App() {
  const navigate = useNavigate();

  // Função para realizar o logout
  const handleLogout = () => {
    Cookies.remove("Frontend"); 
    Cookies.remove("Frontend"); 
    Cookies.remove("alertShownExclusao");
    Cookies.remove("alertShownAdesao");
    Cookies.remove("alertShownReciprocidade");

    navigate("/login"); // Redireciona para a tela de login após o logout
  };

  return (
    <Navbar collapseOnSelect expand="lg" style={navbarStyle}>
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav variant="dark" className="mr-auto">
          <Link
            className="text-esat-100 hover:text-red-700 mt-2 sm:ml-[60px] mr-2"
            to="/Home"
          >
            <BsFillHouseDoorFill /> Home
          </Link>
          <Link
            className="text-esat-100 hover:text-red-700 mt-2 mr-3"
            to="/Reciprocidade"
          >
            <BsFillBookFill /> Reciprocidade
          </Link>
          <Link
            className="text-esat-100 hover:text-red-700 mt-2 mr-3"
            to="/Adesao"
          >
            <BsFileEarmarkDiffFill /> Adesão
          </Link>
          <Link
            className="text-esat-100 hover:text-red-700 mt-2 mr-3"
            to="/Exclusao"
          >
            <BsFileEarmarkXFill /> Exclusão
          </Link>
        </Nav>

        {/* Botão de logout estilizado com o ícone ao lado do texto e cor vermelha */}
        <Button
          variant="danger" // Isso define o fundo como vermelho
          onClick={handleLogout}
          className="ml-3 py-2 px-4 rounded-lg shadow-md transform transition-all duration-300 ease-in-out hover:scale-105 bg-red-500 hover:bg-red-700 hover:shadow-xl focus:outline-none flex items-center"
        >
          <BsBoxArrowRight className="mr-2" /> Sair
        </Button>
      </Navbar.Collapse>
    </Navbar>
  );
}
