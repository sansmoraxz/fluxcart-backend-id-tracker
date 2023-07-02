import { Router } from "express";
import dbclient from "./dbclient";
import { IdentityRequest, IdentityResponse } from "./types";
import IdentityProcessor from "./identityprocessor";

const routes = Router();

routes.get("/", (req, res) => {
  return res.json({ message: "Hello World" });
});

routes.post("/identify", async (req, res) => {
  const { phoneNumber, email }: IdentityRequest = req.body;
  const processor = new IdentityProcessor(email, phoneNumber);
  const response: IdentityResponse = await processor.process();
  return res.json(response);
});

export default routes;
