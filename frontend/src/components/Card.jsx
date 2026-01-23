import React, { useContext } from 'react'
import { UserDataContext } from '../context/UserContext';

function Card({image}) {
  const {serverUrl, userData, setUserData,backendImage, setBackendImage,frontendImage, setFrontendImage ,selectedImage,setSelectedImage} = useContext(UserDataContext);

  return (
    <div className={`w-[150px] h-[250px] 
      bg-[#03026] border-2 border-[#0000ff70]
       rounded-2xl overflow-hidden shadow-lg
        shadow-blue-950 cursor-pointer hover:scale-105
         transition-all duration-300 hover:border-4
          hover:border-[#ffffffb0]
           ${selectedImage== image?"border-4 border-white":"" }`} 
           onClick={() => {
            setSelectedImage(image);
              setBackendImage(null);
              setFrontendImage(null);
            }
    }>
      <img src={image} alt="" className='h-full object-cover' />
    </div>
  )
}

export default Card
