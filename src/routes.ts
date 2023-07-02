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
    const { phoneNumber, email }: IdentityRequest = req.body;
    const processor = new IdentityProcessor(email, phoneNumber);
    const response: IdentityResponse = await processor.process();
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

routes.get("/db", async (req, res) => {
  try {
    const result = await dbclient.contact.findMany();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default routes;
