const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs/promises');
const path = require('path');
const stateManager = require('../src/stateManager');

const TEST_DATA_FILE = path.join(__dirname, '..', 'data', 'free-agents.json');

test('State Manager Tests', async (t) => {
    // Backup original data
    let originalData;
    try {
        originalData = await fs.readFile(TEST_DATA_FILE, 'utf8');
    } catch (error) {
        originalData = JSON.stringify({ agents: [] });
    }

    // Reset data for tests
    await fs.writeFile(TEST_DATA_FILE, JSON.stringify({ agents: [] }), 'utf8');

    await t.test('loadAgents should return an empty array initially', async () => {
        const agents = await stateManager.loadAgents();
        assert.deepStrictEqual(agents, []);
    });

    await t.test('addAgent should add an agent and save it', async () => {
        const agent = { id: '1', name: 'Agent 1' };
        await stateManager.addAgent(agent);
        const agents = await stateManager.loadAgents();
        assert.deepStrictEqual(agents, [agent]);
    });

    await t.test('saveAgents should overwrite the list of agents', async () => {
        const agents = [{ id: '2', name: 'Agent 2' }];
        await stateManager.saveAgents(agents);
        const loadedAgents = await stateManager.loadAgents();
        assert.deepStrictEqual(loadedAgents, agents);
    });

    await t.test('removeAgent should remove an agent by ID', async () => {
        const agents = [
            { id: '1', name: 'Agent 1' },
            { id: '2', name: 'Agent 2' }
        ];
        await stateManager.saveAgents(agents);
        await stateManager.removeAgent('1');
        const loadedAgents = await stateManager.loadAgents();
        assert.deepStrictEqual(loadedAgents, [{ id: '2', name: 'Agent 2' }]);
    });

    // Restore original data
    await fs.writeFile(TEST_DATA_FILE, originalData, 'utf8');
});
