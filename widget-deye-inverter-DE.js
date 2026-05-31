// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: sun;

// ====================================================================
// CREATOR CREDITS & LICENSE
// ====================================================================
// Script:      Deye Solar Inverter Apple Widget (DE)
// Description: Displays live power, daily and total yield from local Deye inverters.
// Author:      nail299
// Repository:  https://github.com/nail299/deye-apple-widget/
// License:     MIT License (c) 2026 nail299
// ====================================================================

// ====================================================================
// 1. BENUTZER-EINSTELLUNGEN (Bitte hier deine Daten anpassen)
// ====================================================================

const DEYE_IP = "192.168.XXX.XXX";       // Lokale IP deines Deye-Wechselrichters
const USER = "DEIN_BENUTZERNAME";       // Standard: admin
const PASS = "DEIN_PASSWORT";           // Standard: admin
const WIDGET_TITLE = "☀️ DEYE 600";       // Gewünschter Name im Widget Display

const REFRESH_INT = 300;                // Cache-Zeitraum für iOS in Sekunden (5 Min)

// ====================================================================
// HAUPTPROGRAMM (Main Execution)
// ====================================================================
const URL = "http://" + DEYE_IP + "/status.html";

let widget = await createWidget();
widget.backgroundColor = new Color("#1e293b"); // Anthrazit-Hintergrund

if (!config.runsInWidget) {
    // Zeigt beim Ausführen in der App direkt die Vorschau im Quadratformat (Small)
    await widget.presentSmall();
}
Script.setWidget(widget);
Script.complete();

// ====================================================================
// WIDGET UI DESIGNER
// ====================================================================
async function createWidget() {
    // FileManager für lokales Datei-Caching einrichten
    let fm = FileManager.local();
    let dir = fm.documentsDirectory();
    let path = fm.joinPath(dir, "scriptable-deye.json");
    
    const list = new ListWidget();
    list.setPadding(12, 12, 12, 12);
    
    let data;
    let fresh = 0;
    
    try {
        // Versuche Daten live vom Wechselrichter abzurufen
        data = await getData();
        
        // Daten in Datei speichern für Offline-Zugriff (z.B. nachts)
        fm.writeString(path, JSON.stringify(data, null, 2));
        fresh = 1;
    } catch (err) {
        // Bei Fehler (Offline/Nacht): Versuche, gespeicherte Daten zu laden
        if (fm.fileExists(path)) {
            data = JSON.parse(fm.readString(path));
            // Aktuelle Produktion auf 0 setzen, da der WR offline ist
            data.current = 0; 
            console.log("Wechselrichter offline oder nicht erreichbar. Verwende Cache.");
        } else {
            // Absoluter Fallback, falls noch kein Cache existiert
            data = { current: 0, today: 0.0, total: 0.0, rssi: "N/A" };
        }
    }
    
    // --- TITEL-ZEILE ---
    let titleStack = list.addStack();
    const title = titleStack.addText(WIDGET_TITLE);
    title.font = Font.boldSystemFont(12);
    if (fresh === 1) {
        title.textColor = new Color("#94a3b8");
    } else {
        title.textColor = new Color("#64748b");
    }
    titleStack.addSpacer();
    
    // Status-Punkt (Grün = Live / Grau = Offline-Cache)
    let statusDotText = "○";
    if (fresh === 1) {
        statusDotText = "●";
    }
    let statusDot = titleStack.addText(statusDotText);
    statusDot.font = Font.systemFont(12);
    if (fresh === 1) {
        statusDot.textColor = new Color("#22c55e");
    } else {
        statusDot.textColor = new Color("#64748b");
    }
    
    list.addSpacer(); // Drückt den Hauptblock elastisch in die Mitte
    
    // --- HAUPTBLOCK: AKTUELLE LEISTUNG (Linksbündig) ---
    let nowStack = list.addStack();
    nowStack.layoutVertically();
    
    let nowLabel = nowStack.addText("Aktuell");
    nowLabel.font = Font.systemFont(10);
    if (fresh === 1) {
        nowLabel.textColor = new Color("#94a3b8");
    } else {
        nowLabel.textColor = new Color("#64748b");
    }
    
    nowStack.addSpacer(2);
    
    const currentPowerText = nowStack.addText(data.current + " W");
    currentPowerText.font = Font.boldSystemFont(26);
    if (fresh === 1) {
        currentPowerText.textColor = new Color("#f59e0b");
    } else {
        currentPowerText.textColor = new Color("#64748b");
    }
    
    list.addSpacer(); // Drückt den Hauptblock elastisch aus der Mitte
    
    // --- GRID FÜR ERTRAGSDATEN (Nebeneinander) ---
    let gridStack = list.addStack();
    
    // Linke Spalte: Tagesertrag
    let todayStack = gridStack.addStack();
    todayStack.layoutVertically();
    const todayLabel = todayStack.addText("Tag");
    todayLabel.font = Font.systemFont(9);
    todayLabel.textColor = new Color("#94a3b8");
    
    const todayLine = todayStack.addText(data.today + " kWh");
    todayLine.font = Font.mediumSystemFont(12);
    if (fresh === 1) {
        todayLine.textColor = Color.white();
    } else {
        todayLine.textColor = new Color("#64748b");
    }
    
    gridStack.addSpacer();
    
    // Rechte Spalte: Gesamtertrag (Direkt aus Inverter-Datensatz)
    let totalStack = gridStack.addStack();
    totalStack.layoutVertically();
    const totalLabel = totalStack.addText("Gesamt");
    totalLabel.font = Font.systemFont(9);
    totalLabel.textColor = new Color("#94a3b8");
    
    const totalLine = totalStack.addText(data.total + " kWh");
    totalLine.font = Font.mediumSystemFont(12);
    if (fresh === 1) {
        totalLine.textColor = Color.white();
    } else {
        totalLine.textColor = new Color("#64748b");
    }
    
    list.addSpacer(6);
    
    // --- FUSSZEILE: ZEITSTEMPEL & RSSI ---
    let footerStack = list.addStack();
    
    let footerText = "Update: ";
    const now = new Date();
    footerText += String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
    if (fresh === 0) {
        footerText += " (Cache)";
    }
    
    const timeLabel = footerStack.addText(footerText);
    timeLabel.font = Font.systemFont(8);
    if (fresh === 1) {
        timeLabel.textColor = Color.white();
    } else {
        timeLabel.textColor = new Color("#64748b");
    }
    
    // Wenn live, zeige zusätzlich das WLAN-Signal (RSSI) unten rechts
    if (fresh === 1) {
        if (data.rssi && data.rssi !== "N/A") {
            footerStack.addSpacer();
            const rssiLabel = footerStack.addText("📶 " + data.rssi);
            rssiLabel.font = Font.systemFont(8);
            rssiLabel.textColor = Color.white();
        }
    }
    
    // Refresh-Intervall für iOS definieren
    let nextRefresh = new Date();
    nextRefresh.setSeconds(nextRefresh.getSeconds() + REFRESH_INT);
    list.refreshAfterDate = nextRefresh;
    
    return list;
}

// ====================================================================
// DATA RETRIEVER & PARSER (HTTP-Anfrage & Regex)
// ====================================================================
async function getData() {
    let authRaw = USER + ":" + PASS;
    let authBase64 = Data.fromString(authRaw).toBase64String();
    
    const request = new Request(URL);
    request.method = "GET";
    request.headers = { "Authorization": "Basic " + authBase64 };
    request.timeoutInterval = 15;
    
    const response = await request.loadString();
    
    if (!response || response.trim() === "") {
        throw new Error("Leere Antwort vom Inverter");
    }
    
    const regexNow   = new RegExp("webdata_now_p\\s*=\\s*\"([^\"]+)\"");
    const regexToday = new RegExp("webdata_today_e\\s*=\\s*\"([^\"]+)\"");
    const regexTotal = new RegExp("webdata_total_e\\s*=\\s*\"([^\"]+)\"");
    const regexRssi  = new RegExp("cover_sta_rssi\\s*=\\s*\"([^\"]+)\"");
    
    const now_p   = response.match(regexNow);
    const today_e = response.match(regexToday);
    const total_e = response.match(regexTotal);
    const rssi    = response.match(regexRssi);
    
    if (now_p && today_e && total_e) {
        return {
            current: parseInt(now_p[1]),
            today: parseFloat(today_e[1]),
            total: parseFloat(total_e[1]).toFixed(1), // Gibt den echten Gesamtwert gerundet aus
            rssi: rssi ? rssi[1] : "N/A"
        };
    } else {
        throw new Error("Parsing-Fehler im HTML-Quelltext");
    }
}
