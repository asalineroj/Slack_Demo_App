const { App } = require('@slack/bolt');
// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
const { WebClient, LogLevel } = require("@slack/web-api");

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN, //Token for Posting Web API
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true, //Using socket for dev/local environment instead of HTTP
  appToken: process.env.SLACK_APP_TOKEN, //App Token to receive Events API
  // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
  // you still need to listen on some port!
  port: process.env.PORT || 3000
});

const webclient = new WebClient(
  process.env.SLACK_USER_TOKEN, {
  // LogLevel can be imported and used to make debugging simpler
  logLevel: LogLevel.DEBUG
});

// Listens to incoming messages that contain "hello"
app.message('hello', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  console.log('received String message');
  await say({
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Hey there <@${message.user}>!`
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Click Me"
          },
          "action_id": "button_click"
        }
      }
    ],
    text: `Hey there <@${message.user}>!`
  });
});

app.message(/^(hi|hello|hey).*/, async ({ message, context, say }) => {
  // say() sends a message to the channel where the event was triggered
  console.log('received RegEx message');
  const greeting = context.matches[0];

  console.log(message);

  try {
    // Call the chat.delete method using the WebClient
    const result = await webclient.chat.delete({
      channel: message.channel,
      ts: message.ts
    });

    const postMessageUserToken = await webclient.chat.postMessage({
      "channel": message.channel,
      "text": `Please don't swear on this channel! :pray:`
    });

    const postMessageBotToken = await app.client.chat.postMessage({
      channel: message.channel,
      text: "I'm actually a Trickster bot",
      username: "SlackB0t",
      icon_url: "https://ca.slack-edge.com/E02K9BZ5BGS-USLACKBOT-sv41d8cd98f0-192"
    });

    console.log(result);
  }
  catch (error) {
    console.log(error.data.scopes);
    console.log(error.acceptedScopes);
    console.error(error);
  }

  await say({
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `${greeting} there <@${message.user}>!`
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Click Me"
          },
          "action_id": "button_click"
        }
      }
    ],
    text: `Hey there <@${message.user}>!`
  });
});

app.action('button_click', async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();
  await say(`<@${body.user.id}> clicked the button`);
});

//Home tab setup
const homeView = 
{
   "type":"home",
   "blocks":[
      {
         "type":"section",
         "text":{
            "type":"mrkdwn",
            "text":"A simple stack of blocks for the simple sample Block Kit Home tab."
         }
      },
      {
         "type":"actions",
         "elements":[
            {
               "type":"button",
               "text":{
                  "type":"plain_text",
                  "text":"Action A",
                  "emoji":true
               },
               "action_id": "action_a"
            },
            {
               "type":"button",
               "text":{
                  "type":"plain_text",
                  "text":"Action B",
                  "emoji":true
               },
               "action_id": "action_b"
            }
         ]
      }
   ]
}

app.action('action_a', async ({ body, ack, client }) => {
  // Acknowledge the action
  //console.log(body)
  await ack();
  const result = await client.chat.postMessage({
    "channel": body.user.id,
    "text": `Hello <@${body.user.id}>! :wave: You triggered Action A! :clap:`
  });
  
});

app.action('action_b', async ({ body, ack, client }) => {
  // Acknowledge the action
  await ack();
  const result = await client.chat.postMessage({
    "channel": body.user.id,
    "text": `Hello <@${body.user.id}>! :wave: You triggered Action B! :clap:`
  });
});

app.event('app_home_opened', async ({ event, context, client }) => {
  try {
    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await client.views.publish({
        /* the user that opened your app's app home */
        user_id: event.user,
        /* the view object that appears in the app home*/
        view: homeView
    });
  }
  catch (error) {
    console.error(error);
  }
});

app.event('reaction_added', async ({ event, message, context, client }) => {
  // say() sends a message to the channel where the event was triggered
  console.log('received reaction in message');
  
  console.log('This is the event');
  console.log(event)

  console.log('This is the message');
  console.log(message);

  console.log('This is the context');
  console.log(context);

  let button = {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "This is a section block with a button."
      },
      "accessory": {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Click Me",
          "emoji": true
        },
        "value": "click_me_123",
        "action_id": "button-action"
      }
    }

  const result = await app.client.conversations.history({
      // The token you used to initialize your app
      token: process.env.SLACK_BOT_TOKEN,
      channel: event.item.channel,
      // In a more realistic app, you may store ts data in a db
      latest: event.item.ts,
      // Limit results
      inclusive: true,
      limit: 1
    });

  console.log('This is the message retrieved');
  console.log(result);
  console.log('These are the message BLOCKS retrieved');
  console.log(result.messages[0].blocks);
  // There should only be one result (stored in the zeroth index)
  message = result.messages[0];
  
  if(event.reaction === 'hourglass') {
    message.blocks.push(button);
    console.log('These are the message BLOCKS with added button');
    console.log(result.messages[0].blocks);


    try {

      const postMessageBotToken = await app.client.chat.postMessage({
        channel: event.item.channel,
        text: "fallback text! block didn't work!",
        blocks: message.blocks
      });

      console.log(result);
    }
    catch (error) {
      console.log(error.data.scopes);
      console.log(error.acceptedScopes);
      console.error(error);
    }
  }
});

(async () => {
  // Start your app
  await app.start();

  console.log('?????? Bolt app is running!');
})();