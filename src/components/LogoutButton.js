
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
    >
      Logout
    </button>
  );
}