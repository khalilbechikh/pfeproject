import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, RefreshCw, AlertCircle } from "lucide-react";

interface Particle {
    size: number;
    x: number;
    y: number;
    speedX: number;
    speedY: number;
}

interface Verify2FAProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void; // Or just darkMode if no toggle here
}

export default function Verify2FA({ darkMode }: Verify2FAProps) { // Assuming setDarkMode is not used here
    const [token, setToken] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [particles, setParticles] = useState<Particle[]>(Array(15).fill(null).map(() => ({
        size: Math.random() * 4 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3
    })));
    const navigate = useNavigate();

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
        setLoading(true);
        setError("");

        try {
            const authToken = localStorage.getItem("authToken");
            const response = await fetch("http://localhost:5000/v1/api/2fa/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ token })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Verification failed");

            if (data.token) {
                localStorage.setItem("authToken", data.token);
            }

            navigate("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}> {/* Applied darkMode prop */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent">
                    {particles.map((particle, idx) => (
                        <div
                            key={idx}
                            style={{
                                position: 'absolute',
                                left: `${particle.x}%`,
                                top: `${particle.y}%`,
                                width: `${particle.size}px`,
                                height: `${particle.size}px`,
                                borderRadius: '50%',
                                backgroundColor: darkMode // Use darkMode prop
                                    ? `rgba(139, 92, 246, ${0.2 * (particle.size / 5)})`
                                    : `rgba(6, 182, 212, ${0.2 * (particle.size / 5)})`,
                                transition: 'background-color 0.5s ease'
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className={`w-full max-w-md p-8 space-y-8 backdrop-blur-sm border rounded-xl shadow-xl 
                ${darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white/90 border-gray-200'}`}> {/* Applied darkMode prop */}
                <div className="text-center space-y-2">
                    <Shield className={`mx-auto h-12 w-12 ${darkMode ? 'text-violet-500' : 'text-cyan-600'}`} /> {/* Applied darkMode prop */}
                    <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}> {/* Applied darkMode prop */}
                        Two-Factor Verification
                    </h1>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}> {/* Applied darkMode prop */}
                        Enter the 6-digit code from your authenticator app
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="123456"
                            className={`w-full px-4 py-3 text-center text-xl font-mono rounded-lg border 
                                ${darkMode ? 'border-gray-600 bg-gray-700 text-white focus:border-violet-500' : 
                                'border-gray-300 bg-white text-gray-900 focus:border-cyan-500'} focus:outline-none`} // Applied darkMode prop
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/30 border-red-800 text-red-400' : 
                            'bg-red-100 border-red-200 text-red-800'} border`}> {/* Applied darkMode prop */}
                            <div className="flex items-center justify-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || token.length !== 6}
                        className={`w-full py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2
                            ${darkMode ? 'bg-violet-600 hover:bg-violet-500 hover:shadow-violet-500/30' : 
                            'bg-cyan-600 hover:bg-cyan-500 hover:shadow-cyan-500/30'} text-white
                            disabled:opacity-50 disabled:cursor-not-allowed`} // Applied darkMode prop
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="animate-spin" size={20} />
                                Verifying...
                            </>
                        ) : (
                            <>
                                <Shield size={20} />
                                Verify Code
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}