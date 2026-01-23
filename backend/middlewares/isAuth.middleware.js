import jwt from 'jsonwebtoken';

const isAuth = async (req, res , next) => {
    try{
        const token = req.cookies.token;
        if(!token){
            return res.status(401).json({message : "Unauthorized"})
        }
        // Verify token
        const verifyToken = await jwt.verify(token, process.env.JWT_SECRET);
        if(!verifyToken){
            return res.status(401).json({message : "Unauthorized"})
        }
        req.userId = verifyToken.id;
        next();
    }
    catch(err){
        return res.status(401).json({message : "Unauthorized"})
    }
}
export default isAuth;