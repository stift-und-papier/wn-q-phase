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
  - `begriffe{id}`: `name, kurz, icon, erkl, beispiel, achtung, positionen, links[] (Begriff-IDs), personen[] (Personen-IDs), material[] {typ: ab|tb|video|web, titel, url}`
  - `personen{id}`: `name, daten, idee, achtung, auch (Querverbindung), begriffe[]`
  - In allen Textfeldern setzt `**…**` Fettdruck (Funktion `fmt` in `js/icons.js`).
  - `allgemein[]`: Material für alle Rahmenthemen (Operatoren, Abiturhinweise)

## Feste Regeln
- **Keine Gedankenstriche (–) in deutschen Texten**, auch nicht in Datenfeldern oder UI. Stattdessen Komma, Doppelpunkt, Punkt; bei Jahreszahlen „1724 bis 1804“. Vor jedem Commit prüfen: `grep -rn "–" .`
- **Keine Arbeitsblätter, Tafelbilder oder Schülerarbeiten ins Repository.** Das Repo ist öffentlich, viele Materialien sind Schulbuch- oder Verlagsauszüge. Materialien bleiben in IServ, die Matrix verlinkt nur. Lokale Materialkopien gehören in den Ordner `materialien/` (per .gitignore ausgeschlossen).
- Keine personenbezogenen Daten von Schüler:innen.
- IServ-Links: `https://kgslaatzen.eu/iserv/file/-/Groups/Sek2 7wn71 KUG/<Ordner>/<Datei>` (URL-kodiert). Ordner: `01.Anthropologie`, `02. Ethik`, `03. Wahrheit und Wirklichkeit`. Achtung: Einige Dateinamen speichern Umlaute zerlegt (NFD, z. B. „a“ + U+0308). Den Namen exakt so übernehmen, wie er in IServ liegt.
- IServ selbst blockiert JavaScript; deshalb läuft die Matrix auf GitHub Pages, in IServ liegt nur ein Link darauf.
- Fachliche Erklärungen sind Entwürfe, bis die Lehrkraft sie freigibt. Rechtsstand (§§ 216, 218, 219 StGB, Suizidhilfe) vor Änderungen aktuell recherchieren.
- Gestaltung: sachlich, klare serifenlose Schrift, Großbuchstaben mit Sperrung für Überschriften, keine verspielten Schriften, nicht überfrachten. Überblick und Clustern stehen im Vordergrund.
- Pflicht- und Wahlmodul farblich absetzen: Pflicht-Cluster in dunklen, kräftigen Tönen der Themenfarbe, Wahl-Cluster in hellen, vollen Tönen ohne Rand (Halbkreis, Badge, Clusterbereich). Die Beschriftung im Halbkreis nennt das Modul, eine zusätzliche Legende gibt es nicht. Der aktive Cluster wird durch einen Bogen außen markiert, nicht durch Vergrößern (sonst verrutschen die Symbole).
- Personenkacheln: ohne Symbol, mit Tags der zugehörigen Begriffe, jeweils in der Farbe ihres Rahmenthemas.
- Kartentexte: Wichtige Fachbegriffe in der Erklärung **fett**. Beispiele gehören ins Feld `beispiel` (grüner Kasten), nicht in Erklärung oder Achtung. `achtung` (orange) nur für echte Fehlerquellen und Verwechslungen. Kritik und Einwände gehören in `positionen`.

## Fachliche Grundlagen
- Kerncurriculum Werte und Normen, gymnasiale Oberstufe (2018), und Hinweise zur Abiturprüfung 2027 (Niedersachsen).
- Rahmenthemen der Q-Phase: 3 Anthropologie, 4 Ethik, 5 Wahrheit und Wirklichkeit, 6 Lebensentwürfe. In der Seite nummeriert als 01 bis 04.
- Wahlmodule des Kurses: Menschenbilder in den Wissenschaften; Ethik in Medizin und Wissenschaft; Wahrheit und Wirklichkeit in den Medien. Lebensentwürfe folgt später (Material aus früherem Durchgang noch nicht übernehmen).
- Abitur 2027, verbindliche Zusatzbegriffe: Freud (Instanzenmodell, Es, Ich, Über-Ich, Abwehrmechanismus, Psychoanalyse), Dahrendorf (Rollentheorie, soziale Rolle, Muss-/Soll-/Kann-Erwartung, Rollenkonflikte), Sterbehilfe (aktiv, passiv, indirekt, assistierter Suizid, Tötung auf Verlangen, § 216, Menschenwürde nach Kant), Schwangerschaftsabbruch (Spezies-, Kontinuums-, Identitäts-, Potentialitäts-, Dammbruch-Argument, §§ 218/219, PND).
- Lücken im Unterricht bekommen trotzdem eine normale Karte (Erklärung, ggf. Video), ohne besondere Markierung.

## Stand (27.11.2026)
- Ethik ist vollständig (43 Begriffe, 7 Cluster). Neu als Entwurf: Tugendethik aufgeteilt (Eudaimonia, Tugenden, Mesotes, Kardinaltugenden; Link zur Spektrum-Kolumne entfernt, ggf. später Video), Biotechnologie aufgeteilt (Genom-Editierung, PID, Klonen, Embryonenforschung, Embryonenschutzgesetz; Rechtsstand recherchiert November 2026).
- Anthropologie ist als Entwurf aufgebaut (35 Begriffe, 7 Cluster): Wesen des Menschen, Leib und Seele, Freiheit und Determinismus (Pflicht); Psychoanalyse (Freud), Hirnforschung, Soziale Rolle (Dahrendorf), Evolutionsbiologie (Wahl). Anthropologische Differenz hat eigene Karten für Lenk, Rensch und Kern; Sein-Sollen-Fehlschluss unter Evolutionsbiologie. Texte warten auf Freigabe durch die Lehrkraft. Zeitlichkeit (nur eA) ist bewusst nicht enthalten.
- Wahrheit und Wirklichkeit ist als Entwurf aufgebaut (16 Begriffe, 5 Cluster, 7 neue Personen): Wahrheit und Wissen, Wahrheitstheorien, Platons Ideenlehre, Wissenschaftliche Erkenntnis (Pflicht); Wahrheit in den Medien (Wahl, läuft gerade erst: bisher Platons Medienkritik, Ontologie und Epistemologie). Übungsklausuren und Erwartungshorizonte sind bewusst nicht verlinkt.
- Lokale Materialkopien liegen derzeit in `material/` (nicht `materialien/`); beide Ordner sind per .gitignore ausgeschlossen.
- Lücken gegenüber dem KC, die in der Matrix abgedeckt werden sollen:
  - Anthropologie: erledigt (Monismus, Selbstreflexivität, Indeterminismus, Evolutionsbiologie als Karten; Evolutionsbiologie, Indeterminismus und Handlungs-/Willensfreiheit ohne eigenes Material).
  - Ethik: erledigt (Tugendethik, Legalität/Moralität, PND, Biotechnologie als Karten ohne Material).
  - Wahrheit und Wirklichkeit: Subjektivität/Objektivität/Intersubjektivität und kulturelle Zugänge zu Wahrheit als Karten ohne Material angelegt; Medienmodul mit dem Unterricht ergänzen.
- Videos: bisher nur wenige; neue Videovorschläge der Lehrkraft zur Freigabe vorlegen.

## Nächste Schritte
1. Lehrkraft testet Schülerseite, Lehrerbereich (echter Token) und Materiallinks mit Umlauten.
2. Lehrkraft prüft und gibt die Entwürfe frei (Anthropologie, neue Ethik-Karten, Wahrheit und Wirklichkeit).
3. Medienmodul (Wahrheit in den Medien) mit dem Unterricht wachsen lassen.
4. Brückenbegriffe zwischen Rahmenthemen (z. B. Kant, Menschenwürde, Singer ≠ Wolf Singer) über `links` und Personen sichtbar machen.
