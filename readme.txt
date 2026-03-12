SupTaskFlow - Gestionnaire de Projets Kanban

Procédure d'Installation

Backend (Strapi)

Aller dans le dossier /backend

Installer les dépendances : npm install

Lancer le serveur : npm run develop

Important : Restaurer les données ou configurer les permissions find, create, update et delete pour le rôle Authenticated sur toutes les collections.

Frontend (React)

Aller dans le dossier /frontend

Installer les dépendances : npm install

Configurer le fichier .env avec VITE_API_URL=http://localhost:1337/api

Lancer l'application : npm run dev

Choix Techniques

Bibliothèque dnd-kit : Remplacement du Drag & Drop HTML5 natif par dnd-kit, comme explicitement recommandé dans les consignes. Cela garantit une meilleure robustesse, une compatibilité accrue et une fluidité optimale sans enfreindre la règle d'interdiction des librairies tout-en-un.

Strapi 5 : Utilisation du système de documentId pour une gestion robuste des requêtes et mises à jour API.

CSS Standard : Fichiers CSS classiques pour assurer une architecture visuelle cohérente et maintenable sans recourir à des bibliothèques UI externes.

Guide Utilisateur

Création : Utilisez le bouton + Nouveau projet sur le tableau de bord.

Organisation : Créez des listes (colonnes), puis ajoutez des cartes à l'intérieur.

Interaction : Glissez et déposez les cartes entre les colonnes ou réorganisez l'ordre des colonnes directement à la souris.

Édition : Cliquez sur une carte pour ouvrir la fenêtre d'édition et modifier sa description, sa date d'échéance ou son étiquette couleur.