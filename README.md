# AUFS Website

This is the source code for AUFS' website (Aberdeen University's Filmmaking Society). It serves to inform the public on our films, who we are, what we do, and also serves as a platform to very easily and quickly run internal polls during our meetings.

This project is maintained by the AUFS commitee.

## Voting platform

Our voting platform exposes two public pages:

* **Results page** (`/results`) Displays the currently active (or armed) vote.

* **Voting page** (`/vote`) Allows anyone to vote one single time per vote.

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