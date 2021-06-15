require('dotenv').config();

const fs = require('fs');

const Discord = require('discord.js');
const client = new Discord.Client();
const BOT_TOKEN = process.env.BOT_TOKEN;
const COMMAND_PREFIX = ";";

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}.`);
});

client.on('message', input => {
  const message = new Message(input);
  let botMessage = "";
  let command;
  if(message.isCommand('search')) {
    command = new Command('search', message.content);
    const data = JSON.parse(fs.readFileSync('wiedzmin.json'));
    const error = isAWorkingCommand(command, data);
    if(!error) {
      if(data[command.language][command.media].length > 0) {
        botMessage += `Links:`;
        data[command.language][command.media].forEach(link => {
          botMessage += `\n${link}`;
        });
      } else {
        botMessage = `${command.language} doesn't have any links for "${command.media}".`;
      }
      input.channel.send(botMessage);
    } else {
      input.channel.send(error);
    }
  }
  if(message.isCommand('help')) {
    botMessage = `Prefix: semicolon (\`${COMMAND_PREFIX}\`)\nCommands:\n\` ;search "language" "media" \`\nThis command searches for a website to purchase the book/move/series you want in your specified language.\n\` ;help \`\nGets you some help.`;
    input.channel.send(botMessage);
  }
  // if(message.isCommand('add')) {
  //   command = new addCommand(message.content);
  //   console.log(command);
  //   input.channel.send('added');
  // }
});
client.login(BOT_TOKEN);
class Command {
  constructor(action, content) {
    this.content = content;
    this.action = COMMAND_PREFIX + action;
    this.body = this.content.slice(this.action.length, this.content.length).trim();
    if(this.body.indexOf(' ') === -1) {
      this.language = this.body;
      this.media = '';
    } else {
      this.language = this.body.substring(0, this.body.indexOf(' '));
      if(this.body.indexOf('+') === -1) {
        this.media = this.body.substring(this.body.indexOf(' ')+1);
      } else {
        this.media = this.body.substring(this.body.indexOf(' ')+1, this.body.indexOf('+')).trim();
      }
    }
  }
}
class addCommand extends Command{
  constructor(content) {
    super('add', content);
    if(this.body.indexOf('+') === -1) {
      this.value = '';
    } else {
      this.value = this.body.substring(this.body.indexOf('+')+1).trim();
    }
  }
}
class Message {
  constructor(input) {
    this.content = input.content.trim();
  }
  isCommand(action) {
    return (this.content.toLowerCase().includes(COMMAND_PREFIX + action, 0) && this.content.indexOf(COMMAND_PREFIX) === 0)
  }
}
const findSimilarKeys = (string, json) => {
  let similarKeys = '';
  Object.keys(json).forEach(key => {
    if(key.includes(string) || string.includes(key)) {
      similarKeys += `\n${key}`;
    }
  });
  return similarKeys;
}
const isAWorkingCommand = (command, json) => {
  const languageWithOriginalCase = command.language;
  const mediaWithOriginalCase = command.media;
  const language = command.language.toLowerCase();
  const media = command.media.toLowerCase();
  if (json[language] && json[language][media]) return '';
  let error = '';
  if (!json[language]) {
    error += `"${languageWithOriginalCase}" is not a language in our database.`;
    const similarLanguages = findSimilarKeys(language, json);
    if(similarLanguages) {
      error += `\nMabye you meant:${similarLanguages}`;
    }
  } else if (!json[language][media]) {
    error += `"${mediaWithOriginalCase}" doesn't exist as an option for ${language}.`;
    const similarMedia = findSimilarKeys(media, json[language]);
    if (similarMedia) {
      error += `\nMabye you meant:${similarMedia}`;
    }
  } else if(json[language][media].length < 1) {
    error += `${language} doesn't have any links for "${media}"`;
  }
  return error;
}