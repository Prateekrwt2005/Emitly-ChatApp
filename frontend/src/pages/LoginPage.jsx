import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import {
  MessageCircleIcon,
  MailIcon,
  LoaderIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { Link } from "react-router";

function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="w-full flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl md:h-[760px] h-auto min-h-[650px]">
        <BorderAnimatedContainer>
          <div className="w-full flex flex-col md:flex-row h-full">
            
            {/* LEFT SIDE */}
            <div className="md:w-1/2 flex items-center justify-center p-8 md:p-12 md:border-r border-white/5">
              <div className="w-full max-w-sm">
                
                <div className="mb-10">
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10">
                      <MessageCircleIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-normal text-white lowercase">Emitly</span>
                  </div>

                  <h2 className="text-3xl font-semibold text-white tracking-tight mb-2">
                    Welcome back
                  </h2>

                  <p className="text-sm text-zinc-500">
                    Sign in to continue to Emitly
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Email */}
                  <div>
                    <label className="block mb-2 text-xs uppercase tracking-wider text-zinc-500 font-medium">
                      Email
                    </label>

                    <div
                      className={`relative rounded-xl border bg-white/[0.03] transition-all ${
                        focusedField === "email"
                          ? "border-white/20 shadow-[0_0_0_3px_rgba(255,255,255,0.04)]"
                          : "border-white/10 hover:border-white/15"
                      }`}
                    >
                      <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />

                      <input
                        type="email"
                        value={formData.email}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            email: e.target.value,
                          })
                        }
                        placeholder="you@example.com"
                        className="w-full bg-transparent py-3 pl-11 pr-4 text-base md:text-sm text-white placeholder:text-zinc-600 outline-none"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block mb-2 text-xs uppercase tracking-wider text-zinc-500 font-medium">
                      Password
                    </label>

                    <div
                      className={`relative rounded-xl border bg-white/[0.03] transition-all ${
                        focusedField === "password"
                          ? "border-white/20 shadow-[0_0_0_3px_rgba(255,255,255,0.04)]"
                          : "border-white/10 hover:border-white/15"
                      }`}
                    >
                      <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />

                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            password: e.target.value,
                          })
                        }
                        placeholder="••••••••"
                        className="w-full bg-transparent py-3 pl-11 pr-12 text-base md:text-sm text-white placeholder:text-zinc-600 outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <EyeOffIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Button */}
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="
                    w-full
                    rounded-xl
                    py-3
                    mt-2
                    bg-white
                    text-black
                    font-medium
                    hover:bg-zinc-200
                    transition-all
                    active:scale-[0.98]
                    disabled:opacity-50
                    "
                  >
                    {isLoggingIn ? (
                      <LoaderIcon className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-zinc-500">
                  No account?{" "}
                  <Link
                    to="/signup"
                    className="text-white hover:text-zinc-300 transition-colors"
                  >
                    Create one
                  </Link>
                </p>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="hidden md:flex md:w-1/2 items-center justify-center p-12 relative overflow-hidden">
              
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.01]" />

              <div className="absolute w-80 h-80 rounded-full bg-white/[0.03] blur-[120px]" />

              <div className="relative z-10 text-center max-w-sm">
                <img
                  src="/login.png"
                  alt="login"
                  className="w-full max-w-[260px] mx-auto mb-8 filter grayscale opacity-90 drop-shadow-2xl"
                />

                <h3 className="text-xl font-semibold text-white mb-3">
                  Connect anytime, anywhere
                </h3>

                <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                  Real-time messaging with privacy, speed and simplicity.
                </p>

                <div className="flex justify-center gap-2 flex-wrap">
                  {["Free", "Secure", "Fast"].map((tag) => (
                    <span
                      key={tag}
                      className="
                      px-3
                      py-1
                      rounded-full
                      text-xs
                      bg-white/5
                      border
                      border-white/10
                      text-zinc-400
                      "
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
}

export default LoginPage;