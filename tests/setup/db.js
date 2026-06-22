const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

let mongod

const connect = async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
}

const clearDatabase = async () => {
  const { collections } = mongoose.connection
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})))
}

const closeDatabase = async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongod.stop()
}

module.exports = { connect, clearDatabase, closeDatabase }
