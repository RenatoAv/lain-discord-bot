const config = require("./config.json");
const { Client, Intents, GatewayIntentBits } = require('discord.js');
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

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ] 
});

const player = createAudioPlayer();
const prefix = "!";
let connection = null;
const songs = [];
let currentChannel = null;
const commands = [
  {
    name: "play",
    init: playSong
  },
  {
    name: "bye",
    init: bye
  },
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
  console.log(`play song function triggered`);
  const args = message.content.split(' ').slice(1);

  currentChannel = message.channel;

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
    let songs = [];

    if(args[0].includes("watch?v=")) {
      url = args[0];
      const videoId = args[0].slice(args[0].indexOf("watch?v=") + "watch?v=".length).split("&")[0];
      songs = await yts( {videoId} );
    } else {
      let titulo = args.join(' ');
      videos = await yts(titulo);
      songs = videos.all[0];
    }

    addSongToQueue(songs, message);
    start();

  }
}

async function start() {
  if(!player._state.status || player._state.status == AudioPlayerStatus.Idle) {
    console.log('start');
    let nextSong = songs.shift();
    stream = searchVideoByUrl(nextSong.url);
    const resource = await createAudio(stream);
    await resource.volume.setVolume(0.5);
    await player.play(resource);
    await connection.subscribe(player);
    currentChannel.send(`:notes: Tocando ${nextSong.title} :notes: \n hihihi`);
  }
}

player.on('stateChange', (oldState, newState) => {
	if(player._state.status == AudioPlayerStatus.Idle && songs[0]) start();
});

function addSongToQueue(songsToAdd, message) {
  songs.push(songsToAdd);
  //currentChannel.send(`Musica adicionada na posição ${songs.length}`);
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
