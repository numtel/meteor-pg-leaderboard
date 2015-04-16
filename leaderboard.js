// Data is read from select statements published by server
players = new PgSubscription('allPlayers');
myScore = new PgSubscription('playerScore', 'Maxwell');

myScore.addEventListener('updated', function(diff, data){
  data.length && console.log(data[0].score);
});

if (Meteor.isClient) {

  // Provide a client side stub
  Meteor.methods({
    'incScore': function(id, amount){
      var originalIndex;
      players.forEach(function(player, index){
        if(player.id === id){
          originalIndex = index;
          players[index].score += amount;
          players.changed();
        }
      });

      // Reverse changes if needed (due to resorting) on update
      players.addEventListener('update.incScoreStub', function(index, msg){
        if(originalIndex !== index){
          players[originalIndex].score -= amount;
        }
        players.removeEventListener('update.incScoreStub');
      });
    }
  });

  Template.leaderboard.helpers({
    players: function () {
      return players.reactive();
    },
    selectedName: function () {
      players.depend();
      var player = players.filter(function(player){
        return player.id === Session.get("selectedPlayer");
      });
      return player.length && player[0].name;
    }
  });

  Template.leaderboard.events({
    'click .inc': function () {
      Meteor.call('incScore', Session.get("selectedPlayer"), 5);
    }
  });

  Template.player.helpers({
    selected: function () {
      return Session.equals("selectedPlayer", this.id) ? "selected" : '';
    }
  });

  Template.player.events({
    'click': function () {
      Session.set("selectedPlayer", this.id);
    }
  });
}

if (Meteor.isServer) {
  var CONN_STR = 'postgres://meteor:meteor@127.0.0.1/meteor';
  var liveDb = new LivePg(CONN_STR, 'leaderboard_example');

  var closeAndExit = function() {
    liveDb.cleanup().then(process.exit);
  };
  // Close connections on hot code push
  process.on('SIGTERM', closeAndExit);
  // Close connections on exit (ctrl + c)
  process.on('SIGINT', closeAndExit);

  Meteor.publish('allPlayers', function(){
    return liveDb.select('SELECT * FROM players ORDER BY score DESC');
  });

  Meteor.publish('playerScore', function(name){
    return liveDb.select(
      'SELECT id, score FROM players WHERE name = $1', [ name ],
      {
        'players': function(row) {
          return row.name === name;
        }
      }
    );
  });

  Meteor.methods({
    'incScore': function(id, amount){
      // Ensure arguments validate
      check(id, Number);
      check(amount, Number);

      // Obtain a client from the pool
      pg.connect(CONN_STR, function(error, client, done) {
        if(error) throw error;

        // Perform query
        client.query(
          'UPDATE players SET score = score + $1 WHERE id = $2',
          [ amount, id ],
          function(error, result) {
            // Release client back into pool
            done();

            if(error) throw error;
          }
        )
      });
    }
  });
}
