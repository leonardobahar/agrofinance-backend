import jwt from "jsonwebtoken";

export const generateAccessToken = (username, token_secret)=>{
    return jwt.sign(username, token_secret);
}