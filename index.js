import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import OpenAI from "openai";

const openai = new OpenAI();
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: "50mb" }));

// Route to handle image input and call OpenAI Vision API
app.post("/parse-bill", async (req, res) => {
  const { base64Image } = req.body;

  if (!base64Image) {
    return res.status(400).json({ error: "Base64 image data is required." });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                " Given is the url of a store bill. Read it. Provide following things from the bill image in JSON format, with key-value pairs. the list of item names and their associated prices as key-value. total bill amount as key value. tax as key-value. Sample response: " +
                '{"items":[{"name":"BOUNTY","price":24.99},{"name":"HBOW/ALMNDS","price":7.89}],"tax":11.76,"total":274.33}',
            },
            {
              type: "image_url",
              image_url: {
                url: "https://my-bills-split-bucket.s3.us-east-2.amazonaws.com/6AF5E9FF-4D9D-4C26-9941-40BDA3411F39_4_5005_c.jpeg",
              },
            },
          ],
        },
      ],
    });

    // Assuming the API returns a list of key-value pairs of item-name and item-price
    const parsedData = response.choices[0];
    const jsonString = response.choices[0].message.content.match(
      /```json\n([\s\S]*)\n```/
    )[1];

    // Parse the JSON string into a JavaScript object
    const billData = JSON.parse(jsonString);

    // Now you can perform operations on the JavaScript object
    console.log(billData);

    // Example operation: Calculate the total price of items
    const totalItemsPrice = billData.items.reduce(
      (sum, item) => sum + item.price,
      0
    );
    console.log("Total price of items:", totalItemsPrice);

    // Example operation: Access the tax and total amount
    console.log("Tax:", billData.tax);
    console.log("Total bill amount:", billData.total);

    res.json(parsedData);
  } catch (error) {
    console.error("Error calling OpenAI Vision API:", error);
    res
      .status(500)
      .json({ error: "Failed to parse the bill. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
