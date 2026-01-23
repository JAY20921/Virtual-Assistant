import React, {useContext, useState} from 'react'
import { UserDataContext } from '../context/UserContext';
import axios from 'axios';
import { MdKeyboardBackspace } from 'react-icons/md';
import { useNavigate } from "react-router-dom";
function Customize2() {
  const {userData, setUserData, serverUrl, backendImage, selectedImage} = useContext(UserDataContext);
  const [assistantName, setAssistantName] = useState(userData?.assistantName || '');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleUpdateAssistant = async () => {
    try {
          setLoading(true);
      let formData = new FormData();
      formData.append('assistantName', assistantName);
      if(backendImage){
        formData.append('assistantImage', backendImage);
      } else{
        formData.append('imageUrl', selectedImage);
      }
      const result  = await axios.post(`${serverUrl}/api/user/update`,formData, {withCredentials:true})
      console.log("Assistant updated:", result.data);
      setUserData(result.data.user);
      navigate("/");
    } catch (error) {
        setLoading(false);
      console.error("Error updating assistant:", error);
    }
  }
  return (

    <div className='w-full h-[100vh] bg-gradient-to-t from-black to-[#030353] flex justify-center items-center flex-col p-[20px] relative'>
    <MdKeyboardBackspace className='absolute top-[30px] left-[30px] w-[25px] h-[25px] text-white text-[30px] mb-4 cursor-pointer' onClick={() => { navigate("/customize") }} />
    <h1 className="text-white text-[30px] font-semibold mb-[30px]">
        Enter your <span className="text-[#00ffff]">Assistant Name</span>
      </h1>    
      <input
          type="text"
          placeholder='eg. Sora'
          className='w-full max-w-[600px] h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] rounded-full text-[18px]'
          required
          onChange={(e)=>setAssistantName(e.target.value)}
          value={assistantName}
        />
        {assistantName &&
<button className="min-w-[150px] h-[60px] bg-white text-black font-semibold text-[18px] rounded-full mt-4" disabled={loading} onClick={() => { handleUpdateAssistant(); }}>
        {loading ? "Updating..." : "Continue"}
      </button>
}

      </div>
  )
}

export default Customize2
