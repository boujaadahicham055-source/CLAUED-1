# Script de démo (5 minutes)

Matériel : téléphone ou ordinateur avec micro, casque conseillé (évite que la voix de l'agent revienne dans le micro), onglet Supabase `appointments` ouvert en arrière-plan. Faites un appel de test 10 minutes avant le rendez-vous.

## 0:00 – Le problème (30 s)
« Combien d'appels votre agence rate le soir, le dimanche, ou quand tout le monde est occupé ? Chaque appel raté, c'est un voyage qui part chez un concurrent. »

## 0:30 – La page (30 s)
Ouvrez le lien de démo sur votre téléphone et tendez-le au prospect.
« Voilà ce que voit un client sur votre site ou depuis un lien WhatsApp. Un bouton, rien à installer. »

## 1:00 – L'appel en direct (2 min 30)
Appuyez sur « Parler à l'assistant », autorisez le micro. Jouez le client, ou mieux, laissez le prospect parler.

Parcours conseillé :
1. « Bonjour, je voudrais partir à Marrakech avec ma femme et mon fils, vers la mi-décembre. »
2. Budget : « Un budget moyen, je dirais. »
3. Demandez un prix : « C'est combien un riad pour une semaine ? » → l'agent refuse poliment de donner un prix et renvoie vers le conseiller. **Soulignez-le** : « Elle n'invente jamais un prix ni une disponibilité. »
4. Rendez-vous : « Mardi prochain, plutôt l'après-midi. » → elle propose deux ou trois créneaux réels.
5. Nom et numéro : elle relit le numéro chiffre par chiffre.
6. Confirmation : elle annonce le jour, l'heure et le nom du conseiller, puis raccroche.

Pendant l'appel, montrez la transcription qui s'affiche et l'anneau qui change de couleur selon qui parle.

## 3:30 – La preuve (1 min)
Rafraîchissez l'onglet Supabase : le rendez-vous est là, avec le nom, le téléphone et la destination. Une minute plus tard, `call_logs` contient le résumé et la transcription.
« Votre conseiller arrive au rendez-vous en sachant déjà tout. Et le créneau est bloqué : impossible de le donner deux fois. »

## 4:30 – La suite (30 s)
« On la branche sur votre numéro de téléphone, vos vrais horaires et le nom de vos conseillers. »

## Si quelque chose se passe mal

- **Elle comprend mal un nom** (fréquent avec les noms marocains) : épelez-le calmement, « B comme Bernard, E, N, N, A, N, I ». Elle répète et corrige. Profitez-en : « Elle vérifie toujours avant d'enregistrer. » Un nom légèrement mal orthographié se corrige ensuite dans Supabase ; le numéro, lui, est relu chiffre par chiffre.
- **Elle comprend mal le numéro** : dites « Non, je répète : zéro six, douze, trente-quatre… » par groupes de deux. Elle relit le numéro corrigé avant de réserver.
- **Le prospect parle darija** : elle salue en arabe puis propose de continuer en français. Dites franchement que la darija n'est pas encore supportée par la plateforme.
- **« Le micro est bloqué »** : icône à gauche de l'adresse, autoriser le micro, puis « Réessayer ».
- **« Trop d'appels de démonstration »** : limite anti-abus (4 appels par 10 minutes par connexion). Attendez quelques minutes ou passez sur la 4G.
- **Silence ou coupure réseau** : raccrochez et relancez ; un appel dure au maximum 5 minutes.
