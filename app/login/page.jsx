'use client';

import { useState, useEffect } from "react";
import axios from "axios";
import Footer from "../components/footer";
import { Globe, Eye, EyeOff } from "lucide-react"
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from '@react-oauth/google';
const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  payment_type: "",
  payment_details: "",
};

export default function LoginPage() {
  const [formData, setFormData] = useState(initialForm);
  const [isSignup, setIsSignup] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    if (!isForgot && !formData.password) newErrors.password = "Password required";
    if (isSignup && !formData.name) newErrors.name = "Name is required";
    if (isSignup && !/^\d{10}$/.test(formData.phone)) newErrors.phone = "Valid phone required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/${isForgot ? 'forgot-password' : isSignup ? 'signup' : 'login'}`;
      const body = isForgot
        ? { email: formData.email }
        : isSignup
          ? { ...formData }
          : { email: formData.email, password: formData.password };

      const res = await axios.post(url, body);
      if (!isForgot) {
        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("userInfo", JSON.stringify(res.data));
        toast.success(`${isSignup ? "Registered" : "Logged in"} successfully`);
        router.push("/main");
      } else {
        toast.success("Reset link sent to email");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };
  const handleGoogleAuthentication = useGoogleLogin({
    onSuccess: async (googleResponse) => {
      try {
        // Extract Google access token
        const { access_token } = googleResponse;

        // Send Google token to your backend for login/signup
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/google-login`, {
          token: access_token,
        });

        // Backend returns your app's access token and user info
        const { access_token: appToken, user } = res.data;

        // Save token and user info in localStorage
        localStorage.setItem("token", appToken);
        localStorage.setItem("userInfo", JSON.stringify(user));

        toast.success("Logged in successfully");
        router.push("/main");
      } catch (error) {
        console.error("Google login failed:", error);
        toast.error(error.response?.data?.message || "Google login failed");
      }
    },
    onError: (err) => {
      console.error("Google login error:", err);
      toast.error("Google login failed");
    },
  });


  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 🌐 Top Navbar */}
      <header className="w-full flex items-center justify-between px-6 py-4 bg-white shadow-sm mb-10">
        <div className="flex items-center gap-2">
          <img src="/icons/logo.png" alt="Logo" className="h-6 w-6" />
          <span className="text-lg font-semibold text-black">MeSeer</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-700 cursor-pointer">
          <Globe className="w-4 h-4" />
          <span>English</span>
        </div>
      </header>

      {/* 👤 Main Auth Form */}
      <main className="flex-grow flex flex-col items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-extrabold text-center text-black">Plan it. Note it.</h2>
          <p className="text-lg text-center text-gray-500 mb-4">
            {isForgot ? "Forgot Password" : isSignup ? "Sign Up" : "Log in to your MeSeer"}
          </p>

          {/* Google Auth Button */}
          <div
            onClick={handleGoogleAuthentication}
            className="cursor-pointer p-2 flex items-center border border-zinc-200 w-full rounded-[7px] gap-3 mt-8"
          >
            <img
              src="/icons/google.png"
              alt="Google logo"
              width={16}
              height={16}
            />
            <span className="text-[14px] sm:ml-20 ml-5 font-medium text-black">
              Continue with Google
            </span>
          </div>

          {/* Inputs */}
          <div className="space-y-3 mt-4">
            <input
              name="email"
              onChange={handleChange}
              value={formData.email}
              placeholder="Enter Your Email"
              className="input placeholder:text-gray-400 w-full border border-gray-300 p-2 rounded"
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}

            {!isForgot && (
              <>
                <div className="relative w-full">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    onChange={handleChange}
                    value={formData.password}
                    placeholder="Password"
                    className="input placeholder:text-gray-400 text-black w-full border border-gray-300 p-2 rounded pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
              </>
            )}
            {isSignup && (
              <>
                <input name="name" onChange={handleChange} value={formData.name} placeholder="Name" className="input w-full border border-gray-300 p-2 rounded placeholder:text-gray-400" />
                <input name="phone" onChange={handleChange} value={formData.phone} placeholder="Phone" className="input w-full border border-gray-300 p-2 rounded placeholder:text-gray-400" />
                <input name="payment_type" onChange={handleChange} value={formData.payment_type} placeholder="Payment Type" className="input w-full border border-gray-300 p-2 rounded placeholder:text-gray-400" />
                <input name="payment_details" onChange={handleChange} value={formData.payment_details} placeholder="Payment Details" className="input w-full border border-gray-300 p-2 rounded placeholder:text-gray-400" />
              </>
            )}
          </div>

          <button
            onClick={handleSubmit}
            className="w-full mt-5 bg-blue-600 text-white p-2 rounded"
          >
            {isForgot ? "Send Reset Link" : isSignup ? "Sign Up" : "Login"}
          </button>

          <div className="flex justify-between mt-4 text-sm text-blue-600 cursor-pointer">
            <span onClick={() => {
              setIsForgot(false);
              setIsSignup(prev => !prev);
            }}>
              {isSignup ? "Already have an account? Login" : "Don't have an account? Sign up"}
            </span>

            {!isSignup && (
              <span onClick={() => {
                setIsForgot(true);
                setIsSignup(false);
              }}>Forgot Password?</span>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );

}
