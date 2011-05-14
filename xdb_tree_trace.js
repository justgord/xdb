#!/usr/bin/env node
//
// xdb_tree_show val : list the tree as json, given its doc id
//
// copyright (c) justgord@gmail.com 2011
// open source released under BSD licence
//

var xdbt        = require('./xdb_tree');

if (process.argv.length<3)
{
    console.log('usage: node xdb_tree_show doc_id');
    xdbt.done();
    return;
}

var tid = process.argv[2];

xdbt.tree_load(tid, function(tree) 
{
    console.log(JSON.stringify(tree, null, "    "));
    xdbt.done();
});
