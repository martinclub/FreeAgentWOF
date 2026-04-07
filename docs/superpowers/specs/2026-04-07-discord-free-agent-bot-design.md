# Design Spec: Discord Free Agent Bot

A Discord bot that manages a dynamic list of "Free Agents" in a dedicated channel. Players can add themselves to the list or announce that they've found a team through interactive buttons.

## 1. Purpose & Scope
The bot provides a centralized, automated way for players to signal they are looking for a team and for teams to find available players. It maintains a single, always-at-the-bottom message in a dedicated channel.

## 2. Architecture
- **Platform:** Node.js with `discord.js` (v14).
- **Storage:** Local JSON file (`data/free-agents.json`) to persist the list across restarts.
- **Interactions:** Uses Button components and Modals for user input.

## 3. Core Components

### 3.1 State Manager
- Reads/writes to `free-agents.json`.
- Structure: `{ "agents": [ { "id": "userId", "username": "name", "timestamp": "ISO-date" } ] }`.

### 3.2 UI Generator
- Constructs an Embed with:
  - Title: **Free Agents**
  - Description: "Current players available and looking for a team! ⚽"
  - Field: **Current Free Agents** (Mentions of all players in the list).
  - Footer: Instructions for teams to DM players.
- Adds an Action Row with two buttons:
  - `🔍 Looking for Team` (Style: Success/Green, ID: `btn_join`)
  - `🤝 I found a team` (Style: Secondary/Gray, ID: `btn_leave`)

### 3.3 Event Listeners
- **Button: Join (`btn_join`)**
  - Checks if user is already in the list.
  - If not, adds them and updates the main message.
  - Sends a public announcement: `"@Player is now a Free Agent! 🚀"`.
- **Button: Leave (`btn_leave`)**
  - If the user is in the list, opens a **Modal**.
  - **Modal Input:** "Which team did you join?"
  - **On Modal Submit:** 
    - Removes user from the list.
    - Updates the main message.
    - Sends a public announcement: `"@Player found a team! They joined [Team Name]! 🏆"`.

## 4. Maintenance & Reliability
- **Initialization:** A `/setup` slash command to post the initial message in the current channel.
- **Channel Exclusivity:** The bot assumes it is in a dedicated channel. Whenever it updates the list, it deletes its previous message and sends a new one to ensure it stays at the bottom.
- **Error Handling:** Basic permission checks (Send Messages, Manage Messages, Embed Links).

## 5. Success Criteria
- The list accurately reflects current free agents.
- Announcements are sent correctly when players join or leave.
- The interface is clean and matches the approved mockups.
