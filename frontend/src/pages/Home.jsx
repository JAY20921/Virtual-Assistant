import { useContext, useEffect, useState, useRef } from 'react';
import { UserDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import aiImg from "../assets/ai.gif";
import userImg from '../assets/user.gif'
import { CgMenuRight } from 'react-icons/cg';
import { RxCross1 } from 'react-icons/rx';

function Home() {
  const navigate = useNavigate();
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(UserDataContext);

  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState('');
  const [aiText, setAiText] = useState('');
  const [ham, setHam] = useState(false);

  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const isRecognizingRef = useRef(false);
  const isMountedRef = useRef(true);
  const hasWelcomedRef = useRef(false);

  const synth = window.speechSynthesis;

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
    if (!text) return Promise.resolve();

    synth.cancel();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      isSpeakingRef.current = true;

      const setVoiceAndSpeak = () => {
        const voices = synth.getVoices();
        const hindiVoice = voices.find(
          v => v.lang === 'hi-IN' || v.name.includes('Hindi')
        );
        if (hindiVoice) utterance.voice = hindiVoice;
        synth.speak(utterance);
      };
      

      utterance.onend = () => {
        isSpeakingRef.current = false;
        setAiText('');
        resolve();
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
        resolve();
      };

      if (synth.getVoices().length === 0) {
        synth.onvoiceschanged = setVoiceAndSpeak;
      } else {
        setVoiceAndSpeak();
      }
    });
  };

  /* ===================== COMMAND ===================== */
  const openInNewTab = (url) => {
    if (!url) return;
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) window.location.href = url;
  };

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

  /* ===================== LISTEN ===================== */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    const safeStart = () => {
      if (
        !isMountedRef.current ||
        isSpeakingRef.current ||
        isRecognizingRef.current
      ) return;

      try {
        recognition.start();
      } catch (err) {
        if (err.name !== 'InvalidStateError') console.error(err);
      }
    };

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);
      if (!isSpeakingRef.current) {
        setTimeout(safeStart, 1000);
      }
    };

    recognition.onerror = () => {
      isRecognizingRef.current = false;
      setListening(false);
      if (!isSpeakingRef.current) {
        setTimeout(safeStart, 1000);
      }
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
      if (!isRecognizingRef.current && !isSpeakingRef.current) {
        safeStart();
      }
    }, 5000);

    return () => {
      isMountedRef.current = false;
      clearInterval(fallback);
      try {
        recognition.stop();
      } catch(e) {
        console.error(e);
      }
    };
  }, [userData?.assistantName, getGeminiResponse]);

  useEffect(() => {
  if (!userData?.assistantName) return;

  const welcomed = sessionStorage.getItem("assistant_welcomed");

  if (!welcomed && !hasWelcomedRef.current) {
    hasWelcomedRef.current = true;
    sessionStorage.setItem("assistant_welcomed", "true");

    speak(
      "Hello, how can I help you?"
    );
  }
}, [userData?.assistantName]);


  /* ===================== UI (UNCHANGED) ===================== */
  return (
    <div className="w-full h-[100vh] bg-gradient-to-t from-black to-[#030355] flex flex-col justify-center items-center gap-[15px]">
      <CgMenuRight className='lg:hidden text-white absolute top-[20px] right-[30px] w-[25px] h-[25px]' onClick={()=>setHam(true)} />
        
       <div className={`${ham ? 'absolute top-0 w-full h-full bg-black/50 backdrop-blur-lg z-40 flex flex-col p-[20px] gap-[20px] items-start' : 'hidden'}`}>
       <RxCross1 className=' text-white absolute top-[20px] right-[20px] w-[25px] h-[25px] z-50'  onClick={()=>setHam(false)}/>
      
       <button className='min-w-[150px] h-[60px] bg-white text-black font-semibold text-[18px] rounded-full px-[20px] py-[20px]  flex flex-col gap-[20px] justify-center items-center' onClick={() => { handleLogout(); }} >
      Log Out 
        </button>
      
         <button className='min-w-[150px] h-[60px] bg-white text-black font-semibold text-[18px] rounded-full px-[20px] py-[20px] flex justify-center items-center' onClick={() => { navigate("/customize"); }} >
          Customize Your Assistant
          </button>
      
        <div className='w-full h-[2px] bg-gray-400' >
        </div>
        <h1 className='text-white font-semibold text-[19px] flex justify-center items-center'>History</h1>
        <div className=' w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col  ' >
          {
          userData?.history ? userData.history.map((his, i) => (
            <span key={i} className='text-gray-200 text-[18px] truncate '>{his}</span>
          )) 
          : <span>No history available</span>}
        
        </div>
       </div>

       <button className='min-w-[150px] h-[60px] bg-white text-black font-semibold text-[18px] rounded-full absolute hidden lg:block top-[20px] right-[20px] px-[20px] py-[20px] flex justify-center items-center' onClick={() => { handleLogout(); }} >
      Log Out 
        </button>
      
         <button className='min-w-[150px] h-[60px] bg-white text-black font-semibold text-[18px] rounded-full absolute hidden lg:block top-[100px] right-[20px] px-[20px] py-[20px] flex justify-center items-center' onClick={() => { navigate("/customize"); }} >
          Customize Your Assistant
          </button>
           <button className='min-w-[150px] h-[60px] bg-white text-black font-semibold text-[18px] rounded-full absolute hidden lg:block top-[180px] right-[20px] px-[20px] py-[20px] flex justify-center items-center' onClick={() => setHam(true)  } >
          History
        </button>
      <div className="w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg">
        <img src={userData?.assistantImage} alt="Assistant" className="w-full h-full object-cover"/>
      </div>
        <h1 className='text-white text-[18px] font-semibold '>Hi I am {userData?.assistantName}</h1>
        {!aiText && <img src={userImg} alt="" className='w-[200px]'/> }
        {aiText && <img src={aiImg} alt="" className='w-[200px]'/> }

        <h1 className='text-white text-[18px] font-semibold text-wrap'>{userText ? userText : aiText ? aiText : null }</h1>
    </div>
  )
}

export default Home;
