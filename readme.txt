    SupTaskFlow - Gestionnaire de Projets Kanban

Application de gestion de tâches, développée avec React pour le frontend et Strapi pour le backend.

    1. Modélisation des Données (Schéma)
L'architecture de la base de données suit une imbrication logique :
- User : Propriétaire des tableaux.
- Board : Contient plusieurs Listes.
- List : Appartient à un Board et contient plusieurs Cartes.
- Card : L'unité de tâche (Titre, Description, Deadline, Order, Label).

    2. Procédure d'installation

    Backend (Strapi)
1. Aller dans le dossier `/backend`.
2. Installer les dépendances : `npm install`.
3. Lancer le serveur : `npm run develop`.
4. Important : Restaurer les données ou configurer les permissions `find`, `create`, `update` et `delete` pour le rôle `Authenticated` sur toutes les collections.

### Frontend (React)
1. Aller dans le dossier `/frontend`.
2. Installer les dépendances : `npm install`.
3. Configurer le fichier `.env` avec `VITE_API_URL=http://localhost:1337/api`.
4. Lancer l'application : `npm run dev`.

## 3. Choix Techniques
- **Drag & Drop Natif (HTML5)** : Choisi pour sa légèreté et sa fluidité sans dépendances lourdes.
- **Strapi 5** : Utilisation du système de `documentId` pour une gestion robuste des mises à jour API.
- **CSS-in-JS** : Pour un design "Brutaliste/Cyberpunk" cohérent et une maintenance facilitée.

## 4. Guide Utilisateur
- **Création** : Utilisez le bouton `[+] NEW_PROJECT` sur le dashboard.
- **Organisation** : Créez des colonnes, puis des cartes.
- **Interaction** : Glissez-déposez les cartes entre les colonnes pour changer leur état.
- **Édition** : Cliquez sur une carte pour ouvrir le terminal d'édition (Description, Date, Label).
Application de gestion de tâches type Trello, développée avec **React** (Vite) pour le frontend et **Strapi 5** pour le backend.

## 1. Modélisation des Données (Schéma)
L'architecture de la base de données suit une imbrication logique :
- **User** : Propriétaire des tableaux.
- **Board** : Contient plusieurs Listes.
- **List** : Appartient à un Board et contient plusieurs Cartes.
- **Card** : L'unité de tâche (Titre, Description, Deadline, Order, Label).

## 2. Procédure d'Installation

### Backend (Strapi)
1. Aller dans le dossier `/backend`.
2. Installer les dépendances : `npm install`.
3. Lancer le serveur : `npm run develop`.
4. **Important** : Restaurer les données ou configurer les permissions `find`, `create`, `update` et `delete` pour le rôle `Authenticated` sur toutes les collections.

### Frontend (React)
1. Aller dans le dossier `/frontend`.
2. Installer les dépendances : `npm install`.
3. Configurer le fichier `.env` avec `VITE_API_URL=http://localhost:1337/api`.
4. Lancer l'application : `npm run dev`.

## 3. Choix Techniques
- **Drag & Drop Natif (HTML5)** : Choisi pour sa légèreté et sa fluidité sans dépendances lourdes.
- **Strapi 5** : Utilisation du système de `documentId` pour une gestion robuste des mises à jour API.
- **CSS-in-JS** : Pour un design "Brutaliste/Cyberpunk" cohérent et une maintenance facilitée.

## 4. Guide Utilisateur
- **Création** : Utilisez le bouton `[+] NEW_PROJECT` sur le dashboard.
- **Organisation** : Créez des colonnes, puis des cartes.
- **Interaction** : Glissez-déposez les cartes entre les colonnes pour changer leur état.
- **Édition** : Cliquez sur une carte pour ouvrir le terminal d'édition (Description, Date, Label).