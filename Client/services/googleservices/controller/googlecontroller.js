import crypto from "crypto";
import {createGoogleOAuthClient} from '../config/google.config.js'
import userModel from "../../../models/user.js";
import jwt from 'jsonwebtoken'
const SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar.events"
  ];


export async function googleConnect(req,res) {
    const oauth2Client = createGoogleOAuthClient();

    const state = crypto.randomBytes(32).toString("hex");
  
    // CSRF protection ke liye state session mein save karo
    req.session.googleOAuthState = state;
  
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      include_granted_scopes: true,
      prompt: "consent",
      state
    });
  
    res.redirect(authUrl);
}


export async function googleCallback(req,res) {
    try {
        const { code, state, error } = req.query;
    
        if (error) {
          return res.status(400).send("Google authorization denied.");
        }
    
        if (
          !state ||
          state !== req.session.googleOAuthState
        ) {
          return res.status(403).send("Invalid OAuth state.");
        }
    
        delete req.session.googleOAuthState;
    
        const oauth2Client = createGoogleOAuthClient();
    
        // Authorization code ko tokens mein exchange karo
        const {tokens} = await oauth2Client.getToken(code);

        console.log(tokens);

        const ticket = await oauth2Client.verifyIdToken({
          idToken: tokens.id_token,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        
        // User information extract karo
        const userInfo = ticket.getPayload();
    
        const user = await userModel.findOne({email:userInfo.email})

        if(!user){
          const createuser = await userModel.create({
            name:userInfo.name,
            email:userInfo.email,
            refreshToken:tokens.refresh_token,
            accessToken: tokens.access_token,
            idToken: tokens.id_token,
            verified: true,
            authProvider: 'GOOGLE'
          })

          const token = jwt.sign({
          id:user._id
        },process.env.JWT_SECRET)

          res.cookie('Token',token)
        }else{
          const updatedUser = await userModel.findByIdAndUpdate(user._id,{
            $set:{
            refreshToken:tokens.refresh_token,
            accessToken: tokens.access_token,
            idToken: tokens.id_token,
            verified: true,
            authProvider: 'GOOGLE'
          }},{
            new:true
          })

          const token = jwt.sign({
          id:user._id
        },process.env.JWT_SECRET)

          res.cookie('Token',token)
        }
    
        
        res.redirect("http://localhost:5173/");
    
      } catch (error) {
        console.error("Google OAuth error:", error);
        res.status(500).send("Google connection failed.");
      }
}