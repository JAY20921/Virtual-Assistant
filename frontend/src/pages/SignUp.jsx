import React, { useState, useContext } from 'react'
import bg from '../assets/background.jpg'
import { LuEye } from "react-icons/lu";
import { FaRegEyeSlash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { UserDataContext } from '../context/UserContext.jsx';
import axios from 'axios';

function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setError] = useState("");
  const { serverUrl , userData, setUserData } = useContext(UserDataContext);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
     setError("");
     setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signup`,
        { name, email, password },
        { withCredentials: true }
      );
      setUserData(result.data);

      setLoading(false);
    } catch (error) {
      setUserData(null);

      console.log("Error during sign up:", error);
      setError(error.response?.data?.message || "An error occurred during sign up.");
           setLoading(false);

    }
  };

  return (
    <div
      className='w-full h-[100vh] bg-cover flex justify-center items-center'
      style={{ backgroundImage: `url(${bg})` }}
    >
      <form
        className='w-[90%] h-[600px] max-w-[500px] bg-[#00000098] backdrop-blur-md shadow-lg shadow-black flex flex-col items-center justify-center gap-[20px] px-[20px]'
        onSubmit={handleSignUp}
      >

        <h1 className='text-white text-[30px] font-semibold mb-[30px]'>
          Register to use <span className='text-blue-400'>Virtual Assistant</span>
        </h1>

        <input
          type="text"
          placeholder='Enter Your Name'
          className='w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] rounded-full text-[18px]'
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder='Enter Your Email'
          className='w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] rounded-full text-[18px]'
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className='w-full h-[60px] border-2 border-white rounded-full relative'>
          <input
            type={showPassword ? "text" : "password"}
            placeholder='Password'
            className='w-full h-full outline-none bg-transparent text-white placeholder-gray-300 px-[20px]'
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {!showPassword && (
            <LuEye
              className='absolute top-[18px] right-[20px] text-white cursor-pointer'
              onClick={() => setShowPassword(true)}
            />
          )}

          {showPassword && (
            <FaRegEyeSlash
              className='absolute top-[18px] right-[20px] text-white cursor-pointer'
              onClick={() => setShowPassword(false)}
            />
          )}
        </div>
          {err && <p className='text-red-500'>*{err}</p>}
        <button className='min-w-[150px] h-[60px] bg-white text-black font-semibold text-[18px] rounded-full' disabled={loading}>
          {loading ? "Signing Up..." : "Sign Up"}
        </button>

        <p className='text-white cursor-pointer' onClick={() => navigate("/signin")}>
          Already have an account?
          <span className='text-blue-400'> Sign In</span>
        </p>

      </form>
    </div>
  );
}

export default SignUp;
