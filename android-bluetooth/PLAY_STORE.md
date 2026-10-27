# Publier « Télécommande PPT Bluetooth » sur Google Play

Application séparée, **Bluetooth uniquement** : sans Wi-Fi, sans Internet et sans logiciel sur le PC. Réalisé par **AMINE AMAHAN**.

Les étapes de la Play Console sont les mêmes que pour la première application : voir [../android/PLAY_STORE.md](../android/PLAY_STORE.md). Seules les valeurs ci-dessous changent.

## Fichiers prêts à envoyer

| Élément | Fichier |
|---|---|
| App Bundle signé | `android-bluetooth/PPT-Bluetooth.aab` |
| APK à installer directement (test sur votre téléphone) | `android-bluetooth/PPT-Bluetooth.apk` |
| Icône 512 × 512 | `android-bluetooth/play-store/BtIcone-512.png` |
| Image de présentation 1024 × 500 | `android-bluetooth/play-store/BtBanniere-1024x500.jpg` |
| Captures téléphone | `android-bluetooth/play-store/BtCapture1.png` à `BtCapture3.png` |
| Politique de confidentialité | https://telecommande-ppt.online/confidentialite-bluetooth |

- Identifiant : `com.amineamahan.pptbluetooth` (définitif après le premier envoi)
- Version : 1.0 (code de version 1)
- Nom sous l'icône du téléphone : « PPT Bluetooth »
- Clé d'envoi : la même que la première application (`android/ppt-remote.keystore` et `android/keystore.password`)

## Créer l'application

**Toutes les applications › Créer une application**

| Champ | Valeur |
|---|---|
| Nom de l'application | `Télécommande PPT Bluetooth` |
| Langue par défaut | Français (France) – fr-FR |
| Application ou jeu | Application |
| Gratuite ou payante | Gratuite |

## Contenu de l'application

Réponses identiques à la première application (pas d'annonces, accès sans compte, PEGI 3, public 18 ans et plus, aucune donnée collectée), avec deux différences :
- **Politique de confidentialité** : `https://telecommande-ppt.online/confidentialite-bluetooth`
- **Sécurité des données** : « Aucune donnée collectée ni partagée ». L'application n'a même pas l'autorisation Internet.

## Fiche du Store

**Nom** (30 caractères max.)
```
Télécommande PPT Bluetooth
```

**Brève description** (80 caractères max.)
```
Télécommande PowerPoint en Bluetooth : sans Wi-Fi, sans logiciel, avec laser.
```

**Description complète**
```
Télécommande PPT Bluetooth transforme votre téléphone en télécommande pour vos présentations PowerPoint, sans Wi-Fi et sans rien installer sur l'ordinateur.

Idéal pour les salles de conférence, les écoles et les entreprises où le Wi-Fi est saturé, filtré ou indisponible.

COMMENT ÇA MARCHE
Le téléphone se présente à l'ordinateur comme un clavier et une souris Bluetooth. Associez-le une fois depuis les paramètres Bluetooth de Windows, et pilotez votre diaporama.

1. Dans l'application, touchez « Rendre visible ».
2. Sur le PC : Paramètres › Bluetooth › Ajouter un appareil, puis choisissez votre téléphone.
3. Présentez ! L'application se reconnecte toute seule la fois suivante.

FONCTIONNALITÉS
• Diapositive suivante ou précédente : gros boutons ou touches de volume
• Pointeur laser de PowerPoint : au doigt, ou en visant l'écran avec le gyroscope
• Lancer le diaporama depuis le début ou depuis la diapositive en cours
• Écran noir ou blanc, début et fin de la présentation
• Chrono intégré et écran toujours allumé
• Retour haptique à chaque appui

RESPECT DE LA VIE PRIVÉE
Aucun compte, aucune publicité, aucune donnée collectée. L'application n'utilise pas Internet : tout passe en Bluetooth entre votre téléphone et votre ordinateur.

Compatible avec Microsoft PowerPoint sur Windows. Android 9 ou plus récent, avec la prise en charge du Bluetooth HID (la plupart des téléphones).

Réalisé par AMINE AMAHAN.
```

**Éléments graphiques** : `BtIcone-512.png`, `BtBanniere-1024x500.jpg`, `BtCapture1.png` à `BtCapture3.png`.

**Catégorie** : Productivité.

## Test fermé

Comme pour la première application, un compte personnel doit faire un **test fermé avec 12 testeurs pendant 14 jours** avant la production. Vous pouvez réutiliser la **même liste de testeurs** : ils devront s'inscrire au test de cette application aussi.

Version : importez `PPT-Bluetooth.aab`. Nom de la version : `1.0`.

## Mise à jour

Augmentez `$versionCode` (2, 3…) et `$versionName` dans `android-bluetooth/build.ps1`, puis :
```bat
powershell -ExecutionPolicy Bypass -File android-bluetooth\build.ps1
```
