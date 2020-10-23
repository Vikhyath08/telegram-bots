import Telegraf, { ContextMessageUpdate, Extra } from 'telegraf';
import { NowRequest, NowResponse } from '@now/node';

const bot = new Telegraf(process.env.HEX_BOT_TOKEN || '');

bot.use(Telegraf.log());

bot.use(async (ctx: ContextMessageUpdate, next) => {
  const start = new Date();
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await next();
  const ms = new Date().getTime() - start.getTime();
  console.log('Response time: %sms', ms);
});

module.exports = async (req: NowRequest  , res: NowResponse): Promise<NowResponse> =>{
  const password: string | undefined  = req.headers.authorization;
  const payload = req.payload;
  if (password === process.env.PASSWORD) {
    await bot.telegram.sendMessage(
      `${process.env.CHATID}`,
      `New Issue`,
    ).catch((e) => console.error(e));

    return res.status(200).send('success');
  }
  return res.status(200).send('Invalid Password');
};
