# Discord Free Agent Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Discord bot that manages a dynamic "Free Agents" list in a dedicated channel with interactive buttons and announcements.

**Architecture:** A Node.js application using `discord.js` v14. It uses a local JSON file for state persistence and follows an event-driven pattern for button and modal interactions. The bot maintains a single persistent message in a dedicated channel by deleting the old one and sending a new one on every update.

**Tech Stack:** Node.js, `discord.js`, `dotenv`.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `.env`
- Create: `.gitignore`
- Create: `src/index.js`
- Create: `data/free-agents.json`

- [ ] **Step 1: Initialize package.json**

Run: `npm init -y`

- [ ] **Step 2: Install dependencies**

Run: `npm install discord.js dotenv`

- [ ] **Step 3: Create .env file**

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
CHANNEL_ID=your_channel_id_here
```

- [ ] **Step 4: Create .gitignore**

```text
node_modules
.env
data/*.json
```

- [ ] **Step 5: Create data/free-agents.json**

```json
{
  "agents": []
}
```

- [ ] **Step 6: Commit**

```bash
git add package.json .env .gitignore data/free-agents.json
git commit -m "chore: initial project structure"
```

---

### Task 2: State Manager Implementation

**Files:**
- Create: `src/stateManager.js`
- Test: `tests/stateManager.test.js`

- [ ] **Step 1: Create State Manager**

```javascript
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/free-agents.json');

const stateManager = {
  load() {
    if (!fs.existsSync(DATA_PATH)) return { agents: [] };
    const data = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(data);
  },
  save(state) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(state, null, 2));
  },
  addAgent(user) {
    const state = this.load();
    if (state.agents.some(a => a.id === user.id)) return false;
    state.agents.push({ id: user.id, username: user.username, timestamp: new Date().toISOString() });
    this.save(state);
    return true;
  },
  removeAgent(userId) {
    const state = this.load();
    const initialCount = state.agents.length;
    state.agents = state.agents.filter(a => a.id !== userId);
    this.save(state);
    return state.agents.length < initialCount;
  }
};

module.exports = stateManager;
```

- [ ] **Step 2: Commit**

```bash
git add src/stateManager.js
git commit -m "feat: add state manager for free agents"
```

---

### Task 3: UI Generator Implementation

**Files:**
- Create: `src/uiGenerator.js`

- [ ] **Step 1: Create UI Generator**

```javascript
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const uiGenerator = {
  createMainEmbed(agents) {
    const agentList = agents.length > 0 
      ? agents.map(a => `<@${a.id}>`).join('\n')
      : 'No free agents currently listed.';

    return new EmbedBuilder()
      .setTitle('Free Agents')
      .setDescription('Current players available and **looking for a team**! ⚽')
      .setColor('#00a8fc')
      .addFields({ name: 'Current Free Agents:', value: agentList })
      .setFooter({ text: "If you're looking to pick up new players or sign free agents for your team, make sure to check this channel regularly and dm them! 🚀\n\nLet's get those teams ready! 🏆" });
  },
  createButtons() {
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('btn_join')
          .setLabel('Looking for Team')
          .setEmoji('🔍')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('btn_leave')
          .setLabel('I found a team')
          .setEmoji('🤝')
          .setStyle(ButtonStyle.Secondary)
      );
    return [row];
  }
};

module.exports = uiGenerator;
```

- [ ] **Step 2: Commit**

```bash
git add src/uiGenerator.js
git commit -m "feat: add UI generator for embeds and buttons"
```

---

### Task 4: Main Bot Logic & Interaction Handlers

**Files:**
- Modify: `src/index.js`

- [ ] **Step 1: Implement Main Bot Logic**

```javascript
require('dotenv').config();
const { Client, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, Events } = require('discord.js');
const stateManager = require('./stateManager');
const uiGenerator = require('./uiGenerator');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

let lastMainMessageId = null;

async function updateMainMessage(channel) {
  const state = stateManager.load();
  const embed = uiGenerator.createMainEmbed(state.agents);
  const components = uiGenerator.createButtons();

  if (lastMainMessageId) {
    try {
      const oldMsg = await channel.messages.fetch(lastMainMessageId);
      await oldMsg.delete();
    } catch (e) { console.error('Failed to delete old message:', e.message); }
  }

  const newMsg = await channel.send({ embeds: [embed], components });
  lastMainMessageId = newMsg.id;
}

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const channel = await client.channels.fetch(process.env.CHANNEL_ID);
  if (channel) updateMainMessage(channel);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton()) {
    if (interaction.customId === 'btn_join') {
      const added = stateManager.addAgent(interaction.user);
      if (added) {
        await interaction.reply({ content: `<@${interaction.user.id}> is now a Free Agent! 🚀`, ephemeral: false });
        await updateMainMessage(interaction.channel);
      } else {
        await interaction.reply({ content: 'You are already in the list!', ephemeral: true });
      }
    }

    if (interaction.customId === 'btn_leave') {
      const state = stateManager.load();
      if (!state.agents.some(a => a.id === interaction.user.id)) {
        return interaction.reply({ content: 'You are not in the list!', ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId('modal_found_team')
        .setTitle('Found a Team!');

      const teamInput = new TextInputBuilder()
        .setCustomId('team_name')
        .setLabel("Which team did you join?")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(teamInput));
      await interaction.showModal(modal);
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal_found_team') {
      const teamName = interaction.fields.getTextInputValue('team_name');
      stateManager.removeAgent(interaction.user.id);
      await interaction.reply({ content: `<@${interaction.user.id}> found a team! They joined **${teamName}**! 🏆`, ephemeral: false });
      await updateMainMessage(interaction.channel);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
```

- [ ] **Step 2: Commit**

```bash
git add src/index.js
git commit -m "feat: implement main bot logic and interaction handlers"
```

---

### Task 5: Final Polish & Setup Command

**Files:**
- Modify: `src/index.js`

- [ ] **Step 1: Add Setup Slash Command**

```javascript
// Add to client.on(Events.InteractionCreate, ...)
if (interaction.isChatInputCommand()) {
  if (interaction.commandName === 'setup') {
    await interaction.reply({ content: 'Setting up Free Agents channel...', ephemeral: true });
    await updateMainMessage(interaction.channel);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.js
git commit -m "feat: add setup command"
```
