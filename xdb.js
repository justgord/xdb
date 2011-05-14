// usage :
//      var dbconn = require('db_connect');
//      var db = dbconn.connect()   
//
//      uses driver, user, host, database in app_config
//
// copyright (c) justgord@gmail.com 2011
// open source released under BSD licence
//

var fs          = require('fs');

function load_config()
{
    var contents = fs.readFileSync('../app_config.json');
    return JSON.parse(contents).data;
}

exports.connect = function()
{
    function blank(s)
    {
        return s ? s : '';
    }

    var config = load_config();

    var db; 
    if (config.driver=='mysql') {

        mysql = require('mysql').Client;
        db = new mysql();

        db.connect(config);
        db.query("use "+blank(config.database));
    }
    else if (config.driver=='postgres') {

        var pg = require('pg'); 

        db = new pg.Client({host:config.host, user:config.user, database:config.database});
        db.connect();
    }
    else {
        console.log("ERROR : unknown DB driver passed to db_connect : "); 
    }

    db.done = function() {
        db.query("select now()")
        .on('end', function() { 
            db.end(); 
        });
    }

    return db;
}

