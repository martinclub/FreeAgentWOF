require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    Events 
} = require('discord.js');
const stateManager = require('./stateManager');
const uiGenerator = require('./uiGenerator');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

let lastMainMessageId = null;

/**
 * Updates the main Free Agents message in the specified channel.
 * @param {TextChannel} channel The channel to update the message in.
 */
async function updateMainMessage(channel) {
    const agents = await stateManager.loadAgents();
    const embed = uiGenerator.createMainEmbed(agents);
    const components = uiGenerator.createButtons();

    if (lastMainMessageId) {
        try {
            const oldMsg = await channel.messages.fetch(lastMainMessageId);
            await oldMsg.delete();
        } catch (error) {
            console.error('Failed to delete old message:', error.message);
        }
    }

    const newMsg = await channel.send({
        embeds: [embed],
        components: components
    });
    lastMainMessageId = newMsg.id;
}

client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    const channelId = process.env.CHANNEL_ID;
    if (!channelId) {
        console.error('CHANNEL_ID is not defined in .env');
        return;
    }

    try {
        const channel = await client.channels.fetch(channelId);
        if (channel) {
            await updateMainMessage(channel);
        }
    } catch (error) {
        console.error('Failed to fetch channel:', error.message);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'btn_join') {
            const agents = await stateManager.loadAgents();
            const isAlreadyListed = agents.some(a => a.id === interaction.user.id);

            if (isAlreadyListed) {
                await interaction.reply({
                    content: 'You are already in the list!',
                    ephemeral: true
                });
            } else {
                await stateManager.addAgent({
                    id: interaction.user.id,
                    username: interaction.user.username,
                    timestamp: new Date().toISOString()
                });
                
                await interaction.reply({
                    content: `<@${interaction.user.id}> is now a Free Agent! 🚀`,
                    ephemeral: false
                });
                
                await updateMainMessage(interaction.channel);
            }
        }

        if (interaction.customId === 'btn_leave') {
            const agents = await stateManager.loadAgents();
            const isListed = agents.some(a => a.id === interaction.user.id);

            if (!isListed) {
                await interaction.reply({
                    content: 'You are not in the list!',
                    ephemeral: true
                });
                return;
            }

            const modal = new ModalBuilder()
                .setCustomId('modal_found_team')
                .setTitle('Found a Team!');

            const teamInput = new TextInputBuilder()
                .setCustomId('team_name')
                .setLabel('Which team did you join?')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(teamInput);
            modal.addComponents(firstActionRow);

            await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_found_team') {
            const teamName = interaction.fields.getTextInputValue('team_name');
            
            await stateManager.removeAgent(interaction.user.id);
            
            await interaction.reply({
                content: `<@${interaction.user.id}> found a team! They joined **${teamName}**! 🏆`,
                ephemeral: false
            });
            
            await updateMainMessage(interaction.channel);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
