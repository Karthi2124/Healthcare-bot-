import React from 'react';
import { Mic } from 'lucide-react';

type MicButtonProps = {
  onClick: () => void;
};

const MicButton: React.FC<MicButtonProps> = ({ onClick }) => {
  return (
    <button 
      className="talk p-4 bg-primary rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-white"
      onClick={onClick}
      aria-label="Activate voice input"
    >
      <Mic className="h-6 w-6" />
    </button>
  );
};

export default MicButton;
