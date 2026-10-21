# Publier Télécommande PPT sur Google Play

Guide pas à pas pour la Play Console. Réalisé par **AMINE AMAHAN**.

## Fichiers prêts à envoyer

| Élément | Fichier | Exigence Google |
|---|---|---|
| App Bundle signé | `android/Telecommande-PPT.aab` | format .aab, cible Android 16 (API 36) |
| Icône | `android/play-store/PlayIcone-512.png` | 512 × 512, PNG |
| Image de présentation | `android/play-store/PlayBanniere-1024x500.jpg` | 1024 × 500, JPG ou PNG |
| Captures téléphone | `android/play-store/PlayCapture1.png` à `PlayCapture4.png` | 2 à 8 captures, 1080 × 1920 |
| Politique de confidentialité | https://telecommande-ppt.online/confidentialite | URL publique |

- Identifiant de l'application : `com.amineamahan.telecommandeppt`. Il est **définitif** une fois le premier envoi fait.
- Version : 1.4 (code de version 5).

> ⚠️ **Sauvegardez la clé d'envoi** : `android/ppt-remote.keystore` et son mot de passe `android/keystore.password` (clé USB, cloud privé). Ils ne sont pas dans GitHub. Sans eux, vous devrez demander à Google de réinitialiser la clé pour publier une mise à jour.

---

## Étape 1 : créer l'application

Sur la page **Créer une application** :

| Champ | Valeur |
|---|---|
| Nom de l'application | `Télécommande PPT` |
| Langue par défaut | Français (France) – fr-FR |
| Application ou jeu | **Application** |
| Gratuite ou payante | **Gratuite** (ce choix ne pourra plus être changé) |
| Déclarations | cochez les deux cases (règles du programme et lois américaines sur l'exportation) |

Cliquez sur **Créer l'application**.

---

## Étape 2 : comprendre l'obligation de test (comptes personnels)

Si votre compte développeur est un **compte personnel créé après novembre 2023**, Google impose un **test fermé avec au moins 12 testeurs pendant 14 jours d'affilée** avant d'ouvrir la publication en production.

L'ordre est donc :
1. Remplir la configuration de l'application (étape 3) et la fiche du Store (étape 4).
2. Publier un **test fermé** avec 12 testeurs ou plus (étape 5).
3. Après 14 jours, **demander l'accès à la production** (étape 6).

Si votre compte est un compte d'organisation, vous pouvez publier directement en production à l'étape 5 (piste **Production** au lieu de **Test fermé**).

---

## Étape 3 : configurer l'application

Dans le **Tableau de bord**, section « Configurer votre application », remplissez chaque tâche :

**Règles relatives aux applis › Politique de confidentialité**
`https://telecommande-ppt.online/confidentialite`

**Accès à l'application**
« Toutes les fonctionnalités sont disponibles sans accès spécial » : il n'y a ni compte ni mot de passe.

**Annonces**
« Non, mon application ne contient pas d'annonces ».

**Classification du contenu**
- Adresse e-mail : la vôtre.
- Catégorie : **Toutes les autres catégories d'applications**, ou « Utilitaire, productivité, communication ou autre ».
- Répondez **Non** à toutes les questions (violence, contenu sexuel, langage, drogues, jeux d'argent, interactions entre utilisateurs, partage de localisation, achats numériques…).
- Résultat attendu : **Tout public / PEGI 3**.

**Public cible et contenu**
- Tranches d'âge : cochez **18 ans et plus** (vous pouvez aussi ajouter 16-17 et 13-15).
- Ne cochez **pas** les tranches de moins de 13 ans : cela soumettrait l'application au programme « Familles » et à ses contraintes.
- « L'application pourrait-elle attirer les enfants ? » : **Non**.

**Sécurité des données**
- « Votre application collecte-t-elle ou partage-t-elle des types de données utilisateur obligatoires ? » : **Non**.
- Toutes les données restent entre le téléphone et l'ordinateur de l'utilisateur, sans serveur. Les réglages sont stockés localement uniquement.
- Résultat sur la fiche : « Aucune donnée collectée · Aucune donnée partagée ».

**Applications gouvernementales** : Non.
**Fonctionnalités financières** : « Mon application ne propose aucune fonctionnalité financière ».
**Santé** : « Mon application n'a pas de fonctionnalités liées à la santé ».
**Application d'actualités** : Non.

---

## Étape 4 : fiche du Store

**Croissance › Présence sur le Store › Fiche principale du Store**

**Nom de l'application** (30 caractères max.)
```
Télécommande PPT
```

**Brève description** (80 caractères max.)
```
Pilotez PowerPoint depuis votre téléphone : Bluetooth, Wi-Fi, notes et laser.
```

**Description complète** (4000 caractères max.)
```
Télécommande PPT transforme votre téléphone ou votre tablette en télécommande pour vos présentations PowerPoint. Présentez librement, où que vous soyez dans la salle.

DEUX MODES DE CONNEXION

● Bluetooth : sans Wi-Fi et sans rien installer sur l'ordinateur
Le téléphone se présente au PC comme un clavier et une souris Bluetooth. Associez-le une fois, et pilotez votre diaporama sur n'importe quel ordinateur Windows.

● Wi-Fi : la télécommande complète
Installez l'application gratuite Télécommande PPT sur votre PC (telecommande-ppt.online), scannez le QR code, et retrouvez sur votre téléphone l'aperçu de la diapositive, vos notes et le titre de la suivante.

FONCTIONNALITÉS

• Diapositive suivante ou précédente : gros boutons, balayage ou touches de volume
• Pointeur laser : au doigt, ou en visant l'écran avec le gyroscope
• Notes du présentateur, avec une taille de texte réglable (Wi-Fi)
• Aperçu de la diapositive en direct et grille de toutes les diapositives (Wi-Fi)
• Lancer le diaporama depuis le début ou depuis la diapositive en cours
• Écran noir ou blanc pour capter l'attention
• Chrono intégré et écran toujours allumé pendant la présentation
• Connexion protégée par un code PIN (Wi-Fi)

RESPECT DE LA VIE PRIVÉE

Aucun compte, aucune publicité, aucune donnée collectée. Tout se passe entre votre téléphone et votre ordinateur.

Compatible avec Microsoft PowerPoint sur Windows. Android 9 ou plus récent.

Réalisé par AMINE AMAHAN.
```

**Éléments graphiques**
- Icône de l'application : `PlayIcone-512.png`
- Image de présentation : `PlayBanniere-1024x500.jpg`
- Captures d'écran du téléphone : `PlayCapture1.png`, `PlayCapture2.png`, `PlayCapture3.png`, `PlayCapture4.png`
- Captures tablette : facultatives. Si la Console les exige pour la tablette, vous pouvez réutiliser les mêmes images.

**Paramètres du Store** (Croissance › Présence sur le Store › Paramètres du Store)
- Catégorie : **Productivité**
- Tags : Productivité, Outils, Bureau
- Coordonnées : votre e-mail (obligatoire, affiché publiquement) et le site `https://telecommande-ppt.online`

---

## Étape 5 : envoyer l'App Bundle (test fermé)

**Tester et publier › Tests › Test fermé**
1. Sur la piste « Alpha » (ou **Créer une piste**), cliquez sur **Gérer la piste**.
2. Onglet **Testeurs** : créez une liste d'adresses e-mail avec au moins **12 testeurs** (comptes Google). Enregistrez, puis copiez le **lien d'inscription** à leur envoyer.
3. **Pays/régions** : ajoutez au minimum le vôtre.
4. **Créer une version** :
   - Signature de l'application par Google Play : acceptez (**Utiliser la clé générée par Google**). Votre fichier `.keystore` devient la *clé d'envoi*.
   - Déposez `android/Telecommande-PPT.aab`.
   - Nom de la version : `1.4`.
   - Notes de version :
     ```
     <fr-FR>
     Première version : télécommande Bluetooth et Wi-Fi, notes, pointeur laser, chrono.
     </fr-FR>
     ```
5. **Suivant › Enregistrer › Envoyer pour examen.** L'examen de Google prend en général de quelques heures à quelques jours.

Chaque testeur doit **s'inscrire via le lien**, installer l'application depuis le Play Store **et la garder installée pendant 14 jours**.

---

## Étape 6 : passer en production

Après 14 jours de test fermé avec 12 testeurs :
1. **Tableau de bord › Demander l'accès à la production**, puis répondez au questionnaire sur le test (nombre de testeurs, retours reçus, etc.).
2. Une fois l'accès accordé : **Production › Créer une version › Ajouter depuis la bibliothèque** (la même version 1.4), choisissez les pays, puis **Envoyer pour examen**.

---

## Publier une mise à jour plus tard

1. Dans `android/build-apk.ps1`, augmentez **`$versionCode`** (6, 7, 8…) et `$versionName`. Google refuse un code de version déjà utilisé.
2. Recompilez :
   ```bat
   powershell -ExecutionPolicy Bypass -File android\build-apk.ps1
   ```
3. Dans la Play Console, créez une nouvelle version sur la piste voulue et envoyez le nouveau `Telecommande-PPT.aab`.

Les captures et la bannière se régénèrent depuis `promo/` (Remotion) :
```bat
cd promo
npx remotion still src/index.ts PlayCapture1 ../android/play-store/PlayCapture1.png
```
