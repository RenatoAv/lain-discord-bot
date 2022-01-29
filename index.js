const config = require("./config.json");
const { Client, Intents } = require('discord.js');
const yts = require( 'yt-search' );
const ytdl = require('ytdl-core');

const {
	NoSubscriberBehavior,
	StreamType,
	createAudioPlayer,
	createAudioResource,
	entersState,
	AudioPlayerStatus,
	VoiceConnectionStatus,
	joinVoiceChannel,
} = require('@discordjs/voice');
const client = new Client({ intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES'] });
const player = createAudioPlayer();
const prefix = "!";


//client.destroy();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);


  client.on('messageCreate', async message => {
    if(message.author.bot) return;
    if(!message.content.startsWith(prefix)) return;

    if(message.content.startsWith("!play")) {

      const args = message.content.split(' ').slice(1);

      const channel = message.member?.voice.channel

      if(channel) {
        const connection = await connectToChannel(channel);

        console.log(args.join(' '));

        const r = await yts( args.join(' ') );
        const id = r.all[0].videoId;

        console.log(r.all[0]);

        stream = ytdl("https://www.youtube.com/watch?v=" + id, {
          filter: 'audioonly',
          highWaterMark: 1<<25
        });

        const resource = createAudioResource(stream, {
          inputType: StreamType.Arbitrary,
          inlineVolume: true
        });

        resource.volume.setVolume(0.5);

        player.play(resource);

        connection.subscribe(player);

        message.channel.send("Tocando hihiih");
    
      }
      
    }

  });

});

async function connectToChannel(channel) {
	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
	});
	try {
		await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
		return connection;
	} catch (error) {
		connection.destroy();
		throw error;
	}
}

client.login(config.BOT_TOKEN);
