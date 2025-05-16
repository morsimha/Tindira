import { DynamoDBClient, GetItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import AWS from 'aws-sdk';

const lambda = new AWS.Lambda();
const db = new DynamoDBClient({ region: 'us-east-2' }); // Connect to DynamoDB

export const handler = async (event) => {

  let queryParams = event.queryStringParameters;

  if (!validateParams2(queryParams)) { // Check that query params for users have been passed
    const response = {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify("Parameters haven't been set properly!")
    };
  
    return response;
  }
  
  const params = {
    TableName: "TindiraUsers",
    Key: {
      "username": { S: queryParams.username }
    }
  };
  
  try {
    const getCommand = new GetItemCommand(params); // Check whether the user we want to delete exists
    let res = await db.send(getCommand);
    if (res.Item !== undefined) { // If exists, delete the user
      let regularObj = AWS.DynamoDB.Converter.unmarshall(res.Item);
      await deleteUsersListings(regularObj.listings);
      const command = new DeleteItemCommand(params);
      await db.send(command);
    } else {
      const response = {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify("Attempt to delete user that doesn't exist!")
      };
  
      return response;
    }
  } catch (err) {
      const response = {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(err)
      };
  
    return response;
  }
  
  const response = { // Deletion success
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify("Success"),
  };
  
  return response;
  
};


/*************************************************************************************************************************************************************************************/


function validateParams(query, body) { // Validate query strings and request body
  
  if (query.username === undefined || query.username === "" || body === undefined) {
    return false;
  }

  if (body.username === undefined || body.username === "" || body.token === undefined || body.token === "") {
    return false;
  }
  
  return true;
  
}

function validateParams2(query) { // Validate query strings and request body
  
  if (query.username === undefined || query.username === "") {
    return false;
  }
  
  return true;
  
}


/*************************************************************************************************************************************************************************************/


async function deleteUsersListings(listings) {

  for (var i = 0; i < listings.length; i++) {
    const command = new DeleteItemCommand({
      TableName: "TindiraListings",
      Key: {
        "listingId": { S: listings[i] },
      },
    });
    await db.send(command);
  }

}