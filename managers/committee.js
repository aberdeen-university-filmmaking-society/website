var committee = { };
var committeeobj = [
    {
        id:"hello",
        name:"2020-2021 Committee",
        members:[{
                name:"Piers Deseilligny",
                position:"President",
                image:"hello"
            },
            {
                name:"Daniel Mohr",
                position:"Vice-President",
                image:"hello"
            }]
    },
    {
        id:"test",
        name:"2019-2020 Committee",
        members:[{
                name:"Sofia Ferrara",
                position:"President :o",
                image:"hellogfd"
            },
            {
                name:"Piers Deseilligny",
                position:"Vice-President",
                image:"hello"
            }]
    },
    {
        id:"test",
        name:"2018-2019 Committee",
        members:[{
                name:"Sofia Ferrara",
                position:"President :o",
                image:"hellogfd"
            },
            {
                name:"Piers Deseilligny",
                position:"Vice-President",
                image:"hello"
            }]
    },
];

const storage = require('./storage');

committee.load = async function(){
    storage.load("committee", committeeobj, function(newobj){
        committeeobj=newobj;
    });
}
committee.get = function(){
    return committeeobj;
}

committee.save = function(obj, resolve){
    try{
        committeeobj = obj;
        storage.save("committee", committeeobj);
        resolve(null);
    }
    catch(ex){
        resolve(ex);
    }
}

module.exports = committee;