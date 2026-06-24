# API Specification

Base URL

/api/v1

## Search

GET /search

Parameters:

q

Response:

{
  "results":[]
}

## HSN

GET /hsn/{code}

Response:

{
  "hsn":"",
  "description":"",
  "gst_rate":0
}

## Intelligence

POST /intelligence

Request:

{
  "query":""
}

Response:

{
  "answer":"",
  "references":[]
}

## Notifications

GET /notifications

## State Rules

GET /states/{stateCode}/rules

