# Atlas Voyages : assistante vocale (démo Retell AI)

Une page web où l'on clique sur « Parler à l'assistant » et où l'on parle à Salma, l'assistante vocale d'une agence de voyages. Elle comprend le projet (destination, période, voyageurs, budget), propose de vrais créneaux libres, réserve un rendez-vous avec un conseiller, le confirme à voix haute et raccroche. Le prospect, le résumé et la transcription sont enregistrés pour le suivi.

« Atlas Voyages » est une agence fictive (Casablanca). On la remplace par le vrai prospect en quelques minutes (voir plus bas).

## Comment ça marche

```
Navigateur ──POST /api/create-web-call──▶ Vercel ──▶ Retell (crée l'appel, renvoie un jeton court)
    │                                                 
    └──── audio WebRTC ────────────────────────────▶ Retell (voix + LLM)
                                                        │  outils signés (x-retell-signature)
                              /api/check-availability ◀─┤
                              /api/book-appointment   ◀─┤──▶ Supabase (appointments, leads)
                              /api/retell-webhook     ◀─┘──▶ Supabase (call_logs, leads)
```

- **Retell** : un « Retell LLM » (prompt unique + outils) et un agent vocal en `fr-FR`.
- **Vercel** : la page statique `public/` et les fonctions `api/`. La clé Retell reste côté serveur ; le navigateur ne reçoit qu'un jeton d'appel à durée de vie courte.
- **Supabase** : `appointments` (un index unique sur le créneau rend la double réservation impossible), `leads`, `call_logs`, `web_call_requests` (limite de débit).
- Chaque requête de Retell est vérifiée avec la fonction officielle `Retell.verify` du SDK ; sans signature valide, réponse 401.

## Changer d'agence (un seul fichier de config)

1. `config/agency.ts` : nom, ville, prénom de l'assistante, fuseau horaire, horaires d'ouverture par jour, durée des créneaux, délai minimum, conseillers.
2. `public/index.html` : le nom de l'agence, la ville, le prénom de l'assistante et les horaires affichés sur la page (texte visible, à aligner sur la config). Dans `public/app.js`, le prénom « Salma » apparaît dans les messages d'état.
3. Relancer le provisioning pour mettre à jour Retell (voir « Modifier le prompt »), puis pousser sur Git pour redéployer Vercel.

Les créneaux proposés se recalculent automatiquement à partir des horaires : rien à changer dans le code.

## Modifier le prompt

Le prompt de l'agent est dans `prompts/agent-system-prompt.md` (en français, écrit pour être dit à voix haute). Après modification :

```bash
npx tsx scripts/provision-retell.ts
```

Le script est idempotent : il met à jour le LLM et l'agent existants (identifiants dans `.retell-ids.json`, non versionné) et publie la nouvelle version. On peut aussi modifier le prompt directement dans le tableau de bord Retell pour tester, mais le prochain provisioning l'écrasera : reportez la version finale dans le fichier.

Autres options du script : `--list-voices` (voix françaises disponibles), `--voice <id>`, `--model <id>`, `--languages fr-FR,ar-SA`.

## Où voir les appels

- **Supabase**, projet de démo, éditeur de tables :
  - `appointments` : les rendez-vous réservés (créneau en UTC, conseiller, nom, téléphone, destination).
  - `leads` : un prospect par appel, avec destination, période, voyageurs, budget et `booked`.
  - `call_logs` : transcription, résumé, sentiment, durée, coût Retell (`call_cost`).
- **Retell**, tableau de bord, *Call History* : écoute de l'enregistrement, latence et coût de chaque appel.

## Coût par minute

À mesurer sur les premiers appels réels : *à compléter* (dashboard Retell, *Call History*, colonne coût, ou `call_logs.call_cost` divisé par la durée). Les appels web n'ont pas de coût de téléphonie ; seuls la voix, la transcription et le LLM sont facturés.

Protections contre une facture surprise si le lien circule :
- appel coupé après 5 minutes (`max_call_duration_ms`) et après 30 secondes de silence ;
- `/api/create-web-call` : 4 appels par IP toutes les 10 minutes, 40 appels par heure au total, uniquement depuis la page elle-même.

## Variables d'environnement (Vercel)

Voir `.env.example`. Toutes côté serveur, jamais dans la page :
`RETELL_API_KEY`, `RETELL_AGENT_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_BASE_URL`.

## Développement

```bash
npm install
npm test                    # logique des créneaux, réservations concurrentes, signatures, webhook, rate limit
npm run typecheck
RETELL_API_KEY=une-cle-de-test npm run local    # API + page sur http://localhost:3000 (base Postgres en mémoire)
npx tsx scripts/send-signed.ts http://localhost:3000/api/check-availability '{"name":"check_availability","call":{"call_id":"c1"},"args":{"date":"2026-10-20"}}'
npx tsx scripts/check-page.ts http://localhost:3000 --secret une-cle-de-test   # contrôles navigateur + captures
npx tsx scripts/simulate-calls.ts --models gpt-4.1,gemini-3.5-flash           # scénarios simulés via l'API de test Retell
npm run build:web           # régénère public/vendor/retell-client.js après une mise à jour du SDK navigateur
```

## Limites connues

- **Darija** : Retell ne propose pas la darija. L'agent est en `fr-FR` ; il peut saluer en arabe, mais la reconnaissance d'un appelant qui parle darija sera approximative. Ne pas promettre la darija au prospect.
- Pas de rappel SMS ni d'agenda Google : les rendez-vous vivent dans Supabase.
- Un seul rendez-vous par créneau, quel que soit le nombre de conseillers (simple et sans conflit pour une démo).
