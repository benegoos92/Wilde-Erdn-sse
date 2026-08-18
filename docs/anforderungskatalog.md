# Anforderungskatalog: Date-Night-Glücksrad

Stand: 2026-08-18

## 1. Projektüberblick

Es soll eine Webseite (HTML-Anwendung) entstehen, die ein "Date-Night-Glücksrad" für zwei Personen abbildet.
Auf dem Rad befinden sich verschiedene Spiele/Challenges. Durch Drehen des Rades wird zufällig entschieden,
welches Spiel bzw. welche Challenge als nächstes gemeinsam gespielt wird. Die Spiele sollen über die Zeit
frei erweiterbar sein, und es soll nachgehalten werden, wer welches Spiel gewonnen hat.

## 2. Nutzerkreis

- Genau 2 Spieler:innen nehmen an jeder Session teil (feste Namen, änderbar).
- Kein Mehrbenutzer-/Login-System notwendig, private Nutzung zu zweit.

## 3. Funktionale Anforderungen

### 3.1 Glücksrad (Kernfunktion)

- FR-1: Ein visuelles Glücksrad zeigt alle aktiven Spiele als Segmente an.
- FR-2: Ein "Drehen"-Button startet eine Animation und wählt zufällig (fair gewichtet) ein Spiel aus.
- FR-3: Nach dem Stopp wird das ausgewählte Spiel prominent angezeigt, inkl. Kurzbeschreibung/Anleitung.
- FR-4: Optional: Spiele können einzeln deaktiviert werden, ohne gelöscht zu werden (nehmen dann nicht am
  Rad teil, bleiben aber im Katalog erhalten).
- FR-5: Bereits kürzlich gespielte Spiele können optional (Einstellung) für die nächsten X Drehungen mit
  reduzierter Wahrscheinlichkeit erneut ausgewählt werden, um Wiederholungen zu vermeiden.

### 3.2 Spiele-Verwaltung (CRUD)

- FR-6: Neue Spiele können manuell angelegt werden (Titel, Beschreibung, Kategorie/Typ, Icon/Farbe fürs Rad).
- FR-7: Bestehende Spiele können bearbeitet und gelöscht werden.
- FR-8: Jedes Spiel gehört zu einem "Spieltyp" (siehe 3.3), der bestimmt, welche Zusatzdaten/Inhalte
  gepflegt werden können (z. B. Bilder bei Bilderraten-Spielen).
- FR-9: Es muss möglich sein, rein manuelle/freitextliche Spiele ohne besonderen Typ anzulegen (einfache
  "Challenge-Karte" ohne Spiellogik, nur Text).

### 3.3 Vordefinierte Spieltypen (Startkatalog)

1. **Urlaubsbilder-Raten**
   - Upload eigener Urlaubsfotos.
   - Die andere Person muss Ort und/oder Zeitpunkt (Jahr/Monat, Reise) der Aufnahme erraten.
   - Auflösung zeigt das korrekte Datum/den korrekten Ort zum Vergleich.
2. **Hunde-Bilder-Ranking (Freio)**
   - Upload mehrerer Fotos des Hundes "Freio".
   - Beide Spieler:innen bringen die Bilder unabhängig voneinander in eine persönliche Reihenfolge
     (z. B. "bestes Bild zuerst") und vergleichen anschließend.
3. **Stuttgart-Quiz**
   - Fragen-/Antworten-Katalog mit Fun Facts über Stuttgart (Multiple Choice oder Freitext mit Lösung).
   - Punktevergabe pro richtiger Antwort.
4. **Durak-Duell**
   - Verweis/Anleitung auf das Kartenspiel "Durak" als Duell zu zweit; Ergebnis (Sieger:in) wird erfasst.
5. **"Was kostet das?"**
   - Zeigt Gegenstände/Dienstleistungen (Bild + Name) an, beide schätzen den Preis.
   - Auflösung zeigt tatsächlichen Preis; wer näher dran ist, gewinnt die Runde.
6. **Fußballergebnisse-Quiz**
   - Auswahl vergangener Spiele der eigenen Fußballmannschaft (letzte zwei Saisons).
   - Spieler:innen raten das Ergebnis; Auflösung zeigt das tatsächliche Resultat.
7. **Freie/benutzerdefinierte Spiele**
   - Einfache Textkarte (Titel + Anleitung), ohne besondere Interaktionslogik, für alles, was sich nicht in
     obige Typen einordnen lässt.

- FR-10: Der Katalog an Spieltypen ist eine Erweiterung des Systems, nicht abschließend – neue Spieltypen
  können später ergänzt werden (technische Erweiterbarkeit, kein v1-Muss).

### 3.4 Spielergebnisse & Rating/Leaderboard

- FR-11: Nach jeder gespielten Runde kann erfasst werden, wer gewonnen hat (Spieler A, Spieler B oder
  Unentschieden), optional mit Punktestand/Zusatzinfo.
- FR-12: Es gibt eine Gesamtübersicht/Leaderboard: Siege pro Person, gesamt und aufgeschlüsselt nach Spiel.
- FR-13: Ein Verlauf (Historie) aller gespielten Runden ist einsehbar (Datum, Spiel, Ergebnis).

### 3.5 Medien/Uploads

- FR-14: Bilder (Urlaubsfotos, Hundefotos, Gegenstände) können pro Spiel/Runde hochgeladen und gespeichert
  werden.
- FR-15: Hochgeladene Bilder bleiben dem jeweiligen Spiel/Eintrag dauerhaft zugeordnet, damit Fragen
  (z. B. "wo/wann war das?") wiederverwendet werden können.

## 4. Nicht-funktionale Anforderungen

- NFR-1: Responsives Design (Nutzung auch auf Smartphone/Tablet für gemeinsames Spielen auf der Couch).
- NFR-2: Alle Daten (Spiele, Bilder, Ergebnisse) müssen dauerhaft gespeichert werden (Neuladen der Seite
  darf keine Daten verlieren).
- NFR-3: Einfache, verständliche Bedienung ohne Anleitung nötig (Fokus auf Spielspaß, nicht Admin-Aufwand).
- NFR-4: Keine sensiblen Daten Dritter; Nutzung ausschließlich privat zu zweit, kein öffentlicher Zugriff
  nötig (v1: kein Login/Auth erforderlich, aber Datenzugriff sollte nicht öffentlich im Netz einsehbar sein).
- NFR-5: Performance: Rad-Animation soll flüssig laufen auch bei größerer Anzahl Spiele (>15 Segmente).

## 5. Datenmodell (grober Entwurf)

- **Spiel** (id, titel, beschreibung, typ, aktiv, farbe/icon, erstellt_am)
- **Spieltyp** (urlaubsbilder | hundebilder | stuttgart_quiz | durak | preisschaetzen | fussball_quiz | frei)
- **Medien** (id, spiel_id, bild, metadaten je Typ z. B. tatsächlicher_ort, tatsächliches_datum,
  tatsächlicher_preis, tatsächliches_ergebnis)
- **Spieler** (id, name)
- **Runde/Ergebnis** (id, spiel_id, datum, gewinner_spieler_id oder unentschieden, notiz)

## 6. Technische Rahmenbedingungen (Annahmen, offen zu bestätigen)

- Umsetzung als statische Webseite (HTML/CSS/JavaScript), lauffähig im Browser ohne eigenen Server.
- Datenhaltung clientseitig (z. B. Browser-Storage) für v1, ohne Backend/Datenbank – ausreichend für
  private Nutzung auf einem gemeinsam genutzten Gerät/Browser.
- Kein Nutzer-Login, da feste 2-Personen-Nutzung.
- Bilder werden lokal im Browser gespeichert bzw. eingebettet (kein externer Bild-Hosting-Dienst in v1).

## 7. Erweiterbarkeit

- ER-1: Neue Spiele (auch neue Spieltypen) sollen ohne Codeänderung durch die Nutzer:innen ergänzbar sein,
  soweit es sich um "freie" Spiele handelt.
- ER-2: Neue strukturierte Spieltypen (mit eigener Logik wie Ranking, Preisschätzen etc.) können später als
  Erweiterung des Systems hinzugefügt werden.

## 8. Abgrenzung (Out of Scope für v1)

- Keine Mehrgeräte-Synchronisation/Cloud-Speicherung.
- Kein öffentliches Teilen/Mehrbenutzerbetrieb über die eigene Beziehung hinaus.
- Keine automatische Datenermittlung (z. B. echte Fußballergebnisse via API) – Eingabe erfolgt manuell.

## 9. Entscheidungen (vormals offene Fragen)

1. **Speicherung:** Rein lokale Speicherung im Browser (kein Backend, keine Geräte-Synchronisation) –
   ausreichend für die private Nutzung zu zweit auf einem gemeinsam genutzten Gerät.
2. **Bilder:** Werden ebenfalls lokal im Browser gespeichert (kein externer Bild-Hosting-Dienst).
3. **Wiederholungslogik:** Kürzlich gespielte Spiele werden für die nächsten paar Drehungen mit reduzierter
   Wahrscheinlichkeit erneut ausgewählt, um Abwechslung zu fördern (siehe FR-5).
4. **Scoring-Modell:** Pro Runde wird nur der Sieger bzw. die Siegerin oder ein Unentschieden erfasst
   (kein detaillierter Punktestand je Spiel in v1, siehe FR-11).
