curl -L -X POST '{{host}}/object/category/definition/v4/create' \
-H 'Content-Type: application/json' \
--data-raw '{
  "request": {
    "objectCategoryDefinition": {
      "categoryId": "obj-cat:content-playlist",
      "targetObjectType": "Content",
      "objectMetadata": {
        "config": {},
        "schema": {
          "properties": {
            "mimeType": {
              "type": "string",
              "enum": [
                "application/vnd.ekstep.content-collection"
              ]
            }
          }
        }
      }
    }
  }
}'