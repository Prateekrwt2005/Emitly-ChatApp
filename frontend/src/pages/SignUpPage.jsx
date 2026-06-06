import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { MessageCircleIcon, LockIcon, MailIcon, UserIcon, LoaderIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { Link } from "react-router";

function SignUpPage() {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { signup, isSigningUp } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    signup(formData);
  };

  const fields = [
    { id: "fullName", label: "Full Name", type: "text", icon: UserIcon, placeholder: "John Doe", value: formData.fullName, onChange: (v) => setFormData({ ...formData, fullName: v }) },
    { id: "email", label: "Email", type: "email", icon: MailIcon, placeholder: "you@example.com", value: formData.email, onChange: (v) => setFormData({ ...formData, email: v }) },
    { id: "password", label: "Password", type: "password", icon: LockIcon, placeholder: "••••••••", value: formData.password, onChange: (v) => setFormData({ ...formData, password: v }) },
  ];

  return (
    /* NO bg color here — App.jsx owns the background */
    <div className="w-full flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl md:h-[800px] h-[650px]">
        <BorderAnimatedContainer>
          <div className="w-full flex flex-col md:flex-row h-full">

            {/* LEFT — FORM */}
            <div className="md:w-1/2 flex items-center justify-center p-8 md:p-12 md:border-r border-white/[0.06]">
              <div className="w-full max-w-sm">

                <div className="mb-8">
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10">
                      <MessageCircleIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-normal text-white lowercase">Emitly</span>
                  </div>
                  <h2 className="text-[26px] font-semibold tracking-tight text-white/90 leading-tight mb-1.5">
                    Create account
                  </h2>
                  <p className="text-sm text-zinc-500">Join Emitly and start messaging</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {fields.map(({ id, label, type, icon: Icon, placeholder, value, onChange }) => {
                    const isPassword = id === "password";
                    return (
                      <div key={id} className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-zinc-500 tracking-widest uppercase">
                          {label}
                        </label>
                        <div className={`relative flex items-center rounded-xl border transition-all duration-200 bg-white/[0.03] ${
                          focusedField === id
                            ? "border-white/20 shadow-[0_0_0_3px_rgba(255,255,255,0.04)]"
                            : "border-white/[0.07] hover:border-white/[0.14]"
                        }`}>
                          <Icon className="absolute left-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                          <input
                            type={isPassword ? (showPassword ? "text" : "password") : type}
                            value={value}
                            onFocus={() => setFocusedField(id)}
                            onBlur={() => setFocusedField(null)}
                            onChange={(e) => onChange(e.target.value)}
                            className={`w-full bg-transparent text-base md:text-sm text-white/85 placeholder:text-zinc-700 pl-10 py-3 outline-none rounded-xl ${
                              isPassword ? "pr-12" : "pr-4"
                            }`}
                            placeholder={placeholder}
                          />
                          {isPassword && (
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 text-zinc-500 hover:text-white transition-colors"
                            >
                              {showPassword ? (
                                <EyeOffIcon className="w-4 h-4" />
                              ) : (
                                <EyeIcon className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="submit"
                    disabled={isSigningUp}
                    className="w-full mt-1 rounded-xl py-3 text-sm font-semibold text-black bg-white hover:bg-zinc-200 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_28px_rgba(255,255,255,0.05)]"
                  >
                    {isSigningUp ? (
                      <LoaderIcon className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>

                <p className="mt-5 text-center text-sm text-zinc-500">
                  Already have an account?{" "}
                  <Link to="/login" className="text-white hover:text-zinc-300 font-medium transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* RIGHT — ILLUSTRATION */}
            <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-bl from-white/[0.02] via-transparent to-white/[0.01]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-white/[0.02] rounded-full blur-[70px]" />

              <div className="relative z-10 flex flex-col items-center text-center max-w-xs">
                <img
                  src="/signup.png"
                  alt="People connecting"
                  className="w-full max-w-[260px] h-auto object-contain drop-shadow-2xl mb-8 filter grayscale opacity-90"
                />
                <h3 className="text-lg font-semibold text-white/75 mb-2 tracking-tight">
                  Start your journey today
                </h3>
                <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                  Set up in seconds. Message friends, family, and teams — all in one place.
                </p>
                <div className="flex items-center gap-2">
                  {["Free", "Easy Setup", "Private"].map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-zinc-400">
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

export default SignUpPage;