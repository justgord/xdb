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

console.log("[");
xdb.stream_all(trace_item, function() {
    console.log("]");
    xdb.done();
});

