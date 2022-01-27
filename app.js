const { App } = require('@slack/bolt');

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

// Listens to incoming messages that contain "hello"
app.message('hello', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  console.log('received message');
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

app.event('app_home_opened', async ({ event, client, context }) => {
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

(async () => {
  // Start your app
  await app.start();

  console.log('⚡️ Bolt app is running!');
})();