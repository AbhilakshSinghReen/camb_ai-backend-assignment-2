const dotenv = require("dotenv")
const TelegramBot = require("node-telegram-bot-api")
const express = require('express');
const dns = require("node:dns")

dns.setDefaultResultOrder("ipv4first");
dotenv.config();

const port = process.env.PORT;
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramReceiverUserId = process.env.TELEGRAM_RECEIVER_USER_ID;

const telegramBot = new TelegramBot(telegramBotToken, { polling: true });
const app = express();

app.get('/webhooks/max-workers-reached', (req, res) => {
  const { scaler, namespace, deployment, numWorkers } = req.query;

  console.log("Received max-workers-reached webhook.")
  console.log(`    scaler: ${scaler}`)
  console.log(`    namespace: ${namespace}`)
  console.log(`    deployment: ${deployment}`)
  console.log(`    numWorkers: ${numWorkers}`)

  const currentDate = new Date();
  const dateString = currentDate.toISOString();

  let message = ``
  message += "Your Kubernetes Cluster has reached the max number of workers." + "\n"
  message += dateString + "\n"
  message += `Scaler: ${scaler}` + "\n"
  message += `Deployment: ${namespace}.${deployment}` + "\n"
  message += `Num Workers: ${numWorkers}`

  telegramBot.sendMessage(telegramReceiverUserId, message);

  res.status(200).send('Webhook received successfully.');
});

app.listen(port, () => {
  console.log(`Webhook server listening at port ${port}`);
});
