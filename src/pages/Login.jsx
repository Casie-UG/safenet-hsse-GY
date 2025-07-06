import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AuthPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin]   = useState(true);
  const [error, setError]       = useState(null);
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const { data, error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      return;
    }

    const session = data.session || (await supabase.auth.getSession()).data.session;
    const user    = session?.user;

    if (!user) {
      setError("Account created — check your e‑mail for confirmation.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") navigate("/admin");
    else navigate("/user");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-gray-100 to-gray-200 px-4 py-8">
      {/* Top Spacer */}
      <div className="mt-0" />

      {/* Auth Card */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-10 mt-0">
        <h1 className="text-3xl font-semibold text-center text-blue-700 mb-8">
          {isLogin ? "Log In" : "Create an Account"} to SafeNet
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-md"
          >
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-semibold ml-2 hover:underline"
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>

      {/* Footer */}
      <footer className="text-center mt-10 text-sm text-gray-600">
        <p className="mb-1">Safenet HSSE Reporting Platform v1.0</p>
        <p>
          For support, contact{" "}
          <a
            href="mailto:developer@example.com"
            className="text-blue-600 hover:underline"
          >
            developer@example.com
          </a>
        </p>
        <p className="mt-2">© {new Date().getFullYear()} Safenet. All rights reserved.</p>
      </footer>
    </div>
  );
}
