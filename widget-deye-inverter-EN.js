// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: sun;

// ====================================================================
// CREATOR CREDITS & LICENSE
// ====================================================================
// Script:      Deye Solar Inverter Apple Widget (EN)
// Description: Displays live power, daily and total yield from local Deye inverters.
// Author:      nail299
// Repository:  https://github.com/nail299/deye-apple-widget/
// License:     MIT License (c) 2026 nail299
// ====================================================================

// ====================================================================
// 1. USER SETTINGS (Please adjust your credentials here)
// ====================================================================

const DEYE_IP = "192.168.XXX.XXX";      // Local IP of your Deye inverter
const USER = "YOUR_USERNAME";           // Default: admin
const PASS = "YOUR_PASSWORD";           // Default: admin
const WIDGET_TITLE = "☀️ DEYE 600";      // Desired name in widget display

const REFRESH_INT = 300;                // Cache period for iOS in seconds (5 min)

// ====================================================================
// MAIN EXECUTION
// ====================================================================
const URL = "http://" + DEYE_IP + "/status.html";

let widget = await createWidget();
widget.backgroundColor = new Color("#1e293b"); // Dark slate background

if (!config.runsInWidget) {
    // Shows the small widget preview when running inside the app
    await widget.presentSmall();
}
Script.setWidget(widget);
Script.complete();

// ====================================================================
// WIDGET UI DESIGNER
// ====================================================================
async function createWidget() {
    // Setup FileManager for local data caching
    let fm = FileManager.local();
    let dir = fm.documentsDirectory();
    let path = fm.joinPath(dir, "scriptable-deye.json");
    
    const list = new ListWidget();
    list.setPadding(12, 12, 12, 12);
    
    let data;
    let fresh = 0;
    
    try {
        // Try fetching live data from the inverter
        data = await getData();
        
        // Save data to file for offline access (e.g. at night)
        fm.writeString(path, JSON.stringify(data, null, 2));
        fresh = 1;
    } catch (err) {
        // On error (offline/night): Try loading cached data
        if (fm.fileExists(path)) {
            data = JSON.parse(fm.readString(path));
            // Set current production to 0 since inverter is offline
            data.current = 0; 
            console.log("Inverter offline or unreachable. Using cache.");
        } else {
            // Absolute fallback if no cache exists yet
            data = { current: 0, today: 0.0, total: 0.0, rssi: "N/A" };
        }
    }
    
    // --- TITLE ROW ---
    let titleStack = list.addStack();
    const title = titleStack.addText(WIDGET_TITLE);
    title.font = Font.boldSystemFont(12);
    if (fresh === 1) {
        title.textColor = new Color("#94a3b8");
    } else {
        title.textColor = new Color("#64748b");
    }
    titleStack.addSpacer();
    
    // Status dot (Green = Live / Gray = Offline Cache)
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
    
    list.addSpacer(); // Pushes the main block to the center
    
    // --- MAIN BLOCK: CURRENT POWER (Left-aligned) ---
    let nowStack = list.addStack();
    nowStack.layoutVertically();
    
    let nowLabel = nowStack.addText("Now");
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
    
    list.addSpacer(); // Pushes the main block from the center
    
    // --- GRID FOR YIELD DATA (Side by side) ---
    let gridStack = list.addStack();
    
    // Left column: Daily yield
    let todayStack = gridStack.addStack();
    todayStack.layoutVertically();
    const todayLabel = todayStack.addText("Today");
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
    
    // Right column: Total yield (directly from inverter data)
    let totalStack = gridStack.addStack();
    totalStack.layoutVertically();
    const totalLabel = totalStack.addText("Total");
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
    
    // --- FOOTER: TIMESTAMP & RSSI ---
    let footerStack = list.addStack();
    
    let footerText = "Updated: ";
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
    
    // If live, display Wi-Fi signal (RSSI) at the bottom right
    if (fresh === 1) {
        if (data.rssi && data.rssi !== "N/A") {
            footerStack.addSpacer();
            const rssiLabel = footerStack.addText("📶 " + data.rssi);
            rssiLabel.font = Font.systemFont(8);
            rssiLabel.textColor = Color.white();
        }
    }
    
    // Define refresh interval for iOS
    let nextRefresh = new Date();
    nextRefresh.setSeconds(nextRefresh.getSeconds() + REFRESH_INT);
    list.refreshAfterDate = nextRefresh;
    
    return list;
}

// ====================================================================
// DATA RETRIEVER & PARSER (HTTP Request & Regex)
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
        throw new Error("Empty response from inverter");
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
            total: parseFloat(total_e[1]).toFixed(1), // Returns actual rounded total value
            rssi: rssi ? rssi[1] : "N/A"
        };
    } else {
        throw new Error("Parsing error in HTML source");
    }
}
