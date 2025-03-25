import React, { useEffect, useRef, useState } from 'react';
import MicButton from './MicButton';
import ChatMessage from './ChatMessage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { useToast } from '@/hooks/use-toast';

// Fix for the SpeechRecognition TypeScript error
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const HealthAssistant = () => {
  const [messages, setMessages] = useState<{ text: string; type: 'user' | 'bot' }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [userLanguage, setUserLanguage] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [currentSymptoms, setCurrentSymptoms] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [currentSymptomBeingProcessed, setCurrentSymptomBeingProcessed] = useState<string | null>(null);
  
  const chatboxRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const symptoms = {
    fever: {
      keywords: {
        "en": ["fever", "high temperature", "hot body", "chills"],
        "es": ["fiebre", "temperatura alta", "escalofríos"],
        "hi": ["बुखार", "तेज़ बुखार", "गर्म शरीर"],
        "ta": ["காய்ச்சல்", "உயர் வெப்பநிலை", "சளி"]
      },
      questions: {
        "en": ["Do you also have chills?", "What is your temperature?", "How long have you had the fever?"],
        "es": ["¿También tienes escalofríos?", "¿Cuál es tu temperatura?", "¿Cuánto tiempo has tenido fiebre?"],
        "hi": ["क्या आपको ठंड लग रही है?", "आपका तापमान क्या है?", "आपको कितने दिनों से बुखार है?"],
        "ta": ["உங்களுக்கு சளி உள்ளதா?", "உங்கள் வெப்பநிலை என்ன?", "நீங்கள் எத்தனை நாட்களாக காய்ச்சலால் பாதிக்கப்பட்டுள்ளீர்கள்?"]
      },
      medicine: {
        "en": "Paracetamol (Tylenol) or Ibuprofen.",
        "es": "Paracetamol (Tylenol) o Ibuprofeno.",
        "hi": "पेरासिटामोल (टायलेनोल) या इबुप्रोफेन।",
        "ta": "பாராசிட்டமால் (Tylenol) அல்லது இபுபுரோபின்."
      },
      advice: {
        "en": "Stay hydrated, rest, and monitor your temperature.",
        "es": "Mantente hidratado, descansa y controla tu temperatura.",
        "hi": "हाइड्रेटेड रहें, आराम करें और अपने तापमान की निगरानी करें।",
        "ta": "நீர்ப் பஞ்சம் தவிர்க்கவும், ஓய்வெடுக்கவும், உங்கள் வெப்பநிலையை கண்காணிக்கவும்."
      },
      link: "https://www.webmd.com/cold-and-flu/fever"
    },
    cold: {
      keywords: {
        "en": ["cold", "running nose", "sneezing", "stuffy nose"],
        "es": ["resfriado", "nariz que moquea", "estornudos"],
        "hi": ["सर्दी", "बहती नाक", "छींक"],
        "ta": ["குளிர்", "நெற்றிக்கட்டு", "தும்மல்"]
      },
      questions: {
        "en": ["Do you have a runny nose?", "Are you experiencing sneezing?", "Do you feel congested?"],
        "es": ["¿Tienes la nariz que moquea?", "¿Estás estornudando?", "¿Te sientes congestionado?"],
        "hi": ["क्या आपकी नाक बह रही है?", "क्या आपको छींक आ रही है?", "क्या आपको भीड़भाड़ महसूस हो रही है?"],
        "ta": ["உங்கள் மூக்கு ஒழுகுகிறதா?", "நீங்கள் தும்முகிறீர்களா?", "நீங்கள் மூச்சுத்திணறல் உணர்கிறீர்களா?"]
      },
      medicine: {
        "en": "Antihistamines or decongestants.",
        "es": "Antihistamínicos o descongestionantes.",
        "hi": "एंटीहिस्टामिन या डीकॉन्जेस्टेंट्स।",
        "ta": "ஆன்டிஹிஸ்டமின்கள் அல்லது மூக்கழற்சி நிவாரணி."
      },
      advice: {
        "en": "Drink warm fluids, rest, and use steam inhalation.",
        "es": "Bebe líquidos calientes, descansa y usa inhalación de vapor.",
        "hi": "गर्म तरल पदार्थ पिएं, आराम करें और भाप लें।",
        "ta": "சூடான திரவங்களை குடிக்கவும், ஓய்வெடுக்கவும், நீராவி இழுக்கவும்."
      },
      link: "https://www.webmd.com/cold-and-flu/cold-guide"
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = userLanguage;
    utterance.rate = 1;
    utterance.volume = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    
    addMessage(text, 'bot');
  };

  const addMessage = (text: string, type: 'user' | 'bot') => {
    setMessages(prev => [...prev, { text, type }]);
    
    // Scroll to bottom after message is added
    setTimeout(() => {
      if (chatboxRef.current) {
        chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
      }
    }, 100);
  };

  const saveHealthHistory = (symptom: string) => {
    let history = JSON.parse(localStorage.getItem("healthHistory") || "[]");
    history.push({ date: new Date().toLocaleString(), symptom });
    localStorage.setItem("healthHistory", JSON.stringify(history));
  };

  const handleHealthQuery = (message: string) => {
    let foundSymptoms: string[] = [];
    
    Object.keys(symptoms).forEach(symptom => {
      const symptomKeywords = symptoms[symptom as keyof typeof symptoms].keywords[userLanguage as keyof typeof symptoms.fever.keywords];
      
      symptomKeywords.forEach((keyword: string) => {
        if (message.includes(keyword)) {
          foundSymptoms.push(symptom);
          setUserAnswers(prev => ({
            ...prev,
            [symptom]: []
          }));
          saveHealthHistory(symptom);
        }
      });
    });

    if (foundSymptoms.length > 0) {
      setCurrentSymptoms(foundSymptoms);
      setCurrentSymptomBeingProcessed(foundSymptoms[0]);
      setQuestionIndex(0);
      
      // Ask the first question
      const firstSymptom = foundSymptoms[0] as keyof typeof symptoms;
      speak(symptoms[firstSymptom].questions[userLanguage as keyof typeof symptoms.fever.questions][0]);
      return;
    }

    speak("I'm not sure about that. Please consult a medical professional.");
  };

  const processUserResponse = (message: string) => {
    if (currentSymptomBeingProcessed) {
      // Add user's answer to the symptom being processed
      setUserAnswers(prev => ({
        ...prev,
        [currentSymptomBeingProcessed]: [
          ...(prev[currentSymptomBeingProcessed] || []),
          message
        ]
      }));

      const nextQuestionIndex = questionIndex + 1;
      setQuestionIndex(nextQuestionIndex);

      const symptomData = symptoms[currentSymptomBeingProcessed as keyof typeof symptoms];
      const questions = symptomData.questions[userLanguage as keyof typeof symptoms.fever.questions];

      if (nextQuestionIndex < questions.length) {
        // Ask the next question
        speak(questions[nextQuestionIndex]);
      } else {
        // Provide advice and medicine recommendations
        const advice = symptomData.advice[userLanguage as keyof typeof symptoms.fever.advice];
        const medicine = symptomData.medicine[userLanguage as keyof typeof symptoms.fever.medicine];
        
        speak(`${advice} ${medicine}`);
        
        // Show toast with medical info link
        toast({
          title: "Medical Information",
          description: "Learn more about your symptoms",
          action: (
            <Button variant="outline" size="sm" onClick={() => window.open(symptomData.link, '_blank')}>
              Visit
            </Button>
          ),
        });
        
        // Reset current symptom being processed
        setCurrentSymptomBeingProcessed(null);
      }
    } else {
      // Start a new health query
      handleHealthQuery(message.toLowerCase());
    }
  };

  const handleMicButton = () => {
    if (!isListening) {
      try {
        setIsListening(true);
        addMessage("Listening...", 'user');
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = userLanguage;
        
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          addMessage(transcript, 'user');
          processUserResponse(transcript.toLowerCase());
          setIsListening(false);
        };
        
        recognition.onerror = () => {
          toast({
            title: "Error",
            description: "There was an error with the speech recognition. Please try again or type your message.",
            variant: "destructive",
          });
          setIsListening(false);
        };
        
        recognition.start();
      } catch (error) {
        console.error("Speech recognition error:", error);
        toast({
          title: "Not Supported",
          description: "Speech recognition is not supported in your browser. Please try typing instead.",
          variant: "destructive",
        });
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = () => {
    if (userInput.trim()) {
      addMessage(userInput, 'user');
      processUserResponse(userInput.toLowerCase());
      setUserInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleLanguageChange = (lang: string) => {
    setUserLanguage(lang);
    speak(
      lang === 'en' ? "Hello! I am your Virtual Health Assistant." :
      lang === 'es' ? "¡Hola! Soy tu asistente de salud virtual." :
      lang === 'hi' ? "नमस्ते! मैं आपका वर्चुअल हेल्थ असिस्टेंट हूं।" :
      "வணக்கம்! நான் உங்கள் நல உதவியாளர்."
    );
  };

  // Greet the user when component mounts
  useEffect(() => {
    const greetings = {
      "en": "Hello! I am your Virtual Health Assistant.",
      "es": "¡Hola! Soy tu asistente de salud virtual.",
      "hi": "नमस्ते! मैं आपका वर्चुअल हेल्थ असिस्टेंट हूं।",
      "ta": "வணக்கம்! நான் உங்கள் நல உதவியாளர்."
    };
    speak(greetings[userLanguage as keyof typeof greetings]);
  }, []);

  return (
    <div className="flex flex-col h-[80vh]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-primary">Health Buddy</h1>
        <select
          value={userLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-background border border-input rounded-md p-2"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="hi">हिन्दी</option>
          <option value="ta">தமிழ்</option>
        </select>
      </div>

      <Card className="flex-grow overflow-hidden mb-4 border border-border/50">
        <div 
          ref={chatboxRef}
          className="h-full overflow-y-auto p-4 space-y-4"
        >
          {messages.map((msg, index) => (
            <ChatMessage
              key={index}
              message={msg.text}
              type={msg.type}
            />
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-2">
        <Input
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your health concern..."
          className="flex-grow"
        />
        <Button onClick={handleSendMessage}>Send</Button>
        <MicButton onClick={handleMicButton} />
      </div>
    </div>
  );
};

export default HealthAssistant;
