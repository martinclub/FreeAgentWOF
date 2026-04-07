const fs = require('fs/promises');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'free-agents.json');

/**
 * Loads the list of agents from the data file.
 * @returns {Promise<Array>} The list of agents.
 */
async function loadAgents() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const parsed = JSON.parse(data);
        return parsed.agents || [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

/**
 * Saves the list of agents to the data file.
 * @param {Array} agents The list of agents to save.
 */
async function saveAgents(agents) {
    const data = JSON.stringify({ agents }, null, 2);
    await fs.writeFile(DATA_FILE, data, 'utf8');
}

/**
 * Adds an agent to the list and saves.
 * @param {Object} agent The agent to add.
 */
async function addAgent(agent) {
    const agents = await loadAgents();
    agents.push(agent);
    await saveAgents(agents);
}

/**
 * Removes an agent from the list by ID and saves.
 * @param {string} agentId The ID of the agent to remove.
 */
async function removeAgent(agentId) {
    const agents = await loadAgents();
    const filteredAgents = agents.filter(a => a.id !== agentId);
    await saveAgents(filteredAgents);
}

module.exports = {
    loadAgents,
    saveAgents,
    addAgent,
    removeAgent
};
