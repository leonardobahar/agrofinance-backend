export const generateAccessToken = (username, token_secret)=>{
    return jwt.sign(username, token_secret, { expiresIn: '5184000s' });
}