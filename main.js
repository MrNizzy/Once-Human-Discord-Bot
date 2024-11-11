const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { Client } = require("discord.js");
const memeticData = require("./memetics.json");

require("dotenv").config();

const client = new Client({
  intents: ["Guilds", "GuildMessages", "GuildMembers", "MessageContent"],
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "ping") {
    await interaction.reply({ content: "Pong!", ephemeral: true });
  }

  if (commandName === "memetic") {
    const embeds = memeticData[0].embeds.map((embedData) => {
      return new EmbedBuilder()
        .setTitle(embedData.title)
        .setDescription(embedData.description)
        .setColor(embedData.color)
        .setAuthor({
          name: embedData.author.name,
          iconURL: embedData.author.icon_url,
        })
        .setThumbnail(embedData.thumbnail.url)
        .addFields(embedData.fields);
    });

    const categories = [
      "Maquinista",
      "Fundidor",
      "Prospector",
      "Chef Estrella",
      "Experto en demolición",
      "Maestro artesano",
      "Hijo de la tierra",
      "Electricista",
      "Ingeniero hidráulico",
      "Artesano",
      "Mariscal de Artillería",
    ];
    let currentCategory = null;
    let currentPage = 0;
    const itemsPerPage = 3;

    const getFilteredEmbeds = (category) => {
      return embeds.filter((embed) => {
        const typeField = embed.data.fields.find(
          (field) => field.name === "Tipo"
        );
        return typeField && typeField.value === category;
      });
    };

    const getPageEmbeds = (embeds, page) => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      return embeds.slice(start, end);
    };

    const createCategoryRows = (categories) => {
      const rows = [];
      for (let i = 0; i < categories.length; i += 5) {
        const row = new ActionRowBuilder().addComponents(
          categories
            .slice(i, i + 5)
            .map((category) =>
              new ButtonBuilder()
                .setCustomId(category)
                .setLabel(category)
                .setStyle(ButtonStyle.Secondary)
            )
        );
        rows.push(row);
      }
      return rows;
    };

    const categoryRows = createCategoryRows(categories);

    const navigationRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("previous")
        .setLabel("Anterior")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Siguiente")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)
    );

    await interaction.reply({
      content: "Selecciona una categoría para filtrar las meméticas:",
      components: [...categoryRows],
      ephemeral: true,
    });

    const filter = (i) =>
      categories.includes(i.customId) ||
      i.customId === "previous" ||
      i.customId === "next";
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      if (categories.includes(i.customId)) {
        currentCategory = i.customId;
        currentPage = 0;
        const filteredEmbeds = getFilteredEmbeds(currentCategory);
        const totalPages = Math.ceil(filteredEmbeds.length / itemsPerPage);

        const newNavigationRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("previous")
            .setLabel("Anterior")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Siguiente")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages - 1)
        );

        await i.update({
          content: `Meméticas filtradas por categoría: ${currentCategory}`,
          embeds: getPageEmbeds(filteredEmbeds, currentPage),
          components: [...categoryRows, newNavigationRow],
        });
      } else {
        const filteredEmbeds = getFilteredEmbeds(currentCategory);
        const totalPages = Math.ceil(filteredEmbeds.length / itemsPerPage);

        if (i.customId === "previous") {
          currentPage--;
        } else if (i.customId === "next") {
          currentPage++;
        }

        const newNavigationRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("previous")
            .setLabel("Anterior")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Siguiente")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages - 1)
        );

        await i.update({
          embeds: getPageEmbeds(filteredEmbeds, currentPage),
          components: [...categoryRows, newNavigationRow],
        });
      }
    });
  }
});

client.login(process.env.BOT_TOKEN);
