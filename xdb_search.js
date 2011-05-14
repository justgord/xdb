#!/usr/bin/env node
//
// xdb_search val : list items that match with val
//
// copyright (c) justgord@gmail.com 2011
// open source released under BSD licence
//
var xdb = require('./xdb_core');

var visited=0;
function trace_item(item)
{
    var delim =  (visited>0) ? ',\n' : '';
    console.log(delim+JSON.stringify(item, null, "    "));
    visited++;
}

//

if (process.argv.length<3)
{
    console.log('usage: node xdb_search val');
    xdb.done();
    return;
}

var sval = process.argv[2];

console.log("[");
xdb.stream_filter_text(sval, trace_item, function() {
    console.log("]");
    xdb.done();
});

