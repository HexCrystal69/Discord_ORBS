# 🌌 Discord ORBS: Automated Discord Quests Completer

![Discord Orbs Banner](discord-launches-orbs-to-reward-users-through-quests_l1200.jpg)

An advanced, client-side automation utility for Discord, designed to automatically complete active **Discord Quests** directly from the developer console of the Discord application or web browser. 

Through Webpack chunk extraction, these scripts dynamically mock running games, streaming activity, video playback, and active voice calls to fulfill the parameters of active Discord Quests in minutes—without installing or playing any actual games.

---

## 🚀 Key Features

*   **⚡ All-in-One Automation**: Automatically detects and completes multiple types of tasks, including game play-time, stream time, watching promotional videos, and voice channel activity.
*   **🔄 Queue-Based Processing ([orbs-1.js](file:///d:/Mini/Discord_ORBS/orbs-1.js))**: Automatically iterates through all enrolled, uncompleted, and unexpired quests in a queue, finishing them one by one without user intervention.
*   **🛠️ Robust Module Selector Fallbacks ([orbs-1.js](file:///d:/Mini/Discord_ORBS/orbs-1.js))**: Features robust error-handling for Discord client updates, automatically switching between fallback exports paths (`Z`/`A`, `ZP`/`Ay`, etc.) to locate Webpack modules.
*   **🛡️ Lightweight & Native**: Written in vanilla JavaScript with zero external dependencies. It hooks directly into the running Discord client's active states.

---

## 📂 File Comparison

This repository provides two implementations:

| Feature | 🌟 [orbs-1.js](file:///d:/Mini/Discord_ORBS/orbs-1.js) (Recommended) | [orbs-2.js](file:///d:/Mini/Discord_ORBS/orbs-2.js) (Legacy/Simple) |
| :--- | :--- | :--- |
| **Multi-Quest Processing** | **Yes** (Iterates sequentially through all available quests) | **No** (Processes only the first found quest) |
| **Webpack Resiliency** | **High** (Implements dynamic fallback checks for updated module layouts) | **Low** (Static selectors; will break if Discord updates internal variables) |
| **Video Progress Loop** | Enhanced timing and retry validation checks | Simple sequential intervals |
| **Target Audience** | Users with multiple active quests looking for a robust solution | Single-quest scenarios / Reference code |

---

## 🛠️ How It Works (Technical Architecture)

These scripts intercept the internal state of Discord's React/Flux architecture. They achieve this using client-side scripting and browser DevTools:

### 1. Webpack Chunk Hijacking
To access Discord's private stores, the script pushes a dummy chunk containing a callback symbol to the global `webpackChunkdiscord_app` array. The third argument of this callback is Webpack's module resolver `r`:
```javascript
let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
webpackChunkdiscord_app.pop();
```
With `wpRequire` extracted, the script scans the internal module cache (`wpRequire.c`) to locate core Discord modules:
*   `QuestsStore`: Retrieves information about current quest enrollment, progress, and configs.
*   `RunningGameStore`: Manages detection of active games.
*   `ApplicationStreamingStore`: Controls video streaming metadata for voice channels.
*   `ChannelStore` & `GuildChannelStore`: Provides access to private channels and guilds.
*   `FluxDispatcher`: Coordinates communication and dispatches fake events to trigger UI state updates.
*   `api`: Performs HTTP requests utilizing Discord's internal credentials and headers.

### 2. Task Spoofing Mechanics

Depending on the quest's required task, a specific mechanism is executed:

#### 📺 Watch Video (`WATCH_VIDEO` / `WATCH_VIDEO_ON_MOBILE`)
The script identifies the video length requirement, calculates the progress needed, and issues simulated progress HTTP POST requests directly to:
`/quests/{quest_id}/video-progress`
It spoofs video progression intervals in the background, updating Discord servers until the API reports the quest as complete.

#### 🎮 Play Game (`PLAY_ON_DESKTOP`)
In the Discord Desktop application, the script overrides the internal game detection stores:
*   Temporarily hooks `RunningGameStore.getRunningGames` and `RunningGameStore.getGameForPID` to return a mocked game descriptor matching the quest's game ID.
*   Dispatches a `RUNNING_GAMES_CHANGE` action via the `FluxDispatcher`.
*   Subscribes to the `QUESTS_SEND_HEARTBEAT_SUCCESS` dispatcher action to monitor progression until completion, then restores the original store functions.

#### 📹 Stream Game (`STREAM_ON_DESKTOP`)
The script mocks game streaming in a Voice Channel:
*   Hooks `ApplicationStreamingStore.getStreamerActiveStreamMetadata` to report that the target quest game is being streamed.
*   Monitors progress updates and restores the original function when the target duration is reached.
*   *Note: This requires you to be in a voice channel with at least one other participant.*

#### 🎙️ Play Activity (`PLAY_ACTIVITY`)
The script locates your first private DM channel or vocal guild channel, establishes a stream key representation (`call:channel_id:1`), and broadcasts periodic heartbeat POST requests to:
`/quests/{quest_id}/heartbeat`
It continues sending heartbeats every 20 seconds, updating progress, and finishes by sending a terminal heartbeat when target duration is achieved.

---

## 📖 Instructions for Use

### Prerequisites
1. Open your Discord App (Desktop) or Discord Web in a browser.
2. Navigate to **User Settings > Gift Inventory / Quests** and make sure you have **Enrolled** (clicked "Accept Quest") in the quests you wish to complete.

### Step 1: Open Developer Console
*   **Discord Web**: Press `F12` or `Ctrl + Shift + I` (Windows/Linux) / `Cmd + Option + I` (macOS) and switch to the **Console** tab.
*   **Discord Desktop App**: 
    To open Developer Tools in the official Discord Desktop Client, you need to enable it via Discord's local configuration file (`settings.json`):
    1. Close Discord completely (ensure it is closed from the system tray/task manager).
    2. Locate the `settings.json` file on your system:
       *   **Windows**: Press `Win + R`, type `%appdata%\discord` and press `Enter`.
       *   **macOS**: Open Finder, press `Cmd + Shift + G`, and paste `~/Library/Application Support/discord`.
       *   **Linux**: Check `~/.config/discord`.
    3. Open `settings.json` in a text editor (e.g., Notepad, VS Code) and add or modify the `"DANGEROUS_ENABLE_DEVTOOLS_ONLY_ENABLE_IF_YOU_KNOW_WHAT_YOURE_DOING"` key to `true`. Alternatively, you can replace the contents of the file with the following configuration:
       ```json
       {
         "IS_MAXIMIZED": true,
         "IS_MINIMIZED": false,
         "WINDOW_BOUNDS": {
           "x": 112,
           "y": 60,
           "width": 1284,
           "height": 724
         },
         "DANGEROUS_ENABLE_DEVTOOLS_ONLY_ENABLE_IF_YOU_KNOW_WHAT_YOURE_DOING": true,
         "MIN_WIDTH": 940,
         "MIN_HEIGHT": 500,
         "chromiumSwitches": {}
       }
       ```
    4. Save the file and restart Discord.
    5. Press `Ctrl + Shift + I` (or `Cmd + Option + I` on macOS) inside the desktop app to open Developer Tools.
    6. Switch to the **Console** tab.
    7. *Note: Discord may show a security warning when pasting code. If prompted, type `allow pasting` in the console prompt to unlock pasting.*

### Step 2: Run the Script
1. Copy the entire contents of [orbs-1.js](file:///d:/Mini/Discord_ORBS/orbs-1.js).
2. Paste it into the Discord console.
3. Press `Enter`.

### Step 3: Monitor Progress
*   The script prints detailed logs in the console showing which quest it is actively spoofing.
*   It logs progress status updates (e.g., `Quest progress: 120/900`).
*   Once finished, you can claim your rewards from the **Gift Inventory** tab.

---

## ⚠️ Important Disclaimer & Warnings

> [!WARNING]
> **Terms of Service Violation**
> Using these scripts violates the **Discord Terms of Service (ToS)**. While bans are rare for console-based quest spoofers, there is always an inherent risk of account action or suspension by Discord. Use this software at your own risk.

> [!CAUTION]
> **Self-XSS Warning**
> Never paste code into your Discord console that you do not understand. Malicious code can steal your Discord authorization token (`Token Grabbers`) and compromise your entire account. **Always review source code like [orbs-1.js](file:///d:/Mini/Discord_ORBS/orbs-1.js) or [orbs-2.js](file:///d:/Mini/Discord_ORBS/orbs-2.js) before executing it.**
