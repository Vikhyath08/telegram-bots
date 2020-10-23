import { NowRequest, NowResponse } from '@now/node';
import { Octokit } from '@octokit/rest';
import Telegraf, { ContextMessageUpdate, Extra } from 'telegraf';
import { ExtraEditMessage } from 'telegraf/typings/telegram-types';
//import {writeFile} from 'fs';

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
  console.log(ctx);
  ctx.reply("Done");
});
bot.command('AddMe',async (ctx: ContextMessageUpdate) => {
  //console.log(ctx);

  if(ctx.message && ctx.message.text){
    const parts = regex.exec(ctx.message.text.trim());
    if (parts) {
      const command = {
        text: ctx.message.text,
        command: parts[1],
        bot: parts[2],
        args: parts[3],
      };
      console.log(command);
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
