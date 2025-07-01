'use client';
import Cookies from "js-cookie";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Footer from "../components/footer";
import { Globe, Eye, EyeOff, Loader2 } from "lucide-react"
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from '@react-oauth/google';
import { debounce } from 'lodash';

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  payment_type: "",
  payment_details: "",
  paid_tier: "paid",
  rememberMe: false
};

export default function LoginPage() {
  const [formData, setFormData] = useState(initialForm);
  const [isSignup, setIsSignup] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const emailRef = useRef(null);
  const router = useRouter();

  // Auto-focus on email input on mount
  useEffect(() => {
    emailRef.current?.focus();
    
    // Check for remembered email
    const rememberedEmail = Cookies.get("rememberedEmail");
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail, rememberMe: true }));
    }
  }, []);

  // Debounced email validation
  const validateEmail = debounce((email) => {
    if (!email) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
    } else {
      setErrors(prev => ({ ...prev, email: "" }));
    }
  }, 500);

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: fieldValue }));
    setErrors(prev => ({ ...prev, [name]: "" }));
    
    // Special field handling
    if (name === 'email') {
      validateEmail(value);
    }
    
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    if (name === 'name' && isSignup) {
      // Auto-capitalize first letter of each word in name
      if (value && value !== formData.name) {
        const capitalized = value.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        setFormData(prev => ({ ...prev, name: capitalized }));
      }
    }
    
    if (name === 'phone' && isSignup) {
      // Auto-format phone number
      const cleaned = value.replace(/\D/g, '');
      const formatted = cleaned.slice(0, 10);
      setFormData(prev => ({ ...prev, phone: formatted }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Password validation
    if (!isForgot && !formData.password) {
      newErrors.password = "Password is required";
    } else if (!isForgot && isSignup && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    // Signup specific validations
    if (isSignup) {
      if (!formData.name) newErrors.name = "Name is required";
      if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Valid 10-digit phone number required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/${isForgot ? 'forgot-password' : isSignup ? 'signup' : 'login'}`;
      const body = isForgot
        ? { email: formData.email }
        : isSignup
          ? { ...formData }
          : { email: formData.email, password: formData.password };

      const res = await axios.post(url, body);
      
      if (!isForgot) {
        // Set cookie expiration based on remember me
        const expires = formData.rememberMe ? 30 : 7; // 30 days if remember me is checked
        
        Cookies.set("token", res.data.access_token, { expires });
        Cookies.set("userInfo", JSON.stringify(res.data), { expires });
        
        // Store email if remember me is checked
        if (formData.rememberMe) {
          Cookies.set("rememberedEmail", formData.email, { expires: 30 });
        } else {
          Cookies.remove("rememberedEmail");
        }
        
        toast.success(`${isSignup ? "Registered" : "Logged in"} successfully! Redirecting...`, {
          duration: 2000
        });
        
        setTimeout(() => {
          router.push(`${isSignup ? "/login" : "/main"}`);
        }, 1500);
      } else {
        toast.success("Password reset link has been sent to your email", {
          duration: 4000
        });
        setIsForgot(false);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Something went wrong";
      toast.error(errorMessage, {
        duration: 3000
      });
      
      // Handle specific errors
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuthentication = useGoogleLogin({
    onSuccess: async (googleResponse) => {
      setIsLoading(true);
      try {
        const { access_token } = googleResponse;
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
          token: access_token,
        });

        const { access_token: appToken, user } = res.data;
        Cookies.set("token", appToken, { expires: 7 });
        Cookies.set("userInfo", JSON.stringify(user), { expires: 7 });

        toast.success("Logged in successfully with Google! Redirecting...", {
          duration: 2000
        });
        
        setTimeout(() => {
          router.push("/main");
        }, 1500);
      } catch (error) {
        console.error("Google login failed:", error);
        toast.error(error.response?.data?.message || "Google login failed. Please try again.", {
          duration: 3000
        });
      } finally {
        setIsLoading(false);
      }
    },
    onError: (err) => {
      console.error("Google login error:", err);
      toast.error("Google login was cancelled or failed. Please try again.", {
        duration: 3000
      });
    },
  });

  // Password strength indicator colors
  const getStrengthColor = (strength) => {
    switch (strength) {
      case 1: return "bg-red-500";
      case 2: return "bg-yellow-500";
      case 3: return "bg-blue-500";
      case 4: return "bg-green-500";
      default: return "bg-gray-200";
    }
  };

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
            className="cursor-pointer p-2 flex items-center border border-zinc-200 w-full rounded-[7px] gap-3 mt-8 hover:bg-gray-50 transition-colors"
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

          {/* Divider */}
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Inputs */}
          <div className="space-y-3 mt-4">
            {isSignup && (
              <div>
                <input 
                  name="name" 
                  onChange={handleChange} 
                  value={formData.name} 
                  placeholder="Full Name" 
                  className="input w-full border border-gray-300 p-2 rounded placeholder:text-gray-400 text-black"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <input
                name="email"
                onChange={handleChange}
                value={formData.email}
                placeholder="Email Address"
                className="input placeholder:text-gray-400 w-full border border-gray-300 p-2 rounded text-black"
                ref={emailRef}
                type="email"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {!isForgot && (
              <div>
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
                
                {/* Password strength indicator */}
                {isSignup && formData.password && (
                  <div className="mt-1">
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div 
                          key={i}
                          className={`h-full w-full rounded-full ${i <= passwordStrength ? getStrengthColor(passwordStrength) : 'bg-gray-200'}`}
                        ></div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {passwordStrength === 0 ? '' :
                       passwordStrength === 1 ? 'Weak' :
                       passwordStrength === 2 ? 'Fair' :
                       passwordStrength === 3 ? 'Good' : 'Strong'}
                    </p>
                  </div>
                )}
                
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
            )}

            {isSignup && (
              <>
                <div>
                  <input 
                    name="phone" 
                    onChange={handleChange} 
                    value={formData.phone} 
                    placeholder="Phone Number" 
                    className="input w-full border border-gray-300 p-2 rounded placeholder:text-gray-400 text-black"
                    type="tel"
                    maxLength="10"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                
                <div>
                  <input 
                    name="payment_type" 
                    onChange={handleChange} 
                    value={formData.payment_type} 
                    placeholder="Payment Type (e.g., Credit Card, PayPal)" 
                    className="input w-full border border-gray-300 p-2 rounded placeholder:text-gray-400 text-black"
                  />
                </div>
                
                <div>
                  <input 
                    name="payment_details" 
                    onChange={handleChange} 
                    value={formData.payment_details} 
                    placeholder="Payment Details" 
                    className="input w-full border border-gray-300 p-2 rounded placeholder:text-gray-400 text-black"
                  />
                </div>
              </>
            )}
          </div>

          {/* Remember me checkbox (only for login) */}
          {!isSignup && !isForgot && (
            <div className="flex items-center mt-3">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full mt-5 bg-blue-600 text-white p-2 rounded flex items-center justify-center ${isLoading ? 'opacity-75' : 'hover:bg-blue-700'}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                {isForgot ? "Sending..." : isSignup ? "Signing Up..." : "Logging In..."}
              </>
            ) : (
              isForgot ? "Send Reset Link" : isSignup ? "Sign Up" : "Login"
            )}
          </button>

          <div className="flex justify-between mt-4 text-sm text-blue-600 cursor-pointer">
            <span 
              onClick={() => {
                setIsForgot(false);
                setIsSignup(prev => !prev);
                setErrors({});
              }}
              className="hover:underline"
            >
              {isSignup ? "Already have an account? Login" : "Don't have an account? Sign up"}
            </span>

            {!isSignup && (
              <span 
                onClick={() => {
                  setIsForgot(true);
                  setIsSignup(false);
                  setErrors({});
                }}
                className="hover:underline"
              >
                Forgot Password?
              </span>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}