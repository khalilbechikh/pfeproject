import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LockIcon, MailIcon, EyeIcon, EyeOffIcon, ArrowLeftIcon, CheckCircleIcon } from "lucide-react";
import { z } from "zod";

const ResetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password cannot exceed 64 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [particles, setParticles] = useState(Array(15).fill(null).map(() => ({
    size: Math.random() * 4 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    speedX: (Math.random() - 0.5) * 0.3,
    speedY: (Math.random() - 0.5) * 0.3
  })));

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(particles =>
        particles.map(particle => ({
          ...particle,
          x: ((particle.x + particle.speedX + 100) % 100),
          y: ((particle.y + particle.speedY + 100) % 100)
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (token) {
        // Handle password reset with token
        const validation = ResetPasswordSchema.safeParse({
          email,
          newPassword,
          confirmPassword
        });

        if (!validation.success) {
          const errors = validation.error.errors.map(e => e.message).join(", ");
          throw new Error(errors);
        }

        const response = await fetch("http://localhost:5000/v1/api/set-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            newPassword,
            confirmNewPassword: confirmPassword,
            token
          })
        });

        const data = await response.json();

        if (data.status !== "success") {
          throw new Error(data.message || "Password reset failed");
        }

        setSuccess("Password updated successfully! Redirecting to login...");
        setTimeout(() => navigate("/"), 2000);
      } else {
        // Handle password reset request
        const response = await fetch("http://localhost:5000/v1/api/request-password-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.status !== "success") {
          throw new Error(data.message || "Failed to send reset email");
        }

        setSuccess("If an account exists with this email, a reset link has been sent.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen w-full flex-col items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} px-4 py-12 overflow-hidden relative`}>
      {particles.map((particle, index) => (
        <div
          key={index}
          className={`absolute rounded-full ${darkMode ? 'bg-violet-500/20' : 'bg-cyan-500/20'} blur-sm`}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            transition: 'left 1s linear, top 1s linear'
          }}
        />
      ))}

      <div className={`relative w-full max-w-md overflow-hidden rounded-xl ${darkMode ? 'bg-gray-800/60 shadow-xl shadow-violet-900/10' : 'bg-white/70 shadow-lg shadow-cyan-100'} backdrop-blur-lg p-8 transition-all duration-500 border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
        <button
          onClick={() => navigate("/")}
          className={`mb-6 flex items-center ${darkMode ? 'text-violet-400 hover:text-violet-300' : 'text-cyan-600 hover:text-cyan-700'}`}
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Login
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className={`flex items-center justify-center h-16 w-16 rounded-full ${darkMode ? 'bg-violet-600' : 'bg-cyan-600'} mb-4`}>
            <LockIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-500' : 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-400'}`}>
            {token ? "Set New Password" : "Reset Password"}
          </h1>
        </div>

        {error && (
          <div className={`p-3 mb-4 rounded-lg ${darkMode ? 'bg-red-800/90 text-red-100' : 'bg-red-100 text-red-800'}`}>
            {error}
          </div>
        )}

        {success && (
          <div className={`p-3 mb-4 rounded-lg ${darkMode ? 'bg-emerald-800/90 text-emerald-100' : 'bg-emerald-100 text-emerald-800'}`}>
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              {success}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!token && (
            <div className="space-y-2">
              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MailIcon className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-lg ${darkMode ? 'border-gray-700 bg-gray-800/60 text-white placeholder-gray-500 focus:border-violet-500' : 'border-gray-300 bg-white/60 text-gray-900 placeholder-gray-400 focus:border-cyan-500'} pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 transition-all duration-200`}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
          )}

          {token && (
            <>
              <div className="space-y-2">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <LockIcon className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full rounded-lg ${darkMode ? 'border-gray-700 bg-gray-800/60 text-white placeholder-gray-500 focus:border-violet-500' : 'border-gray-300 bg-white/60 text-gray-900 placeholder-gray-400 focus:border-cyan-500'} pl-10 pr-10 py-2.5 focus:outline-none focus:ring-1 transition-all duration-200`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className={`absolute right-3 top-3 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <LockIcon className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full rounded-lg ${darkMode ? 'border-gray-700 bg-gray-800/60 text-white placeholder-gray-500 focus:border-violet-500' : 'border-gray-300 bg-white/60 text-gray-900 placeholder-gray-400 focus:border-cyan-500'} pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 transition-all duration-200`}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg ${darkMode ? 'bg-violet-600 hover:bg-violet-500' : 'bg-cyan-600 hover:bg-cyan-500'} py-3 font-medium text-white transition-all duration-300 disabled:opacity-70 hover:shadow-lg ${
              darkMode ? 'hover:shadow-violet-500/30' : 'hover:shadow-cyan-500/30'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </div>
            ) : token ? "Reset Password" : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
}
