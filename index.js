import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import cors from "cors";

const openai = new OpenAI();
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json({ limit: "50mb" }));

app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests from the React app
    credentials: true, // To handle cookies and authentication if needed
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
  })
);

// Route to handle image input and call OpenAI Vision API
app.post("/parse-bill", async (req, res) => {
  const { bill_url } = req.body;

  if (!bill_url) {
    return res.status(400).json({ error: "Image is required." });
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
                url: bill_url,
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

    // TO-DO
    // Front-end
    // take list of persons involved at front-end.
    // Show list of items as well as check boxes for persons.

    // How to display:
    // item, item details, checkboxes list of people.
    //
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
