import { NowRequest, NowResponse } from '@now/node';
import { Octokit } from '@octokit/rest';
import Telegraf, { ContextMessageUpdate, Extra } from 'telegraf';
import { ExtraEditMessage } from 'telegraf/typings/telegram-types';
import axios from 'axios';
const fs = require('fs');

const PROD_ENV = process.env.NODE_ENV === 'production';
const bot = new Telegraf(process.env.HEX_BOT_TOKEN || '');
const regex = /^\/([^@\s]+)@?(?:(\S+)|)\s?([\s\S]+)?$/i;

bot.use(Telegraf.log());
bot.use(async (ctx: ContextMessageUpdate, next) => {
  const start = new Date();
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await next();
  const ms = new Date().getTime() - start.getTime();
  console.log('Response time: %sms', ms);
});

bot.on('new_chat_members', async (ctx: ContextMessageUpdate) => {
  const name = ctx.from ? ctx.from.first_name : 'fellow nerd';
  ctx.reply(`Hey ${name}! I'm really interested in you, so can you please introduce yourself?`);
});

bot.command('AddIssue',async (ctx: ContextMessageUpdate) =>{
  if(ctx.from!.first_name){
    var rawData = fs.readFileSync('members.json');
    var memberData = JSON.parse(rawData);
    const git_id = memberData[(ctx.from!.first_name)];
    // questioning further for description
    if(git_id){
      const content = {
        'Title':'Dummy',
        'Body':'Details',
        'Difficulty':0,
        'author':git_id,
        };
      const cops_bot_link = process.env.HEXIE_BOT_LINK || '';
      const response = await axios.post(cops_bot_link,content,{
            headers:{
              authorization:process.env.PASSWORD
            }
          });
      if (response.status === 200){
        ctx.reply('Thank you for Posting'); // Add in a link of the issue created
      } else {
        ctx.reply('There is some problem while creating your DevTalk');
      }
      
    } else {
      ctx.reply('Register Yourself by /AddMe <your-github_id>');
    }
  }
  ctx.reply('Hello fellow nerd, you have no name!!');
});
bot.command('CloseIssue',async (ctx: ContextMessageUpdate) => {
  // Complete it the same way as above
  ctx.reply('Done');
});

bot.command('UpdateIssue',async (ctx: ContextMessageUpdate)=>{
  // Complete it the same way as above
  ctx.reply('Done');
});

bot.command('AddMe',async (ctx: ContextMessageUpdate) => {
  if(ctx.message && ctx.message.text){
    const parts = regex.exec(ctx.message.text.trim());
    if (parts) {
      const command = {
        text: ctx.message.text,
        command: parts[1],
        bot: parts[2],
        args: parts[3],
      };
      var rawData = fs.readFileSync('members.json');
      var memberData = JSON.parse(rawData);
      memberData[ctx.from!.first_name]=command.args;
      fs.writeFile('members.json',
                    JSON.stringify(memberData),
                    (err) => {
                      if(err){
                        console.log("Error not saved");
                      }
                    }
                  );
      // In place of text fetch github profile and present
      await bot.telegram.sendMessage(ctx.from!.id,'text',{reply_to_message_id: ctx.message.message_id});
    }
  }
});

bot.command('DevTalks', async (ctx: ContextMessageUpdate) => {
  //ctx.reply("hello");
  console.log(ctx);
  const octokit = new Octokit();
  const { data } = await octokit.issues.listForRepo({
    owner: 'COPS-IITBHU',
    repo: 'DevTalks',
  });

  if (data.length == 0) {
    ctx.reply('No upcoming dev talks.');
  }

  const msgList = data.map(
    (element) => `[${element.title}](${element.html_url}) by [${element.user.login}](${element.user.html_url})`,
  );

  ctx.replyWithMarkdown(msgList.join('\n\n'), <ExtraEditMessage>Extra.webPreview(false));
});

if (!PROD_ENV) {
  bot.launch();
}

module.exports = (req: NowRequest, resp: NowResponse) => {
  if (req.method === 'POST') bot.handleUpdate(req.body, resp);
  else resp.status(200).send('Use POST to use Telegram bot!');
};
