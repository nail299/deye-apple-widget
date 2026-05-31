# ☀️ Deye Solar Inverter Apple Widget (iOS/iPadOS/macOS)

<p align="center">
  <img src="deye-apple-widget.png" alt="Vorschau des Widgets" width="300"/>
</p>

Mit diesem Scriptable-Skript kannst du die Live-Leistung und die Ertragsdaten deines Deye-Wechselrichters (z. B. Deye SUN600G3-EU-230 oder kompatible Balkonkraftwerk-Inverte wie z.B. den BOSSWERK 600) direkt als natives, kompaktes Widget auf deinem Apple-Schreibtisch (macOS) oder Homescreen (iOS/iPadOS) anzeigen lassen.

Das Widget läuft im **Small-Format** (quadratisch) und bietet ein intelligentes Caching: Falls der Wechselrichter nachts oder bei schlechtem Wetter offline geht, stürzt das Widget nicht ab, sondern zeigt elegant die letzten bekannten Tages- und Gesamtwerte aus einer lokalen Datei an, während die aktuelle Leistung auf `0 W` gesetzt wird.

**Dargestellte Daten:**
* Aktuelle Produktion in Watt
* Tagesproduktion (Summe)
* Gesamtproduktion (Wechselrichter-Summe)
* Zeitpunkt der letzten Datenaktualisierung
* RSSI-Signalstärke (engl. *Received Signal Strength Indicator*) des Wechselrichters in Prozent

---

## 📦 Voraussetzungen (Deye)

| Komponente | Details |
| :--- | :--- |
| **Wechselrichter** | Ein Deye-Inverter (oder kompatibel) mit integriertem WLAN-Logger (erreichbar über die lokale IP-Adresse im selben Netzwerk). |
| **Zugangsdaten** | Benutzername und Passwort für die Weboberfläche des Wechselrichters (Standard oft `admin` / `admin`). |
| **Apple-Gerät** | Ein iPhone, iPad oder Mac im selben WLAN-Netzwerk wie der Wechselrichter. |
| **App** | Die kostenlose App **Scriptable** aus dem App Store. |

---

## 🛠 Schritt-für-Schritt Einrichtung (Deye)

1. **IP-Adresse herausfinden:** Stelle sicher, dass dein Deye-Wechselrichter eingeschaltet ist. Finde seine lokale IP-Adresse in deinem Router heraus (z. B. `192.168.178.50`). Tippe diese IP in einen Browser ein, um zu prüfen, ob du auf die Status-Webseite des Inverters gelangst.
2. **Scriptable vorbereiten:** Öffne die App **Scriptable** auf deinem Apple-Gerät und erstelle über das **+** Symbol oben rechts ein neues, leeres Skript. Nenne es z. B. `Deye-Inverter`.
3. **Code einfügen:** Kopiere den kompletten JavaScript-Code aus der Datei `widget-deye-inverter-DE.js` hier aus GitHub und füge ihn in das leere Skript in der App ein.
4. **Konfiguration anpassen:** Passe ganz oben im Code im Block `1. BENUTZER-EINSTELLUNGEN` deine Daten an:
```javascript
   const DEYE_IP = "192.168.XXX.XXX"; // Die IP deines Inverters
   const USER = "DEIN_BENUTZERNAME";   // Dein Web-Login (meist admin)
   const PASS = "DEIN_PASSWORT";       // Dein Web-Passwort
```
### 📲 Widget platzieren

Gehe auf deinen Homescreen oder Schreibtisch, füge ein neues **Scriptable-Widget** hinzu, wähle zwingend die Größe **Klein (Small)**, halte das Widget gedrückt, wähle **„Widget bearbeiten“** und weise das eben erstellte Skript zu.

---

## 🛡️ Sicherheit & Privatsphäre (Deye)

Da dieses Skript lokal auf deinem Apple-Gerät ausgeführt wird und deine Zugangsdaten im Quellcode hinterlegt sind, gelten folgende Sicherheitsaspekte:

* **Lokale Verschlüsselung durch Apple:** Deine Zugangsdaten liegen ausschließlich im lokalen Speicher deines iPhones, iPads oder Macs. Durch das Sandbox-System von iOS sind die Skript-Inhalte vor dem Zugriff anderer Apps geschützt und werden innerhalb deines iCloud-Backups verschlüsselt übertragen.
* **Kein Cloud-Zwang:** Die Daten werden über dein lokales Netzwerk per HTTP-Basic-Authentication direkt vom Wechselrichter abgefragt. Es werden keine Daten an externe Server oder Drittanbieter übermittelt.
* **Zugriff von außen NUR über VPN:** Wenn du auch von unterwegs (außerhalb deines Heim-WLANs) Live-Daten sehen möchtest, richte **keine** Portfreigabe in deinem Router ein! Das wäre ein massives Sicherheitsrisiko, da die Verbindung unverschlüsselt (HTTP) erfolgt. Nutze stattdessen eine sichere VPN-Verbindung (z. B. WireGuard oder das VPN deiner Fritz!Box), um dich von unterwegs sicher in dein Heimnetzwerk einzuwählen. Nur so kann das Widget den Inverter auch mobil verschlüsselt erreichen.

---

## ❓ FAQ & Fehlerbehebung (Deye)

### Das Widget zeigt nur grauen Text / "(Cache)" an – was ist die Ursache?

Wenn die Werte im Widget grau gefärbt sind und in der Fußzeile das Wort `(Cache)` steht, bedeutet das, dass das Skript keine Live-Daten vom Wechselrichter abrufen kann und die alten Daten zur Sicherheit einfriert.
Dafür gibt es drei mögliche Ursachen:

1.  **Es ist nachts oder bewölkt:** Deye-Wechselrichter werden direkt durch die Solarmodule mit Strom versorgt. Sobald keine Sonne mehr scheint, schaltet sich der interne WLAN-Logger des Inverters komplett ab. Das ist absolut normal! Das Widget sichert deine Daten, setzt die aktuelle Leistung auf `0 W` und schaltet am nächsten Morgen automatisch wieder auf **Grün (🟢)** und Live-Betrieb, sobald die Sonne aufgeht.
2.  **Falsches WLAN-Netzwerk:** Da der Wechselrichter über seine lokale IP-Adresse abgefragt wird, funktioniert die Live-Abfrage nur, wenn sich dein iPhone/Mac im **selben Heim-WLAN** befindet. Wenn du unterwegs im mobilen Datennetz (LTE/5G) bist, ohne mit deinem Heim-VPN verbunden zu sein, oder dich in einem separaten Gast-WLAN befindest, kann das Skript den Inverter nicht erreichen und schaltet in den Cache-Modus.
3.  **Falsche Zugangsdaten oder IP:** Überprüfe die Variablen `DEYE_IP`, `USER` und `PASS` ganz oben im Skript. Wenn sich die IP-Adresse des Inverters durch den Router geändert hat oder das Passwort falsch ist, schlägt der Login fehl. 
    * *Tipp zur Lösung:* Vergib im Router eine **"feste IP-Adresse"** für den Wechselrichter.

### Wie passe ich den Namen im Widget an?

Ganz oben im Code findest du die Variable:

```javascript
const WIDGET_TITLE = "☀️ DEYE 600";
```
Du kannst den Text in den Anführungszeichen völlig frei verändern (z. B. in "Balkonkraftwerk" oder "Deye 800").
