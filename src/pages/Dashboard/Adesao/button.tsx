import React from 'react';
import { MdCheckCircle, MdCancel } from 'react-icons/md'; // Ícones do react-icons

interface ButtonProps {
  isAudited: boolean;
}

const Button: React.FC<ButtonProps> = ({ isAudited }) => {
  return (
    <button
      className={`px-4 py-2 rounded text-white flex items-center ${
        isAudited ? 'bg-green-500' : 'bg-red-400'
      }`}
    >
      {/* Ícones do react-icons */}
      {isAudited ? (
        <MdCheckCircle className="h-5 w-5 mr-2" />  // Ícone de check verde
      ) : (
        <MdCancel className="h-5 w-5 mr-2" />  // Ícone de alerta vermelho
      )}
      {isAudited ? 'Concluido' : 'Pendente'}
    </button>
  );
};

export default Button;
