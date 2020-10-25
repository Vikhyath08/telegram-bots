import { NowRequest, NowResponse } from '@now/node';
import { Octokit } from '@octokit/rest';
import Telegraf, { ContextMessageUpdate, Extra} from 'telegraf';
import { ExtraEditMessage } from 'telegraf/typings/telegram-types';
// import axios from 'axios';
const fs = require('fs');
const WizardScene = require('telegraf/scenes/wizard');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
var talk = {};

const PROD_ENV = process.env.NODE_ENV === 'production';
const bot = new Telegraf(process.env.HEX_BOT_TOKEN || '');
bot.use(session())

const talkInfoWizard = new WizardScene('talk_info', 
  (ctx) => {
    talk = {};
    // if(ctx.from!.first_name){
    //   var rawData = fs.readFileSync('members.json');
    //   var memberData = JSON.parse(rawData);
    //   const git_id = memberData[(ctx.from!.first_name)];
      // if(git_id){
        ctx.reply('Awesome. Awesome. What would your DevTalk\'s name be? This field in compulsory.')
        return ctx.wizard.next();
      // }
      // else{
      //   ctx.reply('Register Yourself by /AddMe <your-github_id>');
      //   return ctx.scene.leave();
      // }
    // }
    // else{
    //   ctx.reply('Hello fellow nerd, you have no name!!');
    // }
  },
  (ctx) => {
    talk['title'] = ctx.message!.text!;
    if (talk['title'] === '')
    {
      ctx.reply('There has to be a name to the Dev Talk. Try again.');
      return ctx.scene.leave();
    }
    console.log('Title: ' + talk['title']);
    ctx.reply('Awesome. Please provide an introduction to the talk. This is not compulsory.');
    return ctx.wizard.next();
  },
  (ctx) => {
    talk['abstract'] = ctx.message!.text!;
    console.log('Abstract: ' + talk['abstract']);
    ctx.reply('Awesome. Please provide a list of topics covered during the talk. This is not compulsory.');
    return ctx.wizard.next();
  },
  (ctx) => {
    talk['topics'] = ctx.message!.text!;
    console.log('Topics: ' + talk['topics']);
    ctx.reply('Awesome. Please provide an approximate duration for the talk. This is not compulsory.');
    return ctx.wizard.next();
  },
  (ctx) => {
    talk['duration'] = ctx.message!.text!;
    console.log('Duration: ' + talk['duration']);
    ctx.reply('Awesome. Please provide the difficult level of the talk. This can be 0 for Beginner, 1 for Intermediate and 2 for Advanced. This is not compulsory.');
    return ctx.wizard.next();
  },
  (ctx) => {
    const level = ctx.message!.text!;
    if (level != '0' && level != '1' && level != '2')
    {
      ctx.reply('The level has to be one of 0, 1, 2. Enter it again.')
      ctx.wizard.selectStep(ctx.wizard.cursor)
    }
    else{
      talk['level'] = parseInt(level);
      console.log('Level: ' + talk['level']);
      ctx.reply('Awesome. Please provide any pre-requisites of the talk. This is not compulsory.');
      return ctx.wizard.next();
    }
  },
  (ctx) => {
    talk['prereq'] = ctx.message!.text!;
    console.log('Pre Requisites: ' + talk['prereq']);
    ctx.reply('Awesome. Please provide resources to the talk. This is not compulsory.');
    return ctx.wizard.next();
  },
  (ctx) => {
    talk['resources'] = ctx.message!.text!;
    console.log('Resources: ' + talk['resources']);
    ctx.reply('Awesome. Please provide content for the talk. This is not compulsory.');
    return ctx.wizard.next();
  },
  (ctx) => {
    talk['content'] = ctx.message!.text!;
    console.log('Content: ' + talk['content']);
    var talkInfo = '';
    for (let key in talk){
      talkInfo += key + ':' + talk[key] + '\n';
    }
    ctx.reply(talkInfo);
    ctx.telegram.sendMessage(ctx.message.chat.id, 'Awesome. That should be it for now. Thanks for using the bot!');
    return ctx.scene.leave();
  },
);

const stage = new Stage([talkInfoWizard])
bot.use(stage.middleware());
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

bot.command('AddIssue', Stage.enter('talk_info'));

bot.command('leave', Stage.leave('talk_info'));

// bot.command('AddIssue',async (ctx: ContextMessageUpdate) =>{
//   // ctx.reply('Done')
//   // return;
//   if(ctx.from!.first_name){
//     var rawData = fs.readFileSync('members.json');
//     var memberData = JSON.parse(rawData);
//     const git_id = memberData[(ctx.from!.first_name)];
//     // questioning further for description
//     if(git_id){
//       const content = {
//         'Title':'Dummy',
//         'Body':'Details',
//         'Difficulty':0,
//         'author':git_id,
//         };
//       const cops_bot_link = process.env.HEXIE_BOT_LINK || '';
//       const response = await axios.post(cops_bot_link,content,{
//             headers:{
//               authorization:process.env.PASSWORD
//             }
//           });
//       if (response.status === 200){
//         ctx.reply('Thank you for Posting'); // Add in a link of the issue created
//       } else {
//         ctx.reply('There is some problem while creating your DevTalk');
//       }
      
//     } else {
//       ctx.reply('Register Yourself by /AddMe <your-github_id>');
//     }
//   }
//   ctx.reply('Hello fellow nerd, you have no name!!');
// });

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
