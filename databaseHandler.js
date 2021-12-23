const MongoClient = require('mongodb').MongoClient;
const url =  "mongodb+srv://huong:123456@cluster0.vq08y.mongodb.net/test";
const dbName = "Test";

async function getDbo() {
    const client = await MongoClient.connect(url);
    const dbo = client.db(dbName);
    return dbo;
}
async function  searchProduct(condition,collectionName){  
    const dbo = await getDbo();
    const searchCondition = new RegExp(condition,'i')
    var results = await dbo.collection(collectionName).
                            find({name:searchCondition}).toArray();
    return results;
}
async function insertOneIntoCollection(collectionName,documentToInsert){
    const dbo = await getDbo();
    await dbo.collection(collectionName).insertOne(documentToInsert);
}
async function deleteProduct(collectionName,condition) {
    const dbo = await getDbo();
    await dbo.collection(collectionName).deleteOne(condition);
}
async function findOneProduct(collectionName, condition) {
    const dbo = await getDbo();
    const productToEdit = await dbo.collection(collectionName).findOne(condition);
    return productToEdit;
}
async function updateOneProduct(collectionName, condition, newValues) {
    let dbo = await getDbo();
    await dbo.collection(collectionName).updateOne(condition, newValues);
    return dbo;
}
function find(id) {
    var ObjectID = require('mongodb').ObjectID;
    const condition = { "_id": ObjectID(id) };
    return condition;
}
async function checkUser(nameIn,passwordIn){
    const dbo = await getDbo();
    const results = await dbo.collection("users").
        findOne({$and:[{username:nameIn},{password:passwordIn}]});
    if(results !=null)
        return true;
    else
        return false;

}


module.exports = {searchProduct,insertOneIntoCollection, deleteProduct, findOneProduct, updateOneProduct, find, checkUser}