import { useContext, useEffect, useState, useRef } from 'react';
import { UserDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import aiImg from "../assets/ai.gif";
import userImg from '../assets/user.gif';
import { CgMenuRight } from 'react-icons/cg';
import { RxCross1 } from 'react-icons/rx';

function Home() {
  const navigate = useNavigate();
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(UserDataContext);

  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState('');
  const [aiText, setAiText] = useState('');
  const [ham, setHam] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const isRecognizingRef = useRef(false);
  const isMountedRef = useRef(true);
  const hasWelcomedRef = useRef(false);

  // Detect SpeechRecognition support (Firefox does NOT support it)
  const SpeechRecognitionAPI =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  const isSpeechSupported = !!SpeechRecognitionAPI;

  // SpeechSynthesis reference — may be undefined on some Firefox builds
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const handleLogout = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setUserData(null);
      navigate("/signin");
    }
  };

  /* ===================== SPEAK ===================== */
  const speak = (text) => {
    if (!text || !synth) return Promise.resolve();

    // Guard against Firefox throwing on cancel()
    try { synth.cancel(); } catch (e) { /* ignore */ }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      isSpeakingRef.current = true;

      utterance.onend = () => {
        isSpeakingRef.current = false;
        setAiText('');
        resolve();
      };
      utterance.onerror = () => {
        isSpeakingRef.current = false;
        resolve();
      };

      const trySpeak = () => {
        const voices = synth.getVoices();
        const hindiVoice = voices.find(
          v => v.lang === 'hi-IN' || v.name.toLowerCase().includes('hindi')
        );
        if (hindiVoice) utterance.voice = hindiVoice;
        try { synth.speak(utterance); } catch (e) { resolve(); }
      };

      const voices = synth.getVoices();
      if (voices.length === 0) {
        // Firefox: voiceschanged may fire late — use both event + timeout fallback
        let handled = false;
        const doSpeak = () => {
          if (handled) return;
          handled = true;
          synth.onvoiceschanged = null;
          trySpeak();
        };
        synth.onvoiceschanged = doSpeak;
        // Fallback: speak anyway after 600ms if event never fires (Firefox bug)
        setTimeout(doSpeak, 600);
      } else {
        trySpeak();
      }
    });
  };

  /* ===================== OPEN LINKS ===================== */
  const openInNewTab = (url) => {
    if (!url) return;
    try {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      // Firefox popup blocker: fall back to same-tab navigation
      if (!win) window.location.href = url;
    } catch (e) {
      window.location.href = url;
    }
  };

  /* ===================== COMMAND HANDLER ===================== */
  const handleCommand = async (data) => {
    if (!data) return;
    const { type, userInput, response } = data;
    const query = encodeURIComponent(userInput || '');

    switch (type) {
      case 'google-search':
        openInNewTab(`https://www.google.com/search?q=${query}`);
        break;
      case 'youtube-search':
      case 'youtube-play':
      case 'youtube-open':
        openInNewTab(`https://www.youtube.com/results?search_query=${query}`);
        break;
      case 'calculator-open':
        openInNewTab('https://www.online-calculator.com/');
        break;
      case 'instagram-open':
        openInNewTab('https://www.instagram.com/');
        break;
      case 'facebook-open':
        openInNewTab('https://www.facebook.com/');
        break;
      case 'weather-show':
        openInNewTab(`https://www.google.com/search?q=weather+${query}`);
        break;
      default:
        break;
    }

    await speak(response);
  };

  /* ===================== TEXT INPUT FALLBACK (Firefox / no mic) ===================== */
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;

    const input = textInput.trim();
    setTextInput('');
    setIsProcessing(true);
    setUserText(input);
    setAiText('');

    try {
      const data = await getGeminiResponse(input);
      setUserText('');
      setAiText(data.response);
      await handleCommand(data);
    } catch (err) {
      console.error("Assistant error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  /* ===================== SPEECH RECOGNITION (Chrome/Edge only) ===================== */
  useEffect(() => {
    if (!SpeechRecognitionAPI) return;
    isMountedRef.current = true;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    const safeStart = () => {
      if (!isMountedRef.current || isSpeakingRef.current || isRecognizingRef.current) return;
      try { recognition.start(); } catch (err) {
        if (err.name !== 'InvalidStateError') console.error(err);
      }
    };

    recognition.onstart = () => { isRecognizingRef.current = true; setListening(true); };
    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);
      if (!isSpeakingRef.current) setTimeout(safeStart, 1000);
    };
    recognition.onerror = () => {
      isRecognizingRef.current = false;
      setListening(false);
      if (!isSpeakingRef.current) setTimeout(safeStart, 1000);
    };

    recognition.onresult = async (e) => {
      const result = e.results[e.results.length - 1];
      if (!result.isFinal) return;

      const transcript = result[0].transcript.trim();
      const assistantTrigger = userData?.assistantName?.toLowerCase();
      if (!assistantTrigger) return;
      if (!transcript.toLowerCase().includes(assistantTrigger)) return;

      recognition.stop();
      isRecognizingRef.current = false;
      setListening(false);
      setUserText(transcript);
      setAiText('');

      try {
        const data = await getGeminiResponse(transcript);
        setUserText('');
        setAiText(data.response);
        await handleCommand(data);
      } catch (err) {
        console.error("Assistant failed safely", err);
      }
    };

    safeStart();

    const fallback = setInterval(() => {
      if (!isRecognizingRef.current && !isSpeakingRef.current) safeStart();
    }, 5000);

    return () => {
      isMountedRef.current = false;
      clearInterval(fallback);
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      try { recognition.stop(); } catch (e) { /* ignore */ }
    };
  }, [userData?.assistantName, getGeminiResponse]);

  /* ===================== WELCOME GREETING ===================== */
  useEffect(() => {
    if (!userData?.assistantName) return;
    if (!hasWelcomedRef.current && !sessionStorage.getItem("assistant_welcomed")) {
      hasWelcomedRef.current = true;
      sessionStorage.setItem("assistant_welcomed", "true");
      speak("Hello, how can I help you?");
    }
  }, [userData?.assistantName]);

  /* ===================== UI ===================== */
  return (
    <div className="w-full min-h-[100vh] bg-gradient-to-t from-black to-[#030355] flex flex-col justify-center items-center gap-[15px] relative overflow-hidden">

      {/* Firefox / unsupported browser banner */}
      {!isSpeechSupported && (
        <div
          className="absolute top-0 left-0 w-full flex items-center justify-center gap-2 px-4 py-2 z-50 text-sm font-semibold"
          style={{ background: 'linear-gradient(90deg,#e65c00,#f9d423)', color: '#1a1a1a' }}
        >
          <span>⚠️</span>
          <span>
            Voice recognition is not supported in Firefox. Type your command below to use the assistant.
          </span>
        </div>
      )}

      {/* Hamburger icon (mobile) */}
      <CgMenuRight
        className="lg:hidden text-white absolute top-[20px] right-[30px] w-[25px] h-[25px] z-30"
        onClick={() => setHam(true)}
      />

      {/* Mobile slide-in menu */}
      <div
        className={`${
          ham
            ? 'absolute top-0 w-full h-full z-40 flex flex-col p-[20px] gap-[20px] items-start'
            : 'hidden'
        }`}
        style={ham ? { background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : {}}
      >
        <RxCross1
          className="text-white absolute top-[20px] right-[20px] w-[25px] h-[25px] z-50 cursor-pointer"
          onClick={() => setHam(false)}
        />

        <button
          className="min-w-[150px] h-[60px] bg-white text-black font-semibold text-[18px] rounded-full px-[20px] flex justify-center items-center"
          onClick={handleLogout}
        >
          Log Out
        </button>

        <button
          className="min-w-[150px] h-[60px] bg-white text-black font-semibold text-[18px] rounded-full px-[20px] flex justify-center items-center"
          onClick={() => navigate("/customize")}
        >
          Customize Your Assistant
        </button>

        <div className="w-full h-[2px] bg-gray-400" />
        <h1 className="text-white font-semibold text-[19px]">History</h1>
        <div className="w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col">
          {userData?.history?.length
            ? userData.history.map((his, i) => (
                <span key={i} className="text-gray-200 text-[18px] truncate">{his}</span>
              ))
            : <span className="text-gray-400">No history available</span>
          }
        </div>
      </div>

      {/* Desktop buttons */}
      <button
        className="min-w-[150px] h-[60px] bg-white text-black font-semibold text-[18px] rounded-full absolute hidden lg:flex top-[20px] right-[20px] px-[20px] justify-center items-center"
        onClick={handleLogout}
      >
        Log Out
      </button>

      <button
        className="min-w-[150px] h-[60px] bg-white text-black font-semibold text-[18px] rounded-full absolute hidden lg:flex top-[100px] right-[20px] px-[20px] justify-center items-center"
        onClick={() => navigate("/customize")}
      >
        Customize Your Assistant
      </button>

      <button
        className="min-w-[150px] h-[60px] bg-white text-black font-semibold text-[18px] rounded-full absolute hidden lg:flex top-[180px] right-[20px] px-[20px] justify-center items-center"
        onClick={() => setHam(true)}
      >
        History
      </button>

      {/* Assistant avatar */}
      <div
        className="w-[300px] h-[400px] flex justify-center items-center overflow-hidden shadow-lg"
        style={{ borderRadius: '2rem', marginTop: !isSpeechSupported ? '48px' : '0' }}
      >
        <img src={userData?.assistantImage} alt="Assistant" className="w-full h-full object-cover" />
      </div>

      <h1 className="text-white text-[18px] font-semibold">Hi I am {userData?.assistantName}</h1>

      {/* Voice mode: gifs + transcript (Chrome/Edge) */}
      {isSpeechSupported && (
        <>
          {!aiText && <img src={userImg} alt="user listening" className="w-[200px]" />}
          {aiText && <img src={aiImg} alt="assistant speaking" className="w-[200px]" />}
          <h1 className="text-white text-[18px] font-semibold text-center px-4">
            {userText ? userText : aiText ? aiText : null}
          </h1>
          {listening && (
            <p className="text-green-400 text-[14px] animate-pulse">🎙️ Listening...</p>
          )}
        </>
      )}

      {/* Text input fallback (always visible; primary in Firefox) */}
      <div className="w-full max-w-[600px] px-4 flex flex-col items-center gap-3">
        {!isSpeechSupported && (userText || aiText) && (
          <div
            className="w-full rounded-2xl p-4 text-white text-[16px] text-center"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)' }}
          >
            {userText && <p className="text-blue-300 mb-1">You: {userText}</p>}
            {aiText && (
              <>
                <img src={aiImg} alt="assistant speaking" className="w-[80px] mx-auto my-2" />
                <p className="text-white">{aiText}</p>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleTextSubmit} className="w-full flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={
              isSpeechSupported
                ? `Or type a command to ${userData?.assistantName || 'your assistant'}...`
                : `Type a command for ${userData?.assistantName || 'your assistant'}...`
            }
            disabled={isProcessing}
            className="flex-1 h-[52px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-400 px-[20px] rounded-full text-[16px]"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          />
          <button
            type="submit"
            disabled={isProcessing || !textInput.trim()}
            className="h-[52px] px-6 bg-white text-black font-semibold text-[16px] rounded-full"
            style={{ opacity: isProcessing || !textInput.trim() ? 0.5 : 1, cursor: isProcessing || !textInput.trim() ? 'not-allowed' : 'pointer' }}
          >
            {isProcessing ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Home;
