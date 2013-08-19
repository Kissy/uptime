var mongoose   = require('mongoose');
var config     = require('config');
var semver     = require('semver');

// Custom config override
if (process.env.PORT || process.env.VCAP_APP_PORT) {
    config.server.port = process.env.PORT || process.env.VCAP_APP_PORT;
    config.monitor.apiUrl = 'http://localhost:' + config.server.port + '/api';
}
if (process.env.MONGOHQ_URL) {
    config.mongodb.string = process.env.MONGOHQ_URL;
    //mongodb://appfog:43933e4a63329d467b8cc3eaf3374b85@paulo.mongohq.com:10077/kissy_uptime_guillaume_lebiller
    config.mongodb.username = 'appfog';
    config.mongodb.password = '43933e4a63329d467b8cc3eaf3374b85';
}
if (process.env.BASIC_AUTH_USERNAME) {
    config.basicAuth.username = process.env.BASIC_AUTH_USERNAME;
}
if (process.env.BASIC_AUTH_PASSWORD) {
    config.basicAuth.password = process.env.BASIC_AUTH_PASSWORD;
}

// configure mongodb
mongoose.connect(config.mongodb.string || 'mongodb://' + config.mongodb.username + ':' + config.mongodb.password + '@' + config.mongodb.hostname +'/' + config.mongodb.db);
mongoose.connection.on('error', function (err) {
  console.error('MongoDB error: ' + err.message);
  console.error('Make sure a mongoDB server is running and accessible by this application');
  process.exit(1);
});
mongoose.connection.on('open', function (err) {
  mongoose.connection.db.admin().serverStatus(function(err, data) {
    if (err) {
      if (err.name === "MongoError" && (err.errmsg === 'need to login' || err.errmsg === 'unauthorized')) {
        console.log('Forcing MongoDB authentication');
        mongoose.connection.db.authenticate(config.mongodb.username, config.mongodb.password, function(err) {
          if (!err) return;
          console.error(err);
          process.exit(1);
        });
        return;
      } else {
        console.error(err);
        process.exit(1);
      }
    }
    if (!semver.satisfies(data.version, '>=2.1.0')) {
      console.error('Error: Uptime requires MongoDB v2.1 minimum. The current MongoDB server uses only '+ data.version);
      process.exit(1);
    }
  });
});


module.exports = mongoose;
