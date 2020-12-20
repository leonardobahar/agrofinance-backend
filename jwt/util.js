import jwt from "jsonwebtoken";

export const generateAccessToken = (userInfo, token_secret)=>{
    return jwt.sign(JSON.stringify(userInfo), token_secret);
}