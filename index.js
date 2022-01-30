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
const { search } = require("yt-search");
const client = new Client({ intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES'] });
const player = createAudioPlayer();
const prefix = "!";
const commands = [
  {
    name: "play",
    init: playSong
  }
]


//client.destroy();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);


  client.on('messageCreate', async message => {
    if(message.author.bot) return;
    if(!message.content.startsWith(prefix)) return;

    const command = commands.find(c => prefix + c.name == message.content.split(' ')[0]);

    if(!command) {
      message.channel.send("Comando inválido");
      return;
    };

    command.init(message);
  });

});

async function playSong(message) {
  //obtem os argumentos apos o comando !play
  const args = message.content.split(' ').slice(1);

  if(!args.length) {
    message.channel.send("Erro! Faltou o titulo da música!");
    return;
  };

  //recupera o canal de voz conectado pelo usuario que enviou a mensagem
  const channel = message.member?.voice.channel

  if(channel) {
    const connection = await connectToChannel(channel);
    const videos = await yts( args.join(' ') );
    const id = videos.all[0].videoId;

    console.log(args.join(' '));

    stream = searchVideoById(id);
    const resource = createAudio(stream);
    resource.volume.setVolume(1);
    player.play(resource);
    connection.subscribe(player);
    message.channel.send(`Tocando ${videos.all[0].title} \n hihihi`);
  }
}

function searchVideoById(id) {
  return ytdl("https://www.youtube.com/watch?v=" + id, {
    filter: 'audioonly',
    highWaterMark: 1<<25
  });
}

function createAudio(stream) {
  return createAudioResource(stream, {
    inputType: StreamType.Arbitrary,
    inlineVolume: true
  });
}

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
