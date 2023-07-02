import { Router } from "express";
import dbclient from "./dbclient";
import { IdentityRequest, IdentityResponse } from "./types";
import IdentityProcessor from "./identityprocessor";

const routes = Router();

routes.get("/", (req, res) => {
  return res.json({ message: "Hello World" });
});

routes.post("/identify", async (req, res) => {
  try {
    let { phoneNumber, email }: IdentityRequest = req.body;
    if(!email) email = undefined;
    if(!phoneNumber) phoneNumber = undefined;
    const processor = new IdentityProcessor(email, phoneNumber);
    const response: IdentityResponse = await processor.process();
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
});

routes.get("/db", async (req, res) => {
  try {
    const result = await dbclient.contact.findMany();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
});

export default routes;
