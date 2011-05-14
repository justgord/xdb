//
// xdb_core : json db api
//
// copyright (c) justgord@gmail.com 2011
// open source released under BSD licence
//
var formidable  = require('formidable');
var sys         = require('sys');
var SerialQueue = require('serialq').SerialQueue;
var exec        = require('child_process').exec;
var xdb         = require('./xdb');
var mersenne    = require('./mersenne');

var db = xdb.connect();
mersenne.seed(new Date());


function uniq()
{
    var alpha="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var l = alpha.length;

    var u="";
    for (var i=0;i<8;i++) 
    {
        var c = mersenne.rand(l);
        u += alpha[c];
    }

    return u;
}


function sqlescape(s)
{
    // replace embedded ' with \'
    if (!s)
        return "";
    return s.replace(/'/g, "''");;
}


function db_store_item(item, next)
{
    var id = item._id;
    if (!id)
        id = item._id = uniq();

    console.log("storing item : "+id+" "+item._type);

    var sql = "delete from item where id='"+id+"'";   //replace all
    db.query(sql);

    for (att in item)
    {
        var val=item[att];
        sql = "insert into item (id, att, val) values ('"+id+"', '"+att+"', '"+sqlescape(val)+"')";
        db.query(sql);
    }

    if (next)
        next();
}


function xdb_find_by_att_val(att, val, done)
{
    var sql =   
        "select item.id,item.att,item.val from item " +
        "join item as ids on ids.id=item.id " + 
        "where ids.att='"+sqlescape(att)+"' and ids.val='"+sqlescape(val)+"' " +
        "order by item.id,item.att";

    var item = {};

    var qry = db.query(sql)
        .on('row', function(row) {
            item['id'] = row.id;
            item[row.att] = row.val;
        })
        .on('error', function(err) {
            console.log("query ERROR "+err);
        })
        .on('end', function() {
            if (done)
                done(item);
        });
}


function xdb_stream_all(itemcb, done)
{
    var sql = 'select id, att, val from item order by id, att';
   
    var id; 
    var item = {};
    var qry = db.query(sql)
        .on('row', function(row) {
            if (row.id!=id)
            {
                if (id)
                    itemcb(item);
                id = row.id;
                item={"id":id};
            }
            item[row.att] = row.val;
        })
        .on('error', function(err) {
            console.log("query ERROR "+err);
        })
        .on('end', function() {

            if (id)
                itemcb(item);       // send out last item

            if (done)
                done();
        });
}

var visited=0;
function trace_item(item)
{
    var delim =  (visited>0) ? ',\n' : '';
    console.log(delim+JSON.stringify(item, null, "    "));
    visited++;
}

function pred_item_att_val(item, att, val)
{
    return (item[att] && item[att]==val);
}

function filter_generator(att, val, visit)
{
    var a = att;
    var v = val;  
    return function(item) {
        if (pred_item_att_val(item,a,v))
            visit(item);
    };
}

function filter_any_text(keyword, visit)
{
    var k=keyword;
    return function(item) {
        var found = false;
        for(var att in item)
        {
            var val = item[att];
            if (val.indexOf(k)>=0)          // substring
                found=true;
        }
        if (found)
            visit(item);
    }
}


exports.stream_filter_text = function(sval, visitor, done)
{
    xdb_stream_all(filter_any_text(sval, visitor), done);
}

exports.stream_filter_att_val = function(satt, sval, visitor, done) 
{
    xdb_stream_all(filter_generator(satt, sval, visitor),done); 
}

exports.stream_all= function(visitor, done)
{
    xdb_stream_all(visitor, done);
}

exports.find_by_att_val = xdb_find_by_att_val;

exports.store_item = db_store_item;

exports.uniq = uniq;

exports.done = function() {
    db.done();
}

