const { App } = require('@slack/bolt');
// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
const { WebClient, LogLevel } = require("@slack/web-api");

//Escalation Channel - 777
const ESCALATION_CHANNEL = 'C03AVQPURB7';

//
//const SLEEP_TIMER = 120 || process.env.SLEEP_TIMER;

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN, //Token for Posting Web API
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true, //Using socket for dev/local environment instead of HTTP
  appToken: process.env.SLACK_APP_TOKEN, //App Token to receive Events API
  // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
  // you still need to listen on some port!
  port: process.env.PORT || 3000,
  ignoreSelf: false
});

// Listens to incoming messages that contain "hello"
/*app.message('hello', async ({ message, say }) => {
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

  Priority: High
});
*/

// Home tab setup
// Home view
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

// Home app
app.event('app_home_opened', async ({ event, context, client }) => {
  try {
    /* view.publish is the method that your app uses to push a view to the Home tab */
    console.log(app_home_called);
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

// Capture emojis/reactions
app.event('reaction_added', async ({ event, message, context, client }) => {
  // say() sends a message to the channel where the event was triggered
  console.log('received reaction in message');
  
  console.log('This is the event');
  console.log(event)

  console.log('This is the message');
  console.log(message);

  console.log('This is the context');
  console.log(context);

// Swarm_Claim action ID
//
  let button = {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":warning: SLA deadline exceeded!"
      },
      "accessory": {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": ":sfdc: Claim",
          "emoji": true
        },
        "value": "click_me_123",
        "action_id": "swarm_escalated_claimed"
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
  console.log(result.messages[0]);
  console.log('These are the message BLOCKS retrieved');
  console.log(result.messages[0].blocks);
  // There should only be one result (stored in the zeroth index)
  message = result.messages[0];
  
  if(event.reaction === 'hourglass') {
    var messageToPost = messageToPost = {
        channel: ESCALATION_CHANNEL,
        text: "fallback text! block didn't work!"
      }
    if (message.blocks != undefined ){
/*
      message.blocks.map((value,index) => {
          console.log(value);
          if (value.type === 'rich_text') {
            message.blocks[index] = {
              'type': 'section',
              'text': {
                'type': 'mrkdwn',
                'text': value.elements[0].elements[0].text
              } 
            }
            console.log(message.blocks[index]);
          }
      });*/

      message.blocks[0] = {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': message.text
        } 
      }
      console.log('These are the message BLOCKS before adding button');
      console.log(message.blocks);
      console.log('**********');
      console.log('**********');
      console.log('MESSAGE BLOCKS TO BE SENT');
      message.blocks.push(button);
      console.log(message.blocks);
      console.log('**********');
      

      messageToPost = {
        channel: ESCALATION_CHANNEL,
        text: "fallback text! block didn't work!",
        blocks: message.blocks
      }
    }
    
    try {

      const postMessageBotToken = await app.client.chat.postMessage(messageToPost);

      console.log(result);
    }
    catch (error) {
      console.log(error.data.scopes);
      console.log(error.acceptedScopes);
      console.error(error);
    }
  } else if(event.reaction === 'eyes') {
    //app.client.add_reaction('hourglass');
  }
});

// Capture High Priority Messages
app.message(/.*High.*/, async ({ message, context, say }) => {
  // say() sends a message to the channel where the event was triggered
  console.log('received a Priority Swarm Case message');
  console.log('*******************');
  console.log('*******************');
  console.log('***RegEx Message**');

  console.log('***CONTEXT**');
  console.log(context);
  console.log('***MESSAGE**');
  console.log(message);
  
  if(message.channel!==ESCALATION_CHANNEL) {
    try {
      
      // Define the Reaction and add it to channel
      let reaction = {
        "channel": message.channel,
        "name": "hourglass",
        "timestamp": message.ts
      };

      //TODO: Add timer before flagging
      app.client.reactions.add(reaction);

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

  console.log('⚡️ Bolt app is running!');
})();