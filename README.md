# 3pletoy

Marktplatz für gebrauchte Spielzeuge (Angular, [dav-ui-components](https://github.com/dav-apps/dav-ui-components), [dav-js](https://github.com/dav-apps/dav-js)). Backend: `../tripletoy-api`.

## Setup

```bash
npm install
npm run dev   # http://localhost:3006
```

In `src/environments/*.ts` müssen `apiKey` und `appId` der App aus dem dav-Dashboard eingetragen werden. Die API läuft standardmäßig auf `http://localhost:3005`.

## Struktur

- `src/app/pages` – Startseite (alle Spielzeuge), Spielzeug-Detail, Spielzeug verkaufen, Profil/Login
- `src/app/components` – wiederverwendbare Komponenten
- `src/app/services` – `ApiService` (GraphQL), `DataService` (dav-Login, Theme), `RoutingService`, `LocalizationService`
- `src/locales` – Texte (de/en)
