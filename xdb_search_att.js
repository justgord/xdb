#!/usr/bin/env node
//
// xdb_search_att att val : list items with att=val
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

// pull out items with matching att=val

if (process.argv.length<4)
{
    console.log('usage: node xdb_search_att att val');
    xdb.done();
    return;
}

var satt = process.argv[2];
var sval = process.argv[3];

console.log("[");
xdb.stream_filter_att_val(satt, sval, trace_item, function() {
    xdb.done();
    console.log("]");
});
