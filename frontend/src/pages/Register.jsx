import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createNewUser } from "../api/auth"; // On utilise la fonction personalisé
import { toast } from "react-toastify";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const updateField = (e) => {
    setUserForm({
      ...userForm,
      [e.target.name]: e.target.value,
    });
  };

  const onFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Appel à ton service API
      const data = await createNewUser(
        userForm.username,
        userForm.email,
        userForm.password
      );

      // Stockage sécurisé (Persistance 5 pts)
      localStorage.setItem("authToken", data.jwt);
      localStorage.setItem("userData", JSON.stringify(data.user));

      toast.success("Compte créé avec succès !");
      navigate("/login"); 
    } catch (err) {
      const message = err.response?.data?.error?.message || "Erreur lors de l'inscription";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f4f4' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ textAlign: 'center', color: '#333' }}>Rejoindre SupTaskFlow</h1>
        
        <form onSubmit={onFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            name="username"
            type="text"
            placeholder="Nom d'utilisateur"
            value={userForm.username}
            onChange={updateField}
            required
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={userForm.email}
            onChange={updateField}
            required
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <input
            name="password"
            type="password"
            placeholder="Mot de passe (min. 6 caractères)"
            value={userForm.password}
            onChange={updateField}
            required
            minLength="6"
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {loading ? "Création..." : "S'inscrire gratuitement"}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Déjà un compte ? <Link to="/login" style={{ color: '#007bff' }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}