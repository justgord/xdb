
drop table if exists uniq;
drop table if exists item;


create table item
(
    id          varchar(64) not null,
    att         varchar(128) not null,
    val         text
);


create index on item (id);
create index on item (att);
