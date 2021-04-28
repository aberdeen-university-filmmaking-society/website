# AUFS Website

This is the source code for AUFS' website (Aberdeen University's Filmmaking Society). It serves to inform the public on our films, who we are, what we do, and also serves as a platform to very easily and quickly run internal polls during our meetings.

This project is maintained by the AUFS commitee.

## Environment variables

These can be set in a `.env` file placed alongside `app.js`

* **`GOOGLE_CLIENT_ID`**: Client ID for Google Analytics
* **`GOOGLE_CLIENT_SECRET`**: Client secret for Google Analytics
* **`DATABASE_HOST`**: The host name of the MySQL server
* **`DATABASE_USER`**: The user used to connect to MySQL
* **`DATABASE_PASSWORD`**: The password used to connect to MySQL
* **`DATABASE_NAME`**: The name of the SQL Database to use
* **`LAUNCH_DATE`**: If it is in the future, any unauthenticated request will render `countdown.ejs`
* **`GM_PATH`**: The location of gm (GraphicsMagick). Can be undefined if unecessary.
* **`URL_START`**: The beginning of the URL (ex: `https://aufilmmaking.co.uk`), used for redirections and various link generation features
* **`SESSION_SECRET`**: Any random passcode (used by express-session)
* **`AUDITION_EMAIL`**: The email address the Auditions are sent from
* **`AUDITION_PASSWORD`**: The password of the specified email account
* **`EQUIPMENT_EMAIL`**: The email address the Equipment requests are sent from
* **`EQUIPMENT_PASSWORD`**: The password of the specified email account

### Socket message types

* `vote.create(voteobject)`
* `vote.delete(voteid)`
* `vote.start(voteobject)`
* `vote.stop(voteid)`
* `vote.arm.start(voteobject)`
* `vote.arm.stop(voteid)`
* `vote.result.update(voteid, results)`
* `vote.result.show()`
* `vote.archive(voteobject);`
* `other.connectedcount`
* `other.settings.update(settings)`

### Debugging

In order to run a copy on your local machine, all the environment variables need to be set, and logging into the admin panel requires addingd an entry to your hosts file redirecting the `aufilmmaking.com` domain to `127.0.0.1` (localhost). The URL_START environment variable can then be set to `http://aufilmmaking.com`. 

The real domain ends with `.co.uk`, but `.com` is also registered as a valid redirect for the Google login OAuth.