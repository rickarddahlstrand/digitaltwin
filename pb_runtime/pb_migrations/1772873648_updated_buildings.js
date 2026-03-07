/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4269428799")

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "json989021800",
    "maxSize": 5000,
    "name": "categories",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4269428799")

  // remove field
  collection.fields.removeById("json989021800")

  return app.save(collection)
})
