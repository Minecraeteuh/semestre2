import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userSignIn } from "../api/auth"; 
import { toast } from "react-toastify"; 

export default function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onFieldChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const onFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = await userSignIn(credentials.email, credentials.password);
      
      // ✅ On utilise "token" pour être raccord avec ton api.js
      console.log("Réponse de Strapi :", data);
      localStorage.setItem("token", data.jwt); 
      localStorage.setItem("userData", JSON.stringify(data.user));

      toast.success("Bon retour parmi nous !");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Identifiants incorrects...");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={onFormSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">SupTaskFlow</h2>
        <input 
          name="email" 
          type="email" 
          placeholder="Votre email" 
          onChange={onFieldChange} 
          className="w-full p-2 mb-4 border rounded"
          required 
        />
        <input 
          name="password" 
          type="password" 
          placeholder="Mot de passe" 
          onChange={onFieldChange} 
          className="w-full p-2 mb-6 border rounded"
          required 
        />
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
        >
          {isSubmitting ? "Chargement..." : "Accéder à l'espace"}
        </button>
      </form>
    </div>
  );
}