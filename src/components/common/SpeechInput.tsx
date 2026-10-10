import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface SpeechInputProps {
  onTranscript: (text: string) => void;
  title?: string;
}

export const SpeechInput: React.FC<SpeechInputProps> = ({
  onTranscript,
  title = 'Click to speak crop or quantity',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type directly.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={title}
      aria-label={title}
      className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border flex items-center justify-center transition-all focus:ring-2 focus:ring-[#1E5E3A] outline-none ${
        isListening
          ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
          : 'bg-emerald-50 hover:bg-emerald-100 text-[#1E5E3A] border-emerald-200 dark:bg-[#1A2E22] dark:hover:bg-[#223F2F] dark:text-[#2ECC71] dark:border-[#2C523A]'
      }`}
    >
      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  );
};
