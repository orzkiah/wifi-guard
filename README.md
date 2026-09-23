# WiFi Guard 🛡️

**WiFi Guard** is a professional desktop application designed to monitor devices connected to a local Wi-Fi network, detect unrecognized or new devices, manage trusted device whitelists, inspect real-time connection bandwidth/rates, and allow network administrators to block or unblock devices using the router's official MAC Filtering administration features.

Built from the ground up with a modular **Router Adapter Architecture**, WiFi Guard initially targets the **FiberHome HG6145D2** (Firmware RP3478) GPON ONT gateway while remaining ready for commercial expansion to TP-Link, Huawei, ZTE, MikroTik, and OpenWrt routers.

---

## 🎯 Key Features

1. **Automatic Gateway Discovery**: Detects the host OS's default gateway routing table automatically (e.g., `192.168.1.1`).
2. **Real-Time Wi-Fi Station Monitoring**: Separates and displays active stations across **2.4 GHz** and **5 GHz** frequency bands with physical receiving rates.
3. **Dual-List Client Merging**: Merges Wi-Fi association tables and DHCP lease tables into a unified device inventory by normalized MAC address.
4. **Unknown / New Device Detection**: Automatically marks new devices as `UNKNOWN`, displays prominent warning banners on the dashboard, and emits native OS desktop notifications.
5. **Trusted Device Whitelisting**: Allows naming and whitelisting family and approved devices (e.g., `HP Rizki`).
6. **Router MAC Filtering Blacklist Integration**: Adds or removes rogue devices from the FiberHome router's native MAC blacklist via official CGI administration.
7. **Self-Lockout Protection**: Automatically identifies all MAC addresses of the host machine running WiFi Guard and strictly prevents the administrator from accidentally blacklisting themselves.
8. **Security-First Credential Handling**: Encrypts and saves credentials via Electron's native `safeStorage` (Windows DPAPI keychain). Never logs plaintext passwords or session cookies.
9. **Controlled Polling Loop**: Single background polling loop with exponential backoff if the router is rebooting or unreachable.
10. **Offline / Mock Adapter Mode**: Includes `MockRouterAdapter` with realistic device scenarios, enabling UI development and offline demonstration without physical router access.

---

## 🏗️ Architecture Overview

```
src/
├── main/                           # Electron Main Process (Node.js)
│   ├── database/
│   │   └── db.ts                   # SQLite database (better-sqlite3) & repositories
│   ├── ipc/
│   │   └── handlers.ts             # Strongly-typed IPC handlers
│   ├── router/
│   │   ├── RouterAdapter.ts        # Generic RouterAdapter interface
│   │   ├── MockRouterAdapter.ts    # Full mock adapter with simulated devices
│   │   ├── FiberHomeHG6145D2Adapter.ts # Real FiberHome CGI + AES adapter
│   │   └── discovery/
│   │       └── GatewayDiscovery.ts # OS routing table default gateway detector
│   ├── services/
│   │   ├── MacService.ts           # MAC normalization, validation & vendor OUI
│   │   ├── SelfBlockService.ts     # Self-lockout prevention engine
│   │   ├── DeviceDiscoveryService.ts # Dual-source merging & polling engine
│   │   └── SecurityService.ts      # safeStorage OS credential encryption
│   └── index.ts                    # Main process window lifecycle
├── preload/
│   └── index.ts                    # ContextBridge safe API (window.wifiGuard)
├── renderer/                       # React 18 Frontend
│   ├── components/
│   │   ├── Sidebar.tsx             # Main navigation
│   │   ├── TopBar.tsx              # Status bar, latency, and sync action
│   │   ├── DeviceDetailDrawer.tsx  # Slide-out device inspector
│   │   ├── BlockConfirmModal.tsx   # Safe preview & confirmation dialog
│   │   └── LoginModal.tsx          # Gateway auth & connection test modal
│   ├── views/
│   │   ├── DashboardView.tsx       # Security metrics & frequency distribution
│   │   ├── DevicesView.tsx         # Full device table with search & filters
│   │   ├── BlockedView.tsx         # Blacklisted devices manager
│   │   ├── TrustedView.tsx         # Verified whitelist view
│   │   ├── HistoryView.tsx         # Auditable event timeline
│   │   ├── RouterView.tsx          # Router diagnostics & MAC filter status
│   │   └── SettingsView.tsx        # Polling intervals, alerts, theme, and mock toggle
│   ├── stores/
│   │   └── useAppStore.ts          # Zustand global reactive state
│   ├── App.tsx                     # Top-level layout
│   ├── main.tsx                    # React DOM entry
│   └── index.css                   # Tailwind CSS base styles
└── shared/
    └── types/
        ├── device.ts               # Device, DeviceBand, DeviceEvent types
        ├── router.ts               # RouterInfo, WifiClient, DhcpClient, Typed Errors
        ├── ipc.ts                  # WiFiGuardAPI contracts & AppSettings
        └── commercial.ts           # Interfaces for Licensing, FeatureFlags, Updates
```

---

## 🛠️ Technologies Used

- **Desktop Framework**: Electron 34
- **Language**: TypeScript 5.7
- **Frontend**: React 18
- **Build / Bundler**: Vite 6 + `vite-plugin-electron`
- **Styling**: Tailwind CSS 3.4
- **Icons**: Lucide React
- **State Management**: Zustand 5
- **Local Database**: SQLite (`better-sqlite3`)
- **Cryptography**: Native Node.js `crypto` (AES-128-CBC with PKCS7 padding)
- **Unit Testing**: Vitest 3

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: Version 20+ (Tested on Node.js v26)
- **npm**: Version 10+
- **Platform**: Windows 10/11 (macOS / Linux also supported)

### 2. Installation
Open PowerShell in the project directory and install dependencies:
```powershell
npm install
```

### 3. Run Development Mode
Launch the application with live-reloading:
```powershell
npm run dev
```

### 4. Run Automated Unit Tests
Run the test suite covering MAC normalization, device merging, self-lockout prevention, and mock adapter operations:
```powershell
npm run test
```

### 5. Build Windows Executable
Create the production binary / installer in the `release/` directory:
```powershell
npm run build:win
```

---

## 🔒 Security & Safety Guarantees

1. **No Cloud Dependencies**: WiFi Guard is 100% local-first. Device records and router metrics remain strictly inside the local SQLite database.
2. **Self-Lockout Protection**: `SelfBlockService` inspects the machine's active MAC addresses. Any call to block the host PC is blocked immediately before reaching the router.
3. **Read-First Principle**: Polling and device identification are 100% read-only.
4. **Explicit User Confirmation**: No router configuration change (such as adding a MAC to the blacklist) is ever performed automatically without an explicit user confirmation modal.
5. **No Dangerous Attack Tools**: WiFi Guard uses only the official web administration interface provided by the router vendor. It does not employ ARP poisoning, Wi-Fi jamming, or packet injection.

---

## 📡 FiberHome HG6145D2 Protocol Details

- **Device Signature**: `GET /cgi-bin/ajax?ajaxmethod=get_device_name`
- **Operator Verification**: `GET /cgi-bin/ajax?ajaxmethod=get_operator`
- **Authentication Handshake**: `GET /cgi-bin/ajax?ajaxmethod=get_acs_random` returns a 29-character seed. The 16-byte AES key and IV are computed via `seed.substring(6).slice(0, -7)`. Password payload is encrypted via AES-128-CBC and submitted to `POST /cgi-bin/ajax?ajaxmethod=do_login`.
- **Client Discovery**: Scraped and parsed from `/html/wifi_list_inter.html` and `/html/dhcp_user_list_inter.html`.
- **MAC Filter Control**: Managed via `POST /cgi-bin/ajax?ajaxmethod=set_mac_filter`.
