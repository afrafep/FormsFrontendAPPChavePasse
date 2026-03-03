import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const NotFound = () => {
  const [confetti, setConfetti] = useState<number[]>([]);
  const [bubbles, setBubbles] = useState<number[]>([]);
  const [movingBubbles, setMovingBubbles] = useState<number[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verifica se há um token nos cookies
    const hasToken = document.cookie.split("; ").some((cookie) => cookie.startsWith("Frontend="));
    setIsAuthenticated(hasToken);

    const styleSheet = document.styleSheets[0];

    // Adicionando animações CSS
    styleSheet.insertRule(
      `@keyframes explode {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.5); opacity: 0.8; }
        100% { transform: scale(2); opacity: 0; }
      }`,
      styleSheet.cssRules.length
    );

    styleSheet.insertRule(
      `@keyframes confettiFall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }`,
      styleSheet.cssRules.length
    );

    styleSheet.insertRule(
      `@keyframes moveAround {
        0% { transform: translate(0, 0); }
        50% { transform: translate(${Math.random() * 120 - 75}px, ${Math.random() * 120 - 75}px); }
        100% { transform: translate(0, 0); }
      }`,
      styleSheet.cssRules.length
    );

    const newBubbles = [...Array(9).keys()];
    setBubbles(newBubbles);

    setTimeout(() => {
      setConfetti([...Array(30).keys()]);
      setMovingBubbles(newBubbles.slice(0, 0));
    }, 1000);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
        <img
          src="https://i0.wp.com/afrafepsaude.com.br/wp-content/uploads/2021/06/logo.png?w=692&ssl=1"
          alt="Logo AFRAFEP"
          style={styles.logo}
        />
        <h1 style={styles.title}>404</h1>
        <p style={styles.text}>A página que você procura pode ter sido removida ou não existe.</p>

        {/* Se houver token, exibe "Home", senão, "Login" */}
        <Link
          to={isAuthenticated ? "/forms" : "/login"}
          style={{ ...styles.button, ...(isHovered ? styles.buttonHover : {}) }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isAuthenticated ? "Voltar para a Página Inicial" : "Fazer Login"}
        </Link>
      </div>

      {bubbles.map((_, index) => (
        <div
          key={index}
          style={{
            ...styles.bubble,
            top: `${Math.random() * 50 + 20}%`,
            left: `${Math.random() * 50 + 25}%`,
            backgroundColor: getRandomColor(),
            animation: movingBubbles.includes(index)
              ? "moveAround 4s infinite alternate ease-in-out"
              : "explode 1s ease-out forwards",
          }}
        ></div>
      ))}

      {confetti.map((_, index) => (
        <div
          key={index}
          style={{
            ...styles.confetti,
            top: `${Math.random() * 40 + 25}%`,
            left: `${Math.random() * 100}%`,
            backgroundColor: getRandomColor(),
          }}
        ></div>
      ))}
    </div>
  );
};

const getRandomColor = () => {
  const colors = ["#ff4757", "#1e90ff", "#2ed573", "#ffa502", "#ff6b81", "#5352ed", "#70a1ff", "#eccc68"];
  return colors[Math.floor(Math.random() * colors.length)];
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f4f4f4",
    color: "#333",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    margin: 0,
    overflow: "hidden",
    position: "relative",
  },
  overlay: {
    textAlign: "center",
    zIndex: 1,
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  logo: {
    width: "40rem",
    marginBottom: "20px",
  },
  title: {
    color: "#007BFF",
    fontSize: "3em",
    fontWeight: "bold",
    fontFamily: "Helvetica",
    marginBottom: "20px",
  },
  text: {
    fontSize: "1.4em",
    color: "#333",
  },
  button: {
    display: "inline-block",
    padding: "10px 20px",
    backgroundColor: "#007BFF",
    color: "white",
    borderRadius: "5px",
    textDecoration: "none",
    marginTop: "20px",
    transition: "background 0.3s, transform 0.2s",
  },
  buttonHover: {
    backgroundColor: "#0056b3",
  },
  bubble: {
    position: "absolute",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    opacity: 0.9,
  },
  confetti: {
    position: "absolute",
    width: "10px",
    height: "20px",
    borderRadius: "5px",
    opacity: 0.8,
    animation: "confettiFall 3s ease-in forwards",
  },
};

export default NotFound;
