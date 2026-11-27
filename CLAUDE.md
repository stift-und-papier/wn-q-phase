# Lernmatrix Werte und Normen (Q-Phase) · Projektkontext

## Worum es geht
Lernübersicht für den Prüfungskurs Werte und Normen (Q2, Jahrgang 13, Gesamtschule in Niedersachsen, grundlegendes Niveau, schriftlich und mündlich), Abitur 2027.
Die Seite soll Schüler:innen einen Überblick geben: Fachbegriffe der abiturrelevanten Rahmenthemen, zu Clustern gruppiert, mit kurzer Erklärung, Abgrenzung, Verknüpfungen, Personen und Links zu Unterrichtsmaterial (IServ) und Erklärvideos.
Die Lehrkraft (Jazz) arbeitet als Co-Lehrkraft mit Claude: Ergebnisse sollen didaktisch sinnvoll sein. Bei Unklarheiten nachfragen.

## Hosting und Aufbau
- GitHub Pages aus `main` (Root): https://stift-und-papier.github.io/wn-q-phase/
- Reines HTML/CSS/JS ohne Build-Schritt, ES-Module.
- `index.html` + `js/app.js` + `css/style.css`: Schülerseite. Pro Rahmenthema ein Halbkreis (SVG, im Stil einer Business-Infografik: Blautöne, nummerierte Segmente, Linien-Icons, gepunktete Leitlinien). Tipp auf Segment zeigt die Begriffe des Clusters als Kacheln, Tipp auf Begriff öffnet ein `<dialog>`. Hash-Routing: `#ethik`, `#ethik/teleo`, `#begriff/<id>`, `#person/<id>`, `#personen`, `#abitur`. Auf schmalen Bildschirmen (≤ 640 px) Halbkreis ohne Beschriftung plus Liste daneben.
- `lehrer.html` + `js/lehrer.js` + `css/lehrer.css`: Lehrerbereich. Anmeldung mit Fine-grained Personal Access Token (nur dieses Repo, Contents: Read and write), gespeichert in localStorage. Liest und schreibt `data/matrix.json` über die GitHub Contents API (PUT mit sha).
- `js/icons.js`: Icon-Set (Linien-Icons), Farbpaletten pro Rahmenthema (`FARBEN`), Materialtypen.
- `data/matrix.json`: alle Inhalte. Wird sowohl von der Schülerseite als auch vom Lehrerbereich genutzt. Struktur:
  - `rahmenthemen[]`: `id, nr, name, farbe (blau|violett|tuerkis|koralle), aktiv, pflichtmodul, wahlmodul, cluster[]`
  - `cluster`: `id, name, icon, modul (pflicht|wahl), begriffe[] (IDs, Reihenfolge = Anzeige)`
  - `begriffe{id}`: `name, kurz, icon, erkl, achtung, positionen, links[] (Begriff-IDs), personen[] (Personen-IDs), material[] {typ: ab|tb|video|web, titel, url}`
  - `personen{id}`: `name, daten, idee, auch, begriffe[]`
  - `allgemein[]`: Material für alle Rahmenthemen (Operatoren, Abiturhinweise)

## Feste Regeln
- **Keine Gedankenstriche (–) in deutschen Texten**, auch nicht in Datenfeldern oder UI. Stattdessen Komma, Doppelpunkt, Punkt; bei Jahreszahlen „1724 bis 1804“. Vor jedem Commit prüfen: `grep -rn "–" .`
- **Keine Arbeitsblätter, Tafelbilder oder Schülerarbeiten ins Repository.** Das Repo ist öffentlich, viele Materialien sind Schulbuch- oder Verlagsauszüge. Materialien bleiben in IServ, die Matrix verlinkt nur. Lokale Materialkopien gehören in den Ordner `materialien/` (per .gitignore ausgeschlossen).
- Keine personenbezogenen Daten von Schüler:innen.
- IServ-Links: `https://kgslaatzen.eu/iserv/file/-/Groups/Sek2 7wn71 KUG/<Ordner>/<Datei>` (URL-kodiert). Ordner: `01.Anthropologie`, `02. Ethik`, `03. Wahrheit und Wirklichkeit`. Achtung: Einige Dateinamen speichern Umlaute zerlegt (NFD, z. B. „a“ + U+0308). Den Namen exakt so übernehmen, wie er in IServ liegt.
- IServ selbst blockiert JavaScript; deshalb läuft die Matrix auf GitHub Pages, in IServ liegt nur ein Link darauf.
- Fachliche Erklärungen sind Entwürfe, bis die Lehrkraft sie freigibt. Rechtsstand (§§ 216, 218, 219 StGB, Suizidhilfe) vor Änderungen aktuell recherchieren.
- Gestaltung: sachlich, klare serifenlose Schrift, Großbuchstaben mit Sperrung für Überschriften, keine verspielten Schriften, nicht überfrachten. Überblick und Clustern stehen im Vordergrund.

## Fachliche Grundlagen
- Kerncurriculum Werte und Normen, gymnasiale Oberstufe (2018), und Hinweise zur Abiturprüfung 2027 (Niedersachsen).
- Rahmenthemen der Q-Phase: 3 Anthropologie, 4 Ethik, 5 Wahrheit und Wirklichkeit, 6 Lebensentwürfe. In der Seite nummeriert als 01 bis 04.
- Wahlmodule des Kurses: Menschenbilder in den Wissenschaften; Ethik in Medizin und Wissenschaft; Wahrheit und Wirklichkeit in den Medien. Lebensentwürfe folgt später (Material aus früherem Durchgang noch nicht übernehmen).
- Abitur 2027, verbindliche Zusatzbegriffe: Freud (Instanzenmodell, Es, Ich, Über-Ich, Abwehrmechanismus, Psychoanalyse), Dahrendorf (Rollentheorie, soziale Rolle, Muss-/Soll-/Kann-Erwartung, Rollenkonflikte), Sterbehilfe (aktiv, passiv, indirekt, assistierter Suizid, Tötung auf Verlangen, § 216, Menschenwürde nach Kant), Schwangerschaftsabbruch (Spezies-, Kontinuums-, Identitäts-, Potentialitäts-, Dammbruch-Argument, §§ 218/219, PND).
- Lücken im Unterricht bekommen trotzdem eine normale Karte (Erklärung, ggf. Video), ohne besondere Markierung.

## Stand (27.11.2026)
- Ethik ist vollständig (34 Begriffe, 7 Cluster, 7 Personen).
- Anthropologie ist als Entwurf aufgebaut (31 Begriffe, 7 Cluster, 16 neue Personen): Wesen des Menschen, Leib und Seele, Freiheit und Determinismus (Pflicht); Psychoanalyse (Freud), Hirnforschung, Soziale Rolle (Dahrendorf), Evolutionsbiologie (Wahl). Texte warten auf Freigabe durch die Lehrkraft. Zeitlichkeit (nur eA) ist bewusst nicht enthalten.
- Wahrheit und Wirklichkeit ist angelegt, aber leer (`aktiv: false`).
- Lokale Materialkopien liegen derzeit in `material/` (nicht `materialien/`); beide Ordner sind per .gitignore ausgeschlossen.
- Lücken gegenüber dem KC, die in der Matrix abgedeckt werden sollen:
  - Anthropologie: erledigt (Monismus, Selbstreflexivität, Indeterminismus, Evolutionsbiologie als Karten; Evolutionsbiologie, Indeterminismus und Handlungs-/Willensfreiheit ohne eigenes Material).
  - Ethik: erledigt (Tugendethik, Legalität/Moralität, PND, Biotechnologie als Karten ohne Material).
  - Wahrheit und Wirklichkeit: Subjektivität/Objektivität/Intersubjektivität; kultur- und gesellschaftsspezifische Zugänge zu Wahrheit; Medienmodul läuft noch (bisher Platons Medienkritik, Ontologie/Epistemologie).
- Videos: bisher nur wenige; neue Videovorschläge der Lehrkraft zur Freigabe vorlegen.

## Nächste Schritte
1. Lehrkraft testet Schülerseite, Lehrerbereich (echter Token) und Materiallinks mit Umlauten.
2. Anthropologie aus den Materialien in `materialien/` aufbauen (gleiches Schema, eigene Cluster, z. B. Wesen des Menschen, Leib und Seele, Freiheit und Determinismus, Menschenbilder in den Wissenschaften).
3. Wahrheit und Wirklichkeit ebenso; Medienmodul mit dem Unterricht wachsen lassen.
4. Brückenbegriffe zwischen Rahmenthemen (z. B. Kant, Menschenwürde, Singer ≠ Wolf Singer) über `links` und Personen sichtbar machen.
