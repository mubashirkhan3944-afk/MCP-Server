import express from "express";
import {googleCallback,googleConnect} from '../controller/googlecontroller.js'
const router = express.Router();


// Step A: User ko Google consent screen par bhejna
router.get('/connect',googleConnect);

// Step B: Google ka callback handle karna
router.get('/callback',googleCallback);
  
export default router;