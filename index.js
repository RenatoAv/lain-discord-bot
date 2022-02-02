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
let connection = null;
const commands = [
  {
    name: "play",
    init: playSong
  },
  {
    name: "bye",
    init: bye
  }
]

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
    connection = await connectToChannel(channel);

    let url = null;
    let videos = {};

    if(args[0].includes("watch?v=")) {
      console.log('entrou', args[0]);
      url = args[0];
      const videoId = args[0].slice(args[0].indexOf("watch?v=") + "watch?v=".length).split("&")[0];
      videos.all = [await yts( {videoId} )];
      console.log("videoteste", videos);
      //
    } else {
      console.log('entrou nao');
      videos = await yts( args.join(' ') );
      url = "https://www.youtube.com/watch?v=" + videos.all[0].videoId;
    }
  
    //console.log("id: ", id);
    //console.log(args.join(' '));
    
    stream = searchVideoByUrl(url);
    console.log("stream: ", stream);
    const resource = await createAudio(stream);
    //console.log("resource: ", resource);
    await resource.volume.setVolume(0.5);
    await player.play(resource);
    //console.log("player: ", player);
    await connection.subscribe(player);
    message.channel.send(`:notes: Tocando ${videos.all[0].title} :notes: \n hihihi`);
  }
}

function searchVideoByUrl(url) {
  return ytdl(url, {
    filter: 'audioonly',
    highWaterMark: 1<<25,
    quality: 'highestaudio'
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

async function bye(message) {
  message.channel.send(`Até mais! :wave:`);
  connection.disconnect();
}

client.login(config.BOT_TOKEN);
