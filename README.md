# Télécommande PowerPoint

Réalisé par : **AMINE AMAHAN**

🌐 Site : **[telecommande-ppt.online](https://telecommande-ppt.online)** · ⬇ Téléchargements : [dernière version](https://github.com/profamine/telecommande-ppt/releases/latest)

| Dossier | Contenu |
|---|---|
| `server.js`, `bridge.ps1`, `public/` | Serveur de télécommande, pont PowerShell ↔ PowerPoint, interface mobile web |
| `desktop/`, `build/` | Application Windows (Electron) et installateur |
| `android/` | Application Android (Bluetooth HID + Wi-Fi) |
| `website/` | Site de présentation, déployé sur Vercel |
| `promo/` | Vidéo promotionnelle (Remotion) |

Pilotez une présentation PowerPoint (Windows) depuis un téléphone ou une tablette, via le navigateur — aucune application à installer sur le mobile.

## Fonctionnalités

- Diapo suivante / précédente (gros boutons, balayage sur l'aperçu, flèches du clavier)
- Aperçu de la diapositive en cours, numéro, titre de la suivante
- Notes du présentateur (taille du texte réglable)
- Lancer le diaporama (depuis le début ou la diapo courante), le terminer
- Écran noir / blanc
- Grille des diapositives pour sauter directement à l'une d'elles
- **Pointeur laser** : bouton « ● Laser », puis touchez l'aperçu. Le laser de PowerPoint apparaît au même endroit sur l'écran et suit le doigt.
- Chrono (appui : démarrer/pause, appui long : remise à zéro) et horloge
- Synchronisation : si vous avancez au clavier du PC, le téléphone suit
- Plusieurs appareils en même temps, protégés par un code PIN
- Écran du téléphone maintenu allumé ; ajout possible à l'écran d'accueil

## Installation sur le PC

1. Lancez **`dist/Telecommande-PPT-Setup-1.0.0.exe`** et suivez l'assistant. Windows demande une autorisation administrateur pour installer et ouvrir le pare-feu aux réseaux privés.
   Le fichier n'est pas signé : si Windows affiche « Windows a protégé votre ordinateur », cliquez sur **Informations complémentaires › Exécuter quand même**.
2. Ouvrez **Télécommande PPT** (raccourci sur le bureau ou dans le menu Démarrer).
3. Scannez le grand QR code avec le téléphone ou la tablette, sur le même Wi-Fi que le PC.
4. Ouvrez votre présentation dans PowerPoint et pilotez-la depuis le téléphone.

La fenêtre affiche :
- le QR code, le code PIN et l'adresse ;
- l'état de PowerPoint (présentation, diapositive, en direct) ;
- les appareils connectés ;
- un second QR code pour **installer l'application Android** directement depuis le téléphone.

Fermer la fenêtre laisse la télécommande active dans la zone de notification. Pour l'arrêter, faites un clic droit sur l'icône puis **Quitter**. Le PIN est conservé d'un lancement à l'autre (bouton « Nouveau code PIN » pour le changer), et une option permet de lancer l'application au démarrage de Windows.

Désinstallation : **Paramètres › Applications › Télécommande PPT**. La règle de pare-feu est retirée aussi.

### Pour les développeurs

Il faut [Node.js](https://nodejs.org) 18 ou plus récent.

```bat
npm install
npm start
```

`npm start` ouvre l'application de bureau, `npm run server` lance le serveur seul en console (variables `PORT` et `PIN`), et `npm run dist` reconstruit l'installateur dans `dist/`.

## Application Android (APK) : Bluetooth et Wi-Fi

Le fichier **`Telecommande-PPT.apk`** s'installe sur un téléphone ou une tablette Android 9 ou plus récent. Copiez-le sur l'appareil, ouvrez-le et autorisez l'installation depuis des « sources inconnues ».

### Mode Bluetooth (sans serveur, sans Wi-Fi)

Le téléphone se présente au PC comme un **clavier Bluetooth** et envoie les touches de PowerPoint. Le PC n'a rien à installer.

1. Dans l'app, onglet **Bluetooth** : acceptez les autorisations, puis touchez **Rendre visible**.
2. Sur le PC : **Paramètres › Bluetooth et appareils › Ajouter un appareil › Bluetooth**, puis choisissez le téléphone et validez le code.
3. Le PC se connecte et la télécommande s'affiche. Ensuite, l'app se reconnecte toute seule au dernier PC utilisé.
4. Sur le PC, **la fenêtre PowerPoint doit être au premier plan**, puisque les touches arrivent à l'application active.

| Bouton | Touche envoyée |
|---|---|
| ‹ / › et volume + / − | ← / → |
| Lancer / Depuis ici | F5 / Maj+F5 |
| Terminer | Échap |
| Écran noir / blanc | B / W |
| Début / Fin | Origine / Fin |

**Pointeur laser (Bluetooth)** : maintenez la zone rouge « LASER ». L'app envoie Ctrl+L, et le téléphone agit aussi comme une souris Bluetooth. Deux façons de viser, au choix avec le bouton « Visée » :
- **doigt** : glissez sur la zone, comme sur un pavé tactile ;
- **gyroscope** : maintenez la zone et visez l'écran en bougeant le téléphone.

En relâchant, l'app envoie Ctrl+A et le pointeur redevient une flèche, qui se masque toute seule. Avec la version 1.1, l'app déclare un clavier **et** une souris au PC : si vous aviez associé la version 1.0, supprimez l'association et refaites-la.

Si le téléphone était déjà associé au PC avant d'installer l'app, supprimez l'association des deux côtés, puis associez-les à nouveau depuis l'app. Sinon Windows ne voit pas le « clavier ». Certains téléphones (rares) désactivent ce mode clavier : l'app l'indique, et il reste alors le mode Wi-Fi.

Le mode Bluetooth ne transmet ni les notes ni les aperçus. Pour les avoir, utilisez le mode Wi-Fi.

### Mode Wi-Fi

Onglet **Wi-Fi** : saisissez l'adresse (par ex. `192.168.1.9:8765`) et le PIN affichés dans la fenêtre Télécommande PPT. Vous obtenez la télécommande complète, avec les touches de volume en plus.

### Recompiler l'APK

Il faut le SDK Android (build-tools et une plateforme) et un JDK. Gradle n'est pas nécessaire :

```bat
powershell -ExecutionPolicy Bypass -File android\build-apk.ps1
```

Code source : `android/src/com/pptremote/MainActivity.java`. La clé de signature `android/ppt-remote.keystore` doit être conservée pour pouvoir installer les mises à jour par-dessus l'ancienne version.

## Fonctionnement

- `server.js` : serveur HTTP + WebSocket (Node.js) qui sert l'interface et relaie les commandes.
- `bridge.ps1` : processus PowerShell persistant qui pilote PowerPoint par automation COM (navigation, état, notes, export des miniatures).
- `public/` : interface web mobile.

## Dépannage

- **Le téléphone ne se connecte pas** : vérifiez le même Wi-Fi, et que le pare-feu autorise Node.js (réseau privé). Essayez l'autre adresse affichée si plusieurs apparaissent.
- **« PowerPoint n'est pas ouvert »** : ouvrez la présentation dans PowerPoint sur le PC. Lancez Télécommande PPT et PowerPoint **normalement**, pas « en tant qu'administrateur ».
- **Laser Bluetooth qui ne bouge pas** : touchez « 🖱 Tester la souris ». Si le curseur du PC ne trace pas de carré, supprimez l'association Bluetooth des deux côtés et refaites-la.
