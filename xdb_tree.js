//
// xdb_tree 
//
//      load/save json trees into xdb postgres database [flatten/unflatten]
//      set _parent_id and _doc_id on tree save so we can slurp whole tree back quickly
//
// copyright (c) justgord@gmail.com 2011
// open source released under BSD licence
//

var xdb = require('./xdb');

var db=xdb.connect();


function sqlescape(s)
{
    // replace embedded ' with \'
    if (!s)
        return "";
    return s.replace(/'/g, "''");;
}


function visit_tree(att, t, v, p)
{
    v.enter(att, t, p);
    for (var i in t)
    {
        var val = t[i];
        if (typeof(val)=="object")
            visit_tree(i, val, v, t);
        else
            v.attr(i, val);
    }
    v.exit(att, t, p);
}

String.prototype.repeat = function(n)
{
    if (n==undefined || n<1)
        return "";
    return Array(n+1).join(this);
}

var visitor_trace =
{
    d: 0,

    indent : function() 
    {
        return "    ".repeat(this.d);
    },

    enter : function(att, t, p)
    {
        console.log(this.indent()+att+" : {");
        this.d++;
    },
    attr : function(att, val)
    {
        console.log(this.indent()+att+" : \""+val+"\"");
    },
    exit : function(att, t, p)
    {
        if (!t._parent && p)
            this.attr("_parent", p.Alpha);

        this.d--;
        console.log(this.indent()+"}");
    }
};

function delete_tree(id)
{
    sql = "delete from item where id in (select id from item where att='_doc_id' and val='"+sqlescape(id)+"')";

    db.query(sql);
}


function tree_save(id, tree)
{

    var visitor_store =
    {
        doc_id : "",
        stack : [],

        store : function(id, att, val)
        {
            //console.log('[ id="'+id+'", att="'+att+'", val="'+val+'" ]');

            sql = "insert into item (id, att, val) values ('"+id+"', '"+att+"', '"+sqlescape(val)+"')";
            db.query(sql);
        },

        enter : function(att, t, p)
        {
            this.stack.push(t);
        },
        attr : function(att, val)
        {
            var tos = this.stack[this.stack.length-1];
            this.store(tos.Alpha, att, val);
        },
        exit : function(att, t, p)
        {
            if (!t._parent && p)
                this.attr("_parent", p.Alpha);

            if (!t._parent_att)
                this.attr("_parent_att", att);

            this.attr("_doc_id", this.doc_id);

            this.stack.pop();
        }
    };

    delete_tree(id);

    visitor_store.doc_id = id;
    visit_tree("", tree, visitor_store, null);
}

function tree_from_map(map, id)
{
    var ob = map[id];

    for (cid in map)
    {
        var ch = map[cid];
        if (ch._parent && ch._parent==id)
        {
            var att = ch._type;
            if (ch._parent_att)
                att = ch._parent_att;
            ob[att] = tree_from_map(map, cid);
        }
    }
    return ob;
}

function tree_load(id, complete)
{
    // get all ids for items in this document tree,
    // get all att/vals for those items

    var sql =   
        "select item.id,item.att,item.val from item " +
        "join item as ids on ids.id=item.id " + 
        "where ids.att='_doc_id' and ids.val='"+id+"' " +
        "order by item.id,item.att";

    // load into map, then recreate tree from map

    var map={};

    db.query(sql)
        .on('row', function(row) 
        {
            if (!map[row.id])
                map[row.id] = {};
            map[row.id][row.att] = row.val;        
        })
        .on('error', function(err) 
        {
            console.log("query ERROR "+err);
        })
        .on('end', function(err)
        {
            var tree = tree_from_map(map, id);
            complete(tree);
        });
}


exports.tree_save = tree_save;
exports.tree_load = tree_load;

exports.done = function() {
    db.done();
}

