export default function Navbar({ user, onLogout }) {
    return (
        <nav className="dash-nav">
            <div></div>
            <h1 className="dash-logo">SupTaskFlow</h1>
            <div className="dash-user-zone">
                <span className="dash-username">{user?.username}</span>
                <button onClick={onLogout} className="dash-logout-btn">Déconnexion</button>
            </div>
        </nav>
    );
}