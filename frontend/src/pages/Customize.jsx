import { RiImageAddLine } from 'react-icons/ri';
import React, { useRef, useContext } from 'react';

import Card from '../components/Card.jsx';
import image1 from '../assets/image1.png';
import image2 from '../assets/image2.jpg';
import image3 from '../assets/authBg.png';
import image4 from '../assets/image4.png';
import image5 from '../assets/image5.png';
import image6 from '../assets/image6.jpeg';
import { MdKeyboardBackspace } from 'react-icons/md';

import {UserDataContext} from '../context/UserContext';
import { Navigate } from 'react-router-dom';
import Customize2 from './Customize2.jsx';
import { useNavigate } from 'react-router-dom';
function Customize() {
  const {
    serverUrl,
    userData,
    setUserData,
    backendImage,
    setBackendImage,
    frontendImage,
    setFrontendImage,
    selectedImage,
    setSelectedImage,
  } = useContext(UserDataContext);
  const navigate = useNavigate();
  const inputImage = useRef(null);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
    setSelectedImage('input');
  };

  return (
    <div className="w-full h-[100vh] bg-gradient-to-t from-black to-[#040473] flex flex-col justify-center items-center">
        <MdKeyboardBackspace className='absolute top-[30px] left-[30px] w-[25px] h-[25px] text-white text-[30px] mb-4 cursor-pointer' onClick={() => {navigate(-1);}} />
     
      <h1 className="text-white text-[30px] font-semibold mb-[30px]">
        Select your <span className="text-[#00ffff]">Assistant</span>
      </h1>

      <div className="w-[90%] max-w-[60%] flex justify-center items-center flex-wrap gap-[20px]">
        <Card image={image1} />
        <Card image={image2} />
        <Card image={image3} />
        <Card image={image4} />
        <Card image={image5} />
        <Card image={image6} />

        <div
          className="w-[150px] h-[250px] bg-[#03026] border-2 border-[#0000ff70] rounded-2xl overflow-hidden shadow-lg shadow-blue-950 cursor-pointer hover:scale-105 transition-all duration-300 hover:border-4 hover:border-[#ffffffb0]"
          onClick={() => {
            inputImage.current.click();
            setSelectedImage('input');
          }}
        >
          {frontendImage ? (
            <img
              src={frontendImage}
              alt="custom"
              className="w-full h-full object-cover"
            />
          ) : (
            <RiImageAddLine className="text-white text-[50px] m-auto mt-[100px]" />
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          ref={inputImage}
          className="hidden"
          onChange={handleImage}
        />
      </div>
          {selectedImage && 
      <button className="min-w-[150px] h-[60px] bg-white text-black font-semibold text-[18px] rounded-full mt-4" onClick={() => navigate('/customize2')}>
        Next
      </button>}
    </div>
  );
}

export default Customize;
